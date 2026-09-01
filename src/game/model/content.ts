import type {
  BuildingId,
  CapacityId,
  ConquestTargetId,
  MagicCircleId,
  RaceId,
  ResourceAmounts,
  ResourceId,
  SpellId,
  ThieveryTargetId,
  UpgradeId,
  UpgradeLineId,
} from './ids'
import type { TranslationValues } from '../../i18n'
import type { Modifier, ModifierIndex } from './modifiers'
import type { GameEventKind, GameState } from './state'

export interface ResourceDefinition {
  readonly id: ResourceId
  readonly name: string
  readonly flavor: string
  /** Present when the resource can be gathered by hand before any building exists. */
  readonly manualGather?: {
    readonly actionLabel: string
    readonly baseAmountPerClick: number
  }
}

export type BuildingEffect =
  | {
      readonly kind: 'produceResource'
      readonly resourceId: ResourceId
      readonly amountPerWorkerPerSecond: number
    }
  | {
      readonly kind: 'grantCapacity'
      readonly capacityId: CapacityId
      readonly amountPerBuilding?: number
      readonly amountPerWorker?: number
    }
  | {
      readonly kind: 'generateMagicExperience'
      readonly experiencePerWorkerPerSecond: number
    }

export interface BuildingDefinition {
  readonly id: BuildingId
  readonly name: string
  readonly flavor: string
  readonly acreCost: number
  /** Flat: the hundredth of something costs what the first did. */
  readonly costs: ResourceAmounts
  readonly baseConstructionSeconds: number
  readonly workerSlotsPerBuilding: number
  /** What a citizen working here is called, so "drill-masters" reads apart from "soldiers". */
  readonly workerRoleName?: string
  readonly effects: readonly BuildingEffect[]
}

export interface MagicCircleAccess {
  /** Circles the race simply has — the Elves' claim on the Dark Circle is not a choice. */
  readonly grantedCircleIds: readonly MagicCircleId[]
  readonly chosenCircleCount: number
  readonly choosableCircleIds: readonly MagicCircleId[]
}

export interface RaceDefinition {
  readonly id: RaceId
  readonly name: string
  readonly tagline: string
  readonly advantages: readonly string[]
  readonly disadvantages: readonly string[]
  readonly magicCircleAccess: MagicCircleAccess
  readonly modifiers: readonly Modifier[]
}

export interface MagicCircleDefinition {
  readonly id: MagicCircleId
  readonly name: string
  readonly flavor: string
  /** Experience needed to reach each tier, index 0 being tier 1. */
  readonly tierExperienceThresholds: readonly number[]
}

export interface SpellEffectContext {
  /** Mutable draft of the current tick's state. */
  readonly state: GameState
  readonly registry: ContentRegistry
  readonly modifiers: ModifierIndex
  readonly random: () => number
  readonly emit: (
    kind: GameEventKind,
    messageKey: string,
    values?: TranslationValues,
  ) => void
}

export type SpellEffect =
  | {
      readonly kind: 'buff'
      /** A burst is short, costly and violent; a sustained buff carries you through an absence. */
      readonly shape: 'sustained' | 'burst'
      readonly durationSeconds: number
      readonly modifiers: readonly Modifier[]
    }
  | {
      readonly kind: 'pendingBoost'
      readonly consumeOn: 'expedition' | 'heist'
      readonly modifiers: readonly Modifier[]
    }
  | {
      readonly kind: 'instant'
      readonly apply: (context: SpellEffectContext) => void
    }

export interface SpellDefinition {
  readonly id: SpellId
  readonly circleId: MagicCircleId
  readonly tier: number
  readonly name: string
  readonly description: string
  readonly manaCost: number
  readonly cooldownSeconds: number
  readonly effect: SpellEffect
}

export interface UpgradeRequirements {
  readonly upgradeIds?: readonly UpgradeId[]
  readonly buildingCounts?: Partial<Record<BuildingId, number>>
  /** Any circle the race can reach, since the choice is made at race selection. */
  readonly anyMagicCircleTier?: number
  readonly conquestTierDefeated?: number
}

export interface UpgradeDefinition {
  readonly id: UpgradeId
  readonly lineId: UpgradeLineId
  readonly name: string
  readonly flavor: string
  readonly costs: ResourceAmounts
  readonly requires: UpgradeRequirements
  readonly modifiers: readonly Modifier[]
  readonly repeatable?: {
    readonly maxPurchases: number
    readonly costGrowth: number
  }
}

export interface UpgradeLineDefinition {
  readonly id: UpgradeLineId
  readonly name: string
  readonly flavor: string
}

export interface ConquestTargetDefinition {
  readonly id: ConquestTargetId
  readonly name: string
  readonly tier: number
  readonly flavor: string
  readonly requiredSoldiers: number
  readonly defenseStrength: number
  readonly acresGained: number
  readonly plunder: ResourceAmounts
  readonly travelSeconds: number
  readonly returnSeconds: number
  /** Times this target can be conquered; the world only holds so many cities. */
  readonly conquestLimit: number
}

export interface ThieveryTargetDefinition {
  readonly id: ThieveryTargetId
  readonly name: string
  readonly tier: number
  readonly flavor: string
  readonly requiredThieves: number
  readonly baseSuccessChance: number
  readonly baseCasualtyRate: number
  readonly durationSeconds: number
  readonly loot: ResourceAmounts
}

export interface AscensionStageDefinition {
  readonly index: number
  readonly name: string
  readonly flavor: string
  readonly costs: ResourceAmounts
}

export interface ContentRegistry {
  readonly resources: readonly ResourceDefinition[]
  readonly resourcesById: ReadonlyMap<ResourceId, ResourceDefinition>
  readonly races: readonly RaceDefinition[]
  readonly racesById: ReadonlyMap<RaceId, RaceDefinition>
  readonly buildings: readonly BuildingDefinition[]
  readonly buildingsById: ReadonlyMap<BuildingId, BuildingDefinition>
  readonly magicCircles: readonly MagicCircleDefinition[]
  readonly magicCirclesById: ReadonlyMap<MagicCircleId, MagicCircleDefinition>
  readonly spells: readonly SpellDefinition[]
  readonly spellsById: ReadonlyMap<SpellId, SpellDefinition>
  readonly upgradeLines: readonly UpgradeLineDefinition[]
  readonly upgrades: readonly UpgradeDefinition[]
  readonly upgradesById: ReadonlyMap<UpgradeId, UpgradeDefinition>
  readonly conquestTargets: readonly ConquestTargetDefinition[]
  readonly conquestTargetsById: ReadonlyMap<ConquestTargetId, ConquestTargetDefinition>
  readonly thieveryTargets: readonly ThieveryTargetDefinition[]
  readonly thieveryTargetsById: ReadonlyMap<ThieveryTargetId, ThieveryTargetDefinition>
  readonly ascensionStages: readonly AscensionStageDefinition[]
}
