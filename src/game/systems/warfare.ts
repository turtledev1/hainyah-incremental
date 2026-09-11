import { contentKeys } from '../../i18n/contentKeys'
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
  resolveValue,
  safeDivide,
} from './modifiers'
import { addResources, emitEvent } from './stateHelpers'

export function timesConquered(state: GameState, targetId: ConquestTargetId): number {
  return state.defeatedConquestTargets[targetId] ?? 0
}

export function armiesOutAgainst(state: GameState, targetId: ConquestTargetId): number {
  return state.expeditions.filter((expedition) => expedition.targetId === targetId).length
}

export function armiesInTheField(state: GameState): number {
  return state.expeditions.length
}

export function maximumArmiesInTheField(state: GameState, registry: ContentRegistry): number {
  return Math.floor(
    resolveValue(
      buildModifierIndex(collectActiveModifiers(state, registry)),
      'warfare.campaignSlots',
      BALANCE.warfare.baseArmiesInTheField,
    ),
  )
}

export function freeCampaignSlots(state: GameState, registry: ContentRegistry): number {
  return Math.max(0, maximumArmiesInTheField(state, registry) - armiesInTheField(state))
}

export const EXPEDITION_REFUSALS = [
  'unknownTarget',
  'noCampaignSlotFree',
  'everyPlaceUnderAttack',
  'notEnoughSoldiersAtHome',
  'noSoldiersSent',
] as const

export type ExpeditionRefusal = (typeof EXPEDITION_REFUSALS)[number]

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
  if (freeCampaignSlots(state, registry) <= 0) {
    return 'noCampaignSlotFree'
  }
  if (armiesOutAgainst(state, targetId) >= target.placesInTheWorld) {
    return 'everyPlaceUnderAttack'
  }
  if (soldiers > state.soldiersAtHome) {
    return 'notEnoughSoldiersAtHome'
  }
  if (soldiers < 1) {
    return 'noSoldiersSent'
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
    outcomePlunder: {},
    outcomeSoldiersLost: 0,
    outcomeSucceeded: false,
  })
  emitEvent(state, 'warfare', 'chronicle.marchBegan', {
    count: soldiers,
    targetKey: contentKeys.conquestTargetName(target.id),
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
    state.defeatedConquestTargets[expedition.targetId] = timesConquered(state, expedition.targetId) + 1
    state.highestConquestTierDefeated = Math.max(state.highestConquestTierDefeated, target.tier)
    state.statistics.battlesWon += 1
    expedition.outcomeAcresGained = target.acresGained
    expedition.outcomePlunder = scalePlunder(
      target.plunder,
      resolveMultiplier(index, 'warfare.plunder'),
    )
    emitEvent(
      state,
      'warfare',
      soldiersLost > 0 ? 'chronicle.victoryWithLosses' : 'chronicle.victoryWithoutLosses',
      {
        count: soldiersLost,
        targetKey: contentKeys.conquestTargetName(target.id),
        acres: target.acresGained,
      },
    )
  } else {
    state.statistics.battlesLost += 1
    emitEvent(
      state,
      'warfare',
      soldiersLost > 0 ? 'chronicle.defeatWithLosses' : 'chronicle.defeatWithoutLosses',
      { count: soldiersLost, targetKey: contentKeys.conquestTargetName(target.id) },
    )
  }

  const walkHomeSeconds = safeDivide(
    target.travelSeconds,
    resolveMultiplier(index, 'warfare.travelSpeed'),
  )
  expedition.phase = 'returning'
  expedition.secondsRemaining = walkHomeSeconds
  expedition.totalPhaseSeconds = walkHomeSeconds
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
    if (expedition.outcomeSucceeded) {
      grantAcres(state, expedition.outcomeAcresGained)
      addResources(state, expedition.outcomePlunder)
      state.statistics.acresConquered += expedition.outcomeAcresGained
      emitEvent(
        state,
        'warfare',
        expedition.soldiers > 0
          ? 'chronicle.spoilsArrived'
          : 'chronicle.spoilsArrivedWithoutSurvivors',
        {
          count: expedition.soldiers,
          acres: expedition.outcomeAcresGained,
          targetKey: contentKeys.conquestTargetName(expedition.targetId),
        },
      )
    } else if (expedition.soldiers > 0) {
      emitEvent(state, 'warfare', 'chronicle.soldiersHome', { count: expedition.soldiers })
    }
  }
}

/** An estimate counts boosts already paid for, or a cast spell changes nothing on screen. */
function estimateModifierIndex(
  state: GameState,
  registry: ContentRegistry,
  includePendingBoosts: boolean,
): ModifierIndex {
  const pendingExpeditionModifiers: readonly Modifier[] = includePendingBoosts
    ? state.magic.pendingBoosts
        .filter((boost) => boost.consumeOn === 'expedition')
        .flatMap((boost) => boost.modifiers)
    : []
  return buildModifierIndex([
    ...collectActiveModifiers(state, registry),
    ...pendingExpeditionModifiers,
  ])
}

export function computeAttackPowerEstimate(
  state: GameState,
  registry: ContentRegistry,
  soldiers: number,
  includePendingBoosts: boolean,
): number {
  const index = estimateModifierIndex(state, registry, includePendingBoosts)
  return soldiers * BALANCE.warfare.powerPerSoldier * resolveMultiplier(index, 'warfare.attackPower')
}

export function computeLegSeconds(
  state: GameState,
  registry: ContentRegistry,
  targetId: ConquestTargetId,
): number {
  const target = registry.conquestTargetsById.get(targetId)
  if (!target) {
    return 0
  }
  const index = buildModifierIndex(collectActiveModifiers(state, registry))
  return safeDivide(target.travelSeconds, resolveMultiplier(index, 'warfare.travelSpeed'))
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
  const index = estimateModifierIndex(state, registry, includePendingBoosts)
  return target.defenseStrength * resolveMultiplier(index, 'warfare.targetDefense')
}

export function computePlunderEstimate(
  state: GameState,
  registry: ContentRegistry,
  targetId: ConquestTargetId,
  includePendingBoosts: boolean,
): ResourceAmounts {
  const target = registry.conquestTargetsById.get(targetId)
  if (!target) {
    return {}
  }
  const index = estimateModifierIndex(state, registry, includePendingBoosts)
  return scalePlunder(target.plunder, resolveMultiplier(index, 'warfare.plunder'))
}
