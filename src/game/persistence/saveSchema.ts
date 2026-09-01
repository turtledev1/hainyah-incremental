import type { ContentRegistry } from '../model/content'
import type {
  BuildingId,
  ConquestTargetId,
  MagicCircleId,
  RaceId,
  ResourceAmounts,
  ResourceId,
  SpellId,
  ThieveryTargetId,
  UpgradeId,
} from '../model/ids'
import { BUILDING_IDS, MAGIC_CIRCLE_IDS, RESOURCE_IDS } from '../model/ids'
import type { ExpeditionPhase, GameEvent, GameState, RunStatistics } from '../model/state'

export const CURRENT_SAVE_FORMAT_VERSION = 1

/**
 * Deliberately separate from `GameState`, and free of balance numbers: refactoring the
 * runtime model or re-tuning a spell must not invalidate a save.
 */
export interface PersistedSave {
  readonly formatVersion: number
  readonly savedAtEpochMs: number
  readonly startedAtEpochMs: number
  readonly elapsedSeconds: number
  readonly raceId: RaceId
  readonly chosenMagicCircleIds: readonly MagicCircleId[]
  readonly acres: number
  readonly resources: Record<string, number>
  readonly buildings: Record<string, number>
  readonly workerAssignments: Record<string, number>
  readonly population: number
  readonly pendingStarvationDeaths: number
  readonly pendingDesertions: number
  readonly starvedSinceFamineBegan: number
  readonly desertedSoldiersSinceLastReport: number
  readonly desertedThievesSinceLastReport: number
  readonly soldiersAtHome: number
  readonly thievesAtHome: number
  readonly magicExperience: Record<string, number>
  readonly mana: number
  readonly activeBuffs: readonly { spellId: SpellId; remainingSeconds: number }[]
  readonly pendingBoostSpellIds: readonly SpellId[]
  readonly spellCooldowns: Record<string, number>
  readonly transmutationsPerformed: number
  readonly constructionQueue: readonly {
    buildingId: BuildingId
    secondsRemaining: number
    totalSeconds: number
  }[]
  readonly expeditions: readonly {
    id: number
    targetId: ConquestTargetId
    soldiers: number
    phase: ExpeditionPhase
    secondsRemaining: number
    totalPhaseSeconds: number
    appliedBoostSpellIds: readonly SpellId[]
    outcomeAcresGained: number
    outcomePlunder: ResourceAmounts
    outcomeSoldiersLost: number
    outcomeSucceeded: boolean
  }[]
  readonly heists: readonly {
    id: number
    targetId: ThieveryTargetId
    thieves: number
    secondsRemaining: number
    totalSeconds: number
    appliedBoostSpellIds: readonly SpellId[]
  }[]
  readonly purchasedUpgrades: Record<UpgradeId, number>
  readonly revealedUpgradeIds: readonly UpgradeId[]
  readonly defeatedConquestTargets: Record<ConquestTargetId, number>
  readonly highestConquestTierDefeated: number
  readonly lastBattleSoldiersLost: number
  readonly completedAscensionStages: number
  readonly hasAscended: boolean
  readonly statistics: RunStatistics
  readonly rngCursor: number
  readonly nextEntityId: number
  readonly eventLog: readonly GameEvent[]
}

export function toPersistedSave(state: GameState, savedAtEpochMs: number): PersistedSave {
  return {
    formatVersion: CURRENT_SAVE_FORMAT_VERSION,
    savedAtEpochMs,
    startedAtEpochMs: state.startedAtEpochMs,
    elapsedSeconds: state.elapsedSeconds,
    raceId: state.raceId,
    chosenMagicCircleIds: [...state.chosenMagicCircleIds],
    acres: state.acres,
    resources: { ...state.resources },
    buildings: { ...state.buildings },
    workerAssignments: { ...state.workerAssignments },
    population: state.population,
    pendingStarvationDeaths: state.pendingStarvationDeaths,
    pendingDesertions: state.pendingDesertions,
    starvedSinceFamineBegan: state.starvedSinceFamineBegan,
    desertedSoldiersSinceLastReport: state.desertedSoldiersSinceLastReport,
    desertedThievesSinceLastReport: state.desertedThievesSinceLastReport,
    soldiersAtHome: state.soldiersAtHome,
    thievesAtHome: state.thievesAtHome,
    magicExperience: { ...state.magic.experience },
    mana: state.magic.mana,
    activeBuffs: state.magic.activeBuffs.map((buff) => ({
      spellId: buff.spellId,
      remainingSeconds: buff.remainingSeconds,
    })),
    pendingBoostSpellIds: state.magic.pendingBoosts.map((boost) => boost.spellId),
    spellCooldowns: { ...state.magic.spellCooldowns },
    transmutationsPerformed: state.magic.transmutationsPerformed,
    constructionQueue: state.constructionQueue.map((order) => ({ ...order })),
    expeditions: state.expeditions.map((expedition) => ({
      ...expedition,
      appliedBoostSpellIds: [...expedition.appliedBoostSpellIds],
    })),
    heists: state.heists.map((heist) => ({
      ...heist,
      appliedBoostSpellIds: [...heist.appliedBoostSpellIds],
    })),
    purchasedUpgrades: { ...state.purchasedUpgrades },
    revealedUpgradeIds: [...state.revealedUpgradeIds],
    defeatedConquestTargets: { ...state.defeatedConquestTargets },
    highestConquestTierDefeated: state.highestConquestTierDefeated,
    lastBattleSoldiersLost: state.lastBattleSoldiersLost,
    completedAscensionStages: state.completedAscensionStages,
    hasAscended: state.hasAscended,
    statistics: { ...state.statistics },
    rngCursor: state.rngCursor,
    nextEntityId: state.nextEntityId,
    eventLog: [...state.eventLog],
  }
}

function numbersByKey<TKey extends string>(
  keys: readonly TKey[],
  stored: Record<string, number> | undefined,
): Record<TKey, number> {
  return Object.fromEntries(keys.map((key) => [key, stored?.[key] ?? 0])) as Record<TKey, number>
}

/** Drops anything the current content no longer defines, rather than crashing a run. */
export function fromPersistedSave(save: PersistedSave, registry: ContentRegistry): GameState {
  const knownRaceId = registry.racesById.has(save.raceId) ? save.raceId : registry.races[0]!.id

  return {
    saveVersion: save.formatVersion,
    startedAtEpochMs: save.startedAtEpochMs,
    elapsedSeconds: save.elapsedSeconds,
    raceId: knownRaceId,
    chosenMagicCircleIds: save.chosenMagicCircleIds.filter((circleId) =>
      registry.magicCirclesById.has(circleId),
    ),
    acres: save.acres,
    resources: numbersByKey(RESOURCE_IDS, save.resources) as Record<ResourceId, number>,
    buildings: numbersByKey(BUILDING_IDS, save.buildings) as Record<BuildingId, number>,
    workerAssignments: numbersByKey(BUILDING_IDS, save.workerAssignments) as Record<
      BuildingId,
      number
    >,
    population: save.population,
    pendingStarvationDeaths: save.pendingStarvationDeaths,
    pendingDesertions: save.pendingDesertions ?? 0,
    starvedSinceFamineBegan: save.starvedSinceFamineBegan ?? 0,
    desertedSoldiersSinceLastReport: save.desertedSoldiersSinceLastReport ?? 0,
    desertedThievesSinceLastReport: save.desertedThievesSinceLastReport ?? 0,
    soldiersAtHome: save.soldiersAtHome,
    thievesAtHome: save.thievesAtHome,
    magic: {
      experience: numbersByKey(MAGIC_CIRCLE_IDS, save.magicExperience) as Record<
        MagicCircleId,
        number
      >,
      mana: save.mana,
      activeBuffs: save.activeBuffs.flatMap((buff) => {
        const spell = registry.spellsById.get(buff.spellId)
        if (!spell || spell.effect.kind !== 'buff') {
          return []
        }
        return [
          {
            spellId: spell.id,
            remainingSeconds: buff.remainingSeconds,
            modifiers: spell.effect.modifiers,
          },
        ]
      }),
      pendingBoosts: save.pendingBoostSpellIds.flatMap((spellId) => {
        const spell = registry.spellsById.get(spellId)
        if (!spell || spell.effect.kind !== 'pendingBoost') {
          return []
        }
        return [
          {
            spellId: spell.id,
            consumeOn: spell.effect.consumeOn,
            modifiers: spell.effect.modifiers,
          },
        ]
      }),
      spellCooldowns: { ...save.spellCooldowns },
      transmutationsPerformed: save.transmutationsPerformed,
    },
    constructionQueue: save.constructionQueue
      .filter((order) => registry.buildingsById.has(order.buildingId))
      .map((order) => ({ ...order })),
    expeditions: save.expeditions
      .filter((expedition) => registry.conquestTargetsById.has(expedition.targetId))
      .map((expedition) => ({
        ...expedition,
        appliedBoostSpellIds: [...expedition.appliedBoostSpellIds],
        outcomePlunder: { ...(expedition.outcomePlunder ?? {}) },
      })),
    heists: save.heists
      .filter((heist) => registry.thieveryTargetsById.has(heist.targetId))
      .map((heist) => ({ ...heist, appliedBoostSpellIds: [...heist.appliedBoostSpellIds] })),
    purchasedUpgrades: Object.fromEntries(
      Object.entries(save.purchasedUpgrades).filter(([upgradeId]) =>
        registry.upgradesById.has(upgradeId),
      ),
    ),
    // Anything already adopted has plainly been seen, whatever the save recorded.
    revealedUpgradeIds: [
      ...new Set([...(save.revealedUpgradeIds ?? []), ...Object.keys(save.purchasedUpgrades)]),
    ].filter((upgradeId) => registry.upgradesById.has(upgradeId)),
    defeatedConquestTargets: { ...save.defeatedConquestTargets },
    highestConquestTierDefeated: save.highestConquestTierDefeated,
    lastBattleSoldiersLost: save.lastBattleSoldiersLost,
    completedAscensionStages: save.completedAscensionStages,
    hasAscended: save.hasAscended,
    statistics: { ...save.statistics },
    rngCursor: save.rngCursor,
    nextEntityId: save.nextEntityId,
    eventLog: [...save.eventLog],
  }
}
