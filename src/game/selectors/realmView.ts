import { BALANCE } from '../content/balance'
import type {
  AscensionStageDefinition,
  BuildingDefinition,
  ConquestTargetDefinition,
  ContentRegistry,
  MagicCircleDefinition,
  SpellDefinition,
  ThieveryTargetDefinition,
  UpgradeDefinition,
} from '../model/content'
import type { MagicCircleId, ResourceAmounts, ResourceId } from '../model/ids'
import { RESOURCE_IDS } from '../model/ids'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import { capacityOf, workerSlotsTotal } from '../systems/capacity'
import { checkAscensionRefusal, nextAscensionStage } from '../systems/ascension'
import {
  checkConstructionRefusal,
  buildingCost,
  unlockedBulkSteps,
  type ConstructionRefusal,
} from '../systems/construction'
import {
  computeFoodConsumptionPerCitizenPerSecond,
  computeFoodConsumptionPerSecond,
} from '../systems/food'
import { freeAcres, occupiedAcres } from '../systems/land'
import {
  checkCastRefusal,
  currentManaCapacity,
  currentManaRegenerationPerSecond,
  experienceRequiredForNextTier,
  isSpellUnlocked,
  tiersUnlockedInCircle,
  type CastRefusal,
} from '../systems/magic'
import { manualGatherAmount } from '../systems/manualGathering'
import { buildModifierIndexForState, resolveMultiplier } from '../systems/modifiers'
import {
  computeMagicExperiencePerSecond,
  computeProductionPerSecond,
} from '../systems/production'
import {
  computePopulationGrowthPerSecond,
  freeHousingSlots,
  progressTowardsNextCitizen,
  secondsUntilNextCitizen,
} from '../systems/population'
import { canAfford, idleCitizens, soldiersAway, thievesAway } from '../systems/stateHelpers'
import {
  checkHeistRefusal,
  computeSuccessChance,
  type HeistRefusal,
} from '../systems/thievery'
import {
  checkUpgradeRefusal,
  isUpgradeVisible,
  maximumPurchases,
  purchaseCount,
  upgradeCost,
  type UpgradeRefusal,
} from '../systems/upgrades'
import {
  checkExpeditionRefusal,
  computeAttackPowerEstimate,
  computeLegSeconds,
  computeTargetDefenseEstimate,
  isTargetExhausted,
  timesConquered,
  type ExpeditionRefusal,
} from '../systems/warfare'

export interface BuildingView {
  readonly definition: BuildingDefinition
  readonly count: number
  readonly queued: number
  readonly workers: number
  readonly workerSlots: number
  readonly nextCost: ResourceAmounts
  readonly refusal?: ConstructionRefusal
  readonly outputPerWorkerPerSecond: number
  readonly outputResourceId?: ResourceId
}

export interface UpgradeView {
  readonly definition: UpgradeDefinition
  readonly purchases: number
  readonly maximumPurchases: number
  readonly cost: ResourceAmounts
  readonly refusal?: UpgradeRefusal
  readonly isVisible: boolean
}

export interface SpellView {
  readonly definition: SpellDefinition
  readonly isUnlocked: boolean
  readonly cooldownRemainingSeconds: number
  readonly refusal?: CastRefusal
}

export interface MagicCircleView {
  readonly definition: MagicCircleDefinition
  readonly experience: number
  readonly tiersUnlocked: number
  readonly experienceForNextTier?: number
}

export interface ConquestTargetView {
  readonly definition: ConquestTargetDefinition
  readonly timesConquered: number
  readonly isExhausted: boolean
  readonly estimatedAttackPower: number
  readonly estimatedDefense: number
  readonly estimatedLegSeconds: number
  readonly refusalAtRecommendedForce?: ExpeditionRefusal
}

export interface ThieveryTargetView {
  readonly definition: ThieveryTargetDefinition
  readonly successChance: number
  readonly refusal?: HeistRefusal
}

export interface AscensionView {
  readonly nextStage?: AscensionStageDefinition
  readonly completedStages: number
  readonly totalStages: number
  readonly refusal?: ReturnType<typeof checkAscensionRefusal>
}

export interface RealmView {
  readonly modifiers: ModifierIndex
  readonly productionPerSecond: Record<ResourceId, number>
  readonly foodConsumptionPerSecond: number
  /** The total is also zero for an empty realm; only this says whether a people eats. */
  readonly foodConsumptionPerCitizenPerSecond: number
  readonly netFoodPerSecond: number
  readonly manualGatherAmounts: Partial<Record<ResourceId, number>>
  readonly populationCapacity: number
  readonly populationGrowthPerSecond: number
  readonly secondsUntilNextCitizen: number
  readonly progressTowardsNextCitizen: number
  readonly freeHousingSlots: number
  readonly armyCapacity: number
  readonly thievesCapacity: number
  readonly idleCitizens: number
  readonly soldiersAway: number
  readonly thievesAway: number
  readonly manaCapacity: number
  readonly manaRegenPerSecond: number
  readonly magicExperiencePerSecond: number
  readonly occupiedAcres: number
  readonly freeAcres: number
  readonly bulkSteps: readonly number[]
  readonly buildings: readonly BuildingView[]
  readonly upgrades: readonly UpgradeView[]
  readonly spells: readonly SpellView[]
  readonly circles: readonly MagicCircleView[]
  readonly conquestTargets: readonly ConquestTargetView[]
  readonly thieveryTargets: readonly ThieveryTargetView[]
  readonly ascension: AscensionView
}

function primaryOutput(building: BuildingDefinition): {
  resourceId?: ResourceId
  amountPerWorkerPerSecond: number
} {
  for (const effect of building.effects) {
    if (effect.kind === 'produceResource') {
      return {
        resourceId: effect.resourceId,
        amountPerWorkerPerSecond: effect.amountPerWorkerPerSecond,
      }
    }
  }
  return { amountPerWorkerPerSecond: 0 }
}

/** Built from the same functions the tick uses, so no number on screen can disagree. */
export function deriveRealmView(state: GameState, registry: ContentRegistry): RealmView {
  const modifiers = buildModifierIndexForState(state, registry)
  const productionPerSecond = computeProductionPerSecond(state, registry, modifiers)
  const foodConsumptionPerSecond = computeFoodConsumptionPerSecond(state, modifiers)

  const manualGatherAmounts: Partial<Record<ResourceId, number>> = {}
  for (const resourceId of RESOURCE_IDS) {
    const amount = manualGatherAmount(registry, modifiers, resourceId)
    if (amount > 0) {
      manualGatherAmounts[resourceId] = amount
    }
  }

  const buildings: BuildingView[] = registry.buildings.map((definition) => {
    const output = primaryOutput(definition)
    return {
      definition,
      count: state.buildings[definition.id],
      queued: state.constructionQueue.filter((order) => order.buildingId === definition.id).length,
      workers: state.workerAssignments[definition.id],
      workerSlots: workerSlotsTotal(state, registry, definition.id),
      nextCost: buildingCost(registry, modifiers, definition.id),
      refusal: checkConstructionRefusal(state, registry, modifiers, definition.id),
      outputPerWorkerPerSecond:
        output.amountPerWorkerPerSecond *
        resolveMultiplier(modifiers, `buildingOutput.${definition.id}`) *
        (output.resourceId ? resolveMultiplier(modifiers, `production.${output.resourceId}`) : 1),
      outputResourceId: output.resourceId,
    }
  })

  const upgrades: UpgradeView[] = registry.upgrades.map((definition) => ({
    definition,
    purchases: purchaseCount(state, definition.id),
    maximumPurchases: maximumPurchases(definition),
    cost: upgradeCost(state, definition),
    refusal: checkUpgradeRefusal(state, registry, definition.id),
    isVisible: isUpgradeVisible(state, definition),
  }))

  const spells: SpellView[] = registry.spells
    .filter((definition) => state.chosenMagicCircleIds.includes(definition.circleId))
    .map((definition) => ({
      definition,
      isUnlocked: isSpellUnlocked(state, registry, definition),
      cooldownRemainingSeconds: state.magic.spellCooldowns[definition.id] ?? 0,
      refusal: checkCastRefusal(state, registry, definition.id),
    }))

  const circles: MagicCircleView[] = state.chosenMagicCircleIds.flatMap((circleId) => {
    const definition = registry.magicCirclesById.get(circleId as MagicCircleId)
    if (!definition) {
      return []
    }
    return [
      {
        definition,
        experience: state.magic.experience[circleId],
        tiersUnlocked: tiersUnlockedInCircle(state, registry, circleId),
        experienceForNextTier: experienceRequiredForNextTier(state, registry, circleId),
      },
    ]
  })

  const conquestTargets: ConquestTargetView[] = registry.conquestTargets.map((definition) => {
    return {
      definition,
      timesConquered: timesConquered(state, definition.id),
      isExhausted: isTargetExhausted(state, registry, definition.id),
      estimatedAttackPower: computeAttackPowerEstimate(
        state,
        registry,
        definition.recommendedSoldiers,
        true,
      ),
      estimatedDefense: computeTargetDefenseEstimate(state, registry, definition.id, true),
      estimatedLegSeconds: computeLegSeconds(state, registry, definition.id),
      refusalAtRecommendedForce: checkExpeditionRefusal(
        state,
        registry,
        definition.id,
        definition.recommendedSoldiers,
      ),
    }
  })

  const thieveryTargets: ThieveryTargetView[] = registry.thieveryTargets.map((definition) => ({
    definition,
    successChance: computeSuccessChance(state, registry, definition.id),
    refusal: checkHeistRefusal(state, registry, definition.id),
  }))

  return {
    modifiers,
    productionPerSecond,
    foodConsumptionPerSecond,
    foodConsumptionPerCitizenPerSecond: computeFoodConsumptionPerCitizenPerSecond(modifiers),
    netFoodPerSecond: productionPerSecond.food - foodConsumptionPerSecond,
    manualGatherAmounts,
    populationCapacity: capacityOf(state, registry, modifiers, 'population'),
    populationGrowthPerSecond: computePopulationGrowthPerSecond(state, registry, modifiers),
    secondsUntilNextCitizen: secondsUntilNextCitizen(state, registry, modifiers),
    progressTowardsNextCitizen: progressTowardsNextCitizen(state),
    freeHousingSlots: freeHousingSlots(state, registry, modifiers),
    armyCapacity: capacityOf(state, registry, modifiers, 'army'),
    thievesCapacity: capacityOf(state, registry, modifiers, 'thieves'),
    idleCitizens: idleCitizens(state),
    soldiersAway: soldiersAway(state),
    thievesAway: thievesAway(state),
    manaCapacity: currentManaCapacity(state, registry, modifiers),
    manaRegenPerSecond: currentManaRegenerationPerSecond(state, registry, modifiers),
    magicExperiencePerSecond: computeMagicExperiencePerSecond(state, registry, modifiers),
    occupiedAcres: occupiedAcres(state, registry),
    freeAcres: freeAcres(state, registry),
    bulkSteps: unlockedBulkSteps(state),
    buildings,
    upgrades,
    spells,
    circles,
    conquestTargets,
    thieveryTargets,
    ascension: {
      nextStage: nextAscensionStage(state, registry),
      completedStages: state.completedAscensionStages,
      totalStages: registry.ascensionStages.length,
      refusal: checkAscensionRefusal(state, registry),
    },
  }
}

export function canAffordAmounts(state: GameState, amounts: ResourceAmounts): boolean {
  return canAfford(state, amounts)
}
