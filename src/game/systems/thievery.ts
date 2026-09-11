import { contentKeys } from '../../i18n/contentKeys'
import { BALANCE } from '../content/balance'
import type { ContentRegistry } from '../model/content'
import type { ResourceAmounts, ResourceId, ThieveryTargetId } from '../model/ids'
import type { Modifier } from '../model/modifiers'
import type { GameState, Heist } from '../model/state'
import type { TickContext } from '../model/tick'
import { consumePendingBoosts, modifiersFromSpellIds } from './magic'
import {
  buildModifierIndex,
  collectActiveModifiers,
  resolveMultiplier,
  safeDivide,
} from './modifiers'
import { addResources, emitEvent } from './stateHelpers'

export const HEIST_REFUSALS = [
  'unknownTarget',
  'notEnoughThievesAtHome',
] as const

export type HeistRefusal = (typeof HEIST_REFUSALS)[number]

export function checkHeistRefusal(
  state: GameState,
  registry: ContentRegistry,
  targetId: ThieveryTargetId,
): HeistRefusal | undefined {
  const target = registry.thieveryTargetsById.get(targetId)
  if (!target) {
    return 'unknownTarget'
  }
  if (state.thievesAtHome < target.requiredThieves) {
    return 'notEnoughThievesAtHome'
  }
  return undefined
}

export function computeSuccessChance(
  state: GameState,
  registry: ContentRegistry,
  targetId: ThieveryTargetId,
  extraModifiers: readonly Modifier[] = [],
): number {
  const target = registry.thieveryTargetsById.get(targetId)
  if (!target) {
    return 0
  }
  const index = buildModifierIndex([...collectActiveModifiers(state, registry), ...extraModifiers])
  const chance = target.baseSuccessChance * resolveMultiplier(index, 'thievery.successChance')
  return Math.max(
    BALANCE.thievery.minimumSuccessChance,
    Math.min(BALANCE.thievery.maximumSuccessChance, chance),
  )
}

/** A real haul rolls between the minimum fraction and the full amount; this is the top of it. */
export function computeBestLootEstimate(
  state: GameState,
  registry: ContentRegistry,
  targetId: ThieveryTargetId,
  extraModifiers: readonly Modifier[] = [],
): ResourceAmounts {
  const target = registry.thieveryTargetsById.get(targetId)
  if (!target) {
    return {}
  }
  const index = buildModifierIndex([...collectActiveModifiers(state, registry), ...extraModifiers])
  return scaleLoot(target.loot, resolveMultiplier(index, 'thievery.loot'))
}

export function computeHeistSeconds(
  state: GameState,
  registry: ContentRegistry,
  targetId: ThieveryTargetId,
  extraModifiers: readonly Modifier[] = [],
): number {
  const target = registry.thieveryTargetsById.get(targetId)
  if (!target) {
    return 0
  }
  const index = buildModifierIndex([...collectActiveModifiers(state, registry), ...extraModifiers])
  return safeDivide(target.durationSeconds, resolveMultiplier(index, 'thievery.speed'))
}

export function launchHeist(
  state: GameState,
  registry: ContentRegistry,
  targetId: ThieveryTargetId,
): HeistRefusal | undefined {
  const refusal = checkHeistRefusal(state, registry, targetId)
  if (refusal) {
    return refusal
  }
  const target = registry.thieveryTargetsById.get(targetId)!

  const appliedBoostSpellIds = consumePendingBoosts(state, 'heist')
  const durationSeconds = computeHeistSeconds(
    state,
    registry,
    targetId,
    modifiersFromSpellIds(registry, appliedBoostSpellIds),
  )

  state.thievesAtHome -= target.requiredThieves
  state.heists.push({
    id: state.nextEntityId++,
    targetId,
    thieves: target.requiredThieves,
    secondsRemaining: durationSeconds,
    totalSeconds: durationSeconds,
    appliedBoostSpellIds,
  })
  emitEvent(state, 'thievery', 'chronicle.heistBegan', {
    count: target.requiredThieves,
    targetKey: contentKeys.thieveryTargetName(target.id),
  })
  return undefined
}

function scaleLoot(loot: ResourceAmounts, multiplier: number): ResourceAmounts {
  const scaled: ResourceAmounts = {}
  for (const [resourceId, amount] of Object.entries(loot)) {
    scaled[resourceId as ResourceId] = (amount ?? 0) * multiplier
  }
  return scaled
}

function resolveHeist(
  state: GameState,
  registry: ContentRegistry,
  heist: Heist,
  random: () => number,
): void {
  const target = registry.thieveryTargetsById.get(heist.targetId)
  if (!target) {
    state.thievesAtHome += heist.thieves
    return
  }

  const boostModifiers = modifiersFromSpellIds(registry, heist.appliedBoostSpellIds)
  const index = buildModifierIndex([...collectActiveModifiers(state, registry), ...boostModifiers])
  const successChance = computeSuccessChance(state, registry, heist.targetId, boostModifiers)
  const succeeded = random() < successChance

  const casualtyRate =
    target.baseCasualtyRate *
    resolveMultiplier(index, 'thievery.casualtyRate') *
    (succeeded ? 1 : 1.5)
  const thievesLost = Math.min(
    heist.thieves,
    Math.floor(heist.thieves * Math.max(0, Math.min(1, casualtyRate)) + random()),
  )
  const survivors = heist.thieves - thievesLost

  state.thievesAtHome += survivors
  if (thievesLost > 0) {
    state.population = Math.max(0, state.population - thievesLost)
  }

  if (succeeded) {
    const lootFraction =
      BALANCE.thievery.minimumLootFraction +
      random() * (1 - BALANCE.thievery.minimumLootFraction)
    addResources(
      state,
      scaleLoot(target.loot, lootFraction * resolveMultiplier(index, 'thievery.loot')),
    )
    state.statistics.heistsSucceeded += 1
    state.highestThieveryTierRobbed = Math.max(state.highestThieveryTierRobbed, target.tier)
    emitEvent(
      state,
      'thievery',
      thievesLost > 0 ? 'chronicle.heistCleanWithLosses' : 'chronicle.heistCleanWithoutLosses',
      { count: thievesLost, targetKey: contentKeys.thieveryTargetName(target.id) },
    )
  } else {
    state.statistics.heistsFailed += 1
    emitEvent(
      state,
      'thievery',
      thievesLost > 0 ? 'chronicle.heistBotchedWithLosses' : 'chronicle.heistBotchedWithoutLosses',
      { count: thievesLost, targetKey: contentKeys.thieveryTargetName(target.id) },
    )
  }
}

export const advanceHeists = ({ state, registry, deltaSeconds, random }: TickContext): void => {
  if (state.heists.length === 0) {
    return
  }

  for (const heist of state.heists) {
    heist.secondsRemaining -= deltaSeconds
  }

  const completed = state.heists.filter((heist) => heist.secondsRemaining <= 0)
  if (completed.length === 0) {
    return
  }

  state.heists = state.heists.filter((heist) => heist.secondsRemaining > 0)
  for (const heist of completed) {
    resolveHeist(state, registry, heist, random)
  }
}
