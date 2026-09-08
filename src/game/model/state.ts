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
} from './ids'
import type { TranslationValues } from '../../i18n'
import type { Modifier } from './modifiers'

export type GameEventKind =
  | 'construction'
  | 'population'
  | 'magic'
  | 'thievery'
  | 'warfare'
  | 'ascension'
  | 'offline'

/** A key and its values, not a sentence, so a language change re-renders the history. */
export interface GameEvent {
  readonly id: number
  atElapsedSeconds: number
  readonly kind: GameEventKind
  messageKey: string
  values?: TranslationValues
  /** Repeats sharing this key fold into one entry, so a long famine reads as one line. */
  readonly coalesceKey?: string
}

export interface ActiveBuff {
  readonly spellId: SpellId
  remainingSeconds: number
  readonly modifiers: readonly Modifier[]
}

/** A one-shot modifier bundle spent by the next expedition or heist that launches. */
export interface PendingBoost {
  readonly spellId: SpellId
  readonly consumeOn: 'expedition' | 'heist'
  readonly modifiers: readonly Modifier[]
}

export interface ConstructionOrder {
  readonly buildingId: BuildingId
  secondsRemaining: number
  readonly totalSeconds: number
}

export type ExpeditionPhase = 'travelling' | 'returning'

export interface Expedition {
  readonly id: number
  readonly targetId: ConquestTargetId
  soldiers: number
  phase: ExpeditionPhase
  secondsRemaining: number
  totalPhaseSeconds: number
  /** Spell ids, so a save never stores balance numbers a later version contradicts. */
  readonly appliedBoostSpellIds: readonly SpellId[]
  outcomeAcresGained: number
  outcomePlunder: ResourceAmounts
  outcomeSoldiersLost: number
  outcomeSucceeded: boolean
}

export interface Heist {
  readonly id: number
  readonly targetId: ThieveryTargetId
  readonly thieves: number
  secondsRemaining: number
  readonly totalSeconds: number
  readonly appliedBoostSpellIds: readonly SpellId[]
}

export interface MagicState {
  readonly experience: Record<MagicCircleId, number>
  mana: number
  activeBuffs: ActiveBuff[]
  pendingBoosts: PendingBoost[]
  readonly spellCooldowns: Record<SpellId, number>
  transmutationsPerformed: number
}

export interface RunStatistics {
  manualGatherClicks: number
  buildingsConstructed: number
  spellsCast: number
  battlesWon: number
  battlesLost: number
  heistsSucceeded: number
  heistsFailed: number
  citizensStarved: number
  soldiersLost: number
  acresConquered: number
}

export interface GameState {
  readonly saveVersion: number
  readonly startedAtEpochMs: number
  elapsedSeconds: number
  readonly raceId: RaceId
  readonly chosenMagicCircleIds: readonly MagicCircleId[]
  acres: number
  readonly resources: Record<ResourceId, number>
  readonly buildings: Record<BuildingId, number>
  readonly workerAssignments: Record<BuildingId, number>
  population: number
  /** Fractional starvation carried between ticks, spent once it reaches a whole citizen. */
  pendingStarvationDeaths: number
  /** Fractional desertion carried the same way, so slow drift is not floored to nothing. */
  pendingDesertions: number
  /** Running totals so the chronicle reports a trickle of losses as one line, not fifty. */
  starvedSinceFamineBegan: number
  desertedSoldiersSinceLastReport: number
  desertedThievesSinceLastReport: number
  soldiersAtHome: number
  thievesAtHome: number
  readonly magic: MagicState
  constructionQueue: ConstructionOrder[]
  expeditions: Expedition[]
  heists: Heist[]
  readonly purchasedUpgrades: Record<UpgradeId, number>
  /** Improvements the realm has come within reach of; they stay listed once seen. */
  revealedUpgradeIds: UpgradeId[]
  readonly defeatedConquestTargets: Record<ConquestTargetId, number>
  highestConquestTierDefeated: number
  highestThieveryTierRobbed: number
  /** Feeds the resurrection spells, which trade on what the last battle cost you. */
  lastBattleSoldiersLost: number
  completedAscensionStages: number
  hasAscended: boolean
  readonly statistics: RunStatistics
  rngCursor: number
  nextEntityId: number
  eventLog: GameEvent[]
}
