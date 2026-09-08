import { BALANCE } from '../content/balance'
import type { MagicCircleId, RaceId } from '../model/ids'
import { BUILDING_IDS, MAGIC_CIRCLE_IDS, RESOURCE_IDS } from '../model/ids'
import type { GameState } from '../model/state'
import { createRandomSeed } from './rng'

export const CURRENT_SAVE_VERSION = 1

export interface NewRunOptions {
  readonly raceId: RaceId
  readonly chosenMagicCircleIds: readonly MagicCircleId[]
  readonly startedAtEpochMs?: number
  readonly rngSeed?: number
}

function zeroedRecord<TKey extends string>(keys: readonly TKey[]): Record<TKey, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<TKey, number>
}

/** Ten empty acres, no buildings, no citizens: everything starts with a click. */
export function createInitialGameState(options: NewRunOptions): GameState {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    startedAtEpochMs: options.startedAtEpochMs ?? Date.now(),
    elapsedSeconds: 0,
    raceId: options.raceId,
    chosenMagicCircleIds: [...options.chosenMagicCircleIds],
    acres: BALANCE.startingAcres,
    resources: zeroedRecord(RESOURCE_IDS),
    buildings: zeroedRecord(BUILDING_IDS),
    workerAssignments: zeroedRecord(BUILDING_IDS),
    population: 0,
    pendingStarvationDeaths: 0,
    pendingDesertions: 0,
    starvedSinceFamineBegan: 0,
    desertedSoldiersSinceLastReport: 0,
    desertedThievesSinceLastReport: 0,
    soldiersAtHome: 0,
    thievesAtHome: 0,
    magic: {
      experience: zeroedRecord(MAGIC_CIRCLE_IDS),
      mana: BALANCE.magic.baseManaCapacity,
      activeBuffs: [],
      pendingBoosts: [],
      spellCooldowns: {},
      transmutationsPerformed: 0,
    },
    constructionQueue: [],
    expeditions: [],
    heists: [],
    purchasedUpgrades: {},
    revealedUpgradeIds: [],
    defeatedConquestTargets: {},
    highestConquestTierDefeated: 0,
    highestThieveryTierRobbed: 0,
    lastBattleSoldiersLost: 0,
    completedAscensionStages: 0,
    hasAscended: false,
    statistics: {
      manualGatherClicks: 0,
      buildingsConstructed: 0,
      spellsCast: 0,
      battlesWon: 0,
      battlesLost: 0,
      heistsSucceeded: 0,
      heistsFailed: 0,
      citizensStarved: 0,
      soldiersLost: 0,
      acresConquered: 0,
    },
    rngCursor: options.rngSeed ?? createRandomSeed(),
    nextEntityId: 1,
    eventLog: [],
  }
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    chosenMagicCircleIds: [...state.chosenMagicCircleIds],
    resources: { ...state.resources },
    buildings: { ...state.buildings },
    workerAssignments: { ...state.workerAssignments },
    magic: {
      ...state.magic,
      experience: { ...state.magic.experience },
      activeBuffs: state.magic.activeBuffs.map((buff) => ({ ...buff })),
      pendingBoosts: state.magic.pendingBoosts.map((boost) => ({ ...boost })),
      spellCooldowns: { ...state.magic.spellCooldowns },
    },
    constructionQueue: state.constructionQueue.map((order) => ({ ...order })),
    expeditions: state.expeditions.map((expedition) => ({ ...expedition })),
    heists: state.heists.map((heist) => ({ ...heist })),
    purchasedUpgrades: { ...state.purchasedUpgrades },
    revealedUpgradeIds: [...state.revealedUpgradeIds],
    defeatedConquestTargets: { ...state.defeatedConquestTargets },
    statistics: { ...state.statistics },
    eventLog: [...state.eventLog],
  }
}
