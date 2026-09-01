import { BALANCE } from '../content/balance'
import type { ContentRegistry } from '../model/content'
import type { ConquestTargetId, ResourceAmounts, ResourceId } from '../model/ids'
import type { Modifier, ModifierIndex } from '../model/modifiers'
import type { Expedition, GameState } from '../model/state'
import type { TickContext } from '../model/tick'
import { grantAcres } from './land'
import { consumePendingBoosts, modifiersFromSpellIds } from './magic'
import {
  buildModifierIndex,
  collectActiveModifiers,
  resolveMultiplier,
  safeDivide,
} from './modifiers'
import { addResources, emitEvent } from './stateHelpers'

export function timesConquered(state: GameState, targetId: ConquestTargetId): number {
  return state.defeatedConquestTargets[targetId] ?? 0
}

export function isTargetExhausted(
  state: GameState,
  registry: ContentRegistry,
  targetId: ConquestTargetId,
): boolean {
  const target = registry.conquestTargetsById.get(targetId)
  if (!target) {
    return true
  }
  return timesConquered(state, targetId) >= target.conquestLimit
}

export type ExpeditionRefusal =
  | 'unknownTarget'
  | 'targetExhausted'
  | 'notEnoughSoldiersAtHome'
  | 'belowRequiredForce'

export function describeExpeditionRefusal(refusal: ExpeditionRefusal): string {
  switch (refusal) {
    case 'unknownTarget':
      return 'No such place.'
    case 'targetExhausted':
      return 'There is nothing left there to take.'
    case 'notEnoughSoldiersAtHome':
      return 'You do not have that many soldiers at home.'
    case 'belowRequiredForce':
      return 'Too few soldiers to be worth the march.'
  }
}

export function checkExpeditionRefusal(
  state: GameState,
  registry: ContentRegistry,
  targetId: ConquestTargetId,
  soldiers: number,
): ExpeditionRefusal | undefined {
  const target = registry.conquestTargetsById.get(targetId)
  if (!target) {
    return 'unknownTarget'
  }
  if (isTargetExhausted(state, registry, targetId)) {
    return 'targetExhausted'
  }
  if (soldiers > state.soldiersAtHome) {
    return 'notEnoughSoldiersAtHome'
  }
  if (soldiers < target.requiredSoldiers) {
    return 'belowRequiredForce'
  }
  return undefined
}

export function launchExpedition(
  state: GameState,
  registry: ContentRegistry,
  targetId: ConquestTargetId,
  soldiers: number,
): ExpeditionRefusal | undefined {
  const refusal = checkExpeditionRefusal(state, registry, targetId, soldiers)
  if (refusal) {
    return refusal
  }
  const target = registry.conquestTargetsById.get(targetId)!

  const appliedBoostSpellIds = consumePendingBoosts(state, 'expedition')
  const combinedIndex = buildModifierIndex([
    ...collectActiveModifiers(state, registry),
    ...modifiersFromSpellIds(registry, appliedBoostSpellIds),
  ])
  const travelSeconds = safeDivide(
    target.travelSeconds,
    resolveMultiplier(combinedIndex, 'warfare.travelSpeed'),
  )

  state.soldiersAtHome -= soldiers
  state.expeditions.push({
    id: state.nextEntityId++,
    targetId,
    soldiers,
    phase: 'travelling',
    secondsRemaining: travelSeconds,
    totalPhaseSeconds: travelSeconds,
    appliedBoostSpellIds,
    outcomeAcresGained: 0,
    outcomeSoldiersLost: 0,
    outcomeSucceeded: false,
  })
  emitEvent(state, 'warfare', 'chronicle.marchBegan', {
    count: soldiers,
    targetName: target.name,
    arrivalSeconds: travelSeconds,
  })
  return undefined
}

function scalePlunder(plunder: ResourceAmounts, multiplier: number): ResourceAmounts {
  const scaled: ResourceAmounts = {}
  for (const [resourceId, amount] of Object.entries(plunder)) {
    scaled[resourceId as ResourceId] = (amount ?? 0) * multiplier
  }
  return scaled
}

function resolveBattle(
  state: GameState,
  registry: ContentRegistry,
  expedition: Expedition,
  random: () => number,
): void {
  const target = registry.conquestTargetsById.get(expedition.targetId)
  if (!target) {
    expedition.phase = 'returning'
    expedition.secondsRemaining = 0
    return
  }

  const index = buildModifierIndex([
    ...collectActiveModifiers(state, registry),
    ...modifiersFromSpellIds(registry, expedition.appliedBoostSpellIds),
  ])

  const variance = BALANCE.warfare.attackPowerVariance
  const varianceRoll = 1 - variance + random() * variance * 2
  const attackPower =
    expedition.soldiers *
    BALANCE.warfare.powerPerSoldier *
    resolveMultiplier(index, 'warfare.attackPower') *
    varianceRoll
  const targetDefense = target.defenseStrength * resolveMultiplier(index, 'warfare.targetDefense')

  const succeeded = attackPower >= targetDefense
  const strengthRatio = Math.min(3, safeDivide(targetDefense, Math.max(attackPower, 0.0001)))
  const baseCasualtyRate = succeeded
    ? BALANCE.warfare.baseCasualtyRateOnVictory
    : BALANCE.warfare.baseCasualtyRateOnDefeat
  const casualtyRate =
    baseCasualtyRate * strengthRatio * resolveMultiplier(index, 'warfare.casualtyRate')
  const soldiersLost = Math.min(
    expedition.soldiers,
    Math.floor(expedition.soldiers * Math.max(0, Math.min(1, casualtyRate))),
  )

  expedition.soldiers -= soldiersLost
  expedition.outcomeSoldiersLost = soldiersLost
  expedition.outcomeSucceeded = succeeded
  state.population = Math.max(0, state.population - soldiersLost)
  state.statistics.soldiersLost += soldiersLost
  state.lastBattleSoldiersLost = soldiersLost

  if (succeeded) {
    grantAcres(state, target.acresGained)
    addResources(state, scalePlunder(target.plunder, resolveMultiplier(index, 'warfare.plunder')))
    state.defeatedConquestTargets[expedition.targetId] = timesConquered(state, expedition.targetId) + 1
    state.highestConquestTierDefeated = Math.max(state.highestConquestTierDefeated, target.tier)
    state.statistics.battlesWon += 1
    state.statistics.acresConquered += target.acresGained
    expedition.outcomeAcresGained = target.acresGained
    emitEvent(
      state,
      'warfare',
      soldiersLost > 0 ? 'chronicle.victoryWithLosses' : 'chronicle.victoryWithoutLosses',
      { count: soldiersLost, targetName: target.name, acres: target.acresGained },
    )
  } else {
    state.statistics.battlesLost += 1
    emitEvent(
      state,
      'warfare',
      soldiersLost > 0 ? 'chronicle.defeatWithLosses' : 'chronicle.defeatWithoutLosses',
      { count: soldiersLost, targetName: target.name },
    )
  }

  const returnSeconds = safeDivide(
    target.returnSeconds,
    resolveMultiplier(index, 'warfare.returnSpeed'),
  )
  expedition.phase = 'returning'
  expedition.secondsRemaining = returnSeconds
}

export const advanceExpeditions = ({ state, registry, deltaSeconds, random }: TickContext): void => {
  if (state.expeditions.length === 0) {
    return
  }

  for (const expedition of state.expeditions) {
    expedition.secondsRemaining -= deltaSeconds
    if (expedition.phase !== 'travelling' || expedition.secondsRemaining > 0) {
      continue
    }
    // Time past arrival belongs to the journey home; offline steps are a minute long.
    const secondsPastArrival = -expedition.secondsRemaining
    resolveBattle(state, registry, expedition, random)
    expedition.secondsRemaining -= secondsPastArrival
  }

  const arrived = state.expeditions.filter(
    (expedition) => expedition.phase === 'returning' && expedition.secondsRemaining <= 0,
  )
  if (arrived.length === 0) {
    return
  }

  state.expeditions = state.expeditions.filter((expedition) => !arrived.includes(expedition))
  for (const expedition of arrived) {
    state.soldiersAtHome += expedition.soldiers
    if (expedition.soldiers > 0) {
      emitEvent(state, 'warfare', 'chronicle.soldiersHome', { count: expedition.soldiers })
    }
  }
}

export function computeAttackPowerEstimate(
  state: GameState,
  registry: ContentRegistry,
  soldiers: number,
  includePendingBoosts: boolean,
): number {
  const pendingExpeditionModifiers: readonly Modifier[] = includePendingBoosts
    ? state.magic.pendingBoosts
        .filter((boost) => boost.consumeOn === 'expedition')
        .flatMap((boost) => boost.modifiers)
    : []
  const index = buildModifierIndex([
    ...collectActiveModifiers(state, registry),
    ...pendingExpeditionModifiers,
  ])
  return soldiers * BALANCE.warfare.powerPerSoldier * resolveMultiplier(index, 'warfare.attackPower')
}

export function computeTargetDefenseEstimate(
  state: GameState,
  registry: ContentRegistry,
  targetId: ConquestTargetId,
  includePendingBoosts: boolean,
): number {
  const target = registry.conquestTargetsById.get(targetId)
  if (!target) {
    return 0
  }
  const pendingExpeditionModifiers: readonly Modifier[] = includePendingBoosts
    ? state.magic.pendingBoosts
        .filter((boost) => boost.consumeOn === 'expedition')
        .flatMap((boost) => boost.modifiers)
    : []
  const index = buildModifierIndex([
    ...collectActiveModifiers(state, registry),
    ...pendingExpeditionModifiers,
  ])
  return target.defenseStrength * resolveMultiplier(index, 'warfare.targetDefense')
}
