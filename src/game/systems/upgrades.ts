import { BALANCE } from '../content/balance'
import type { ContentRegistry, UpgradeDefinition } from '../model/content'
import type { BuildingId, ResourceAmounts, ResourceId, UpgradeId } from '../model/ids'
import { RESOURCE_IDS } from '../model/ids'
import type { GameState } from '../model/state'
import { highestTierUnlockedInAnyCircle } from './magic'
import { canAfford, emitEvent, payCosts } from './stateHelpers'

export function purchaseCount(state: GameState, upgradeId: UpgradeId): number {
  return state.purchasedUpgrades[upgradeId] ?? 0
}

export function maximumPurchases(upgrade: UpgradeDefinition): number {
  return upgrade.repeatable?.maxPurchases ?? 1
}

export function upgradeCost(state: GameState, upgrade: UpgradeDefinition): ResourceAmounts {
  const alreadyBought = purchaseCount(state, upgrade.id)
  const growth = upgrade.repeatable?.costGrowth ?? 1
  const multiplier = Math.pow(growth, alreadyBought)

  const cost: ResourceAmounts = {}
  for (const [resourceId, amount] of Object.entries(upgrade.costs)) {
    cost[resourceId as ResourceId] = Math.ceil((amount ?? 0) * multiplier)
  }
  return cost
}

export const UPGRADE_REFUSALS = [
  'unknownUpgrade',
  'alreadyAtMaximum',
  'missingPrerequisiteUpgrade',
  'missingBuildings',
  'magicTierTooLow',
  'conquestTierTooLow',
  'cannotAffordCost',
] as const

export type UpgradeRefusal = (typeof UPGRADE_REFUSALS)[number]

export function checkUpgradeRefusal(
  state: GameState,
  registry: ContentRegistry,
  upgradeId: UpgradeId,
): UpgradeRefusal | undefined {
  const upgrade = registry.upgradesById.get(upgradeId)
  if (!upgrade) {
    return 'unknownUpgrade'
  }
  if (purchaseCount(state, upgradeId) >= maximumPurchases(upgrade)) {
    return 'alreadyAtMaximum'
  }
  for (const prerequisiteId of upgrade.requires.upgradeIds ?? []) {
    if (purchaseCount(state, prerequisiteId) <= 0) {
      return 'missingPrerequisiteUpgrade'
    }
  }
  for (const [buildingId, requiredCount] of Object.entries(upgrade.requires.buildingCounts ?? {})) {
    if (state.buildings[buildingId as keyof GameState['buildings']] < (requiredCount ?? 0)) {
      return 'missingBuildings'
    }
  }
  if (
    upgrade.requires.anyMagicCircleTier !== undefined &&
    highestTierUnlockedInAnyCircle(state, registry) < upgrade.requires.anyMagicCircleTier
  ) {
    return 'magicTierTooLow'
  }
  if (
    upgrade.requires.conquestTierDefeated !== undefined &&
    state.highestConquestTierDefeated < upgrade.requires.conquestTierDefeated
  ) {
    return 'conquestTierTooLow'
  }
  if (!canAfford(state, upgradeCost(state, upgrade))) {
    return 'cannotAffordCost'
  }
  return undefined
}

/** Only records the purchase; the modifiers reach the game on the next tick. */
export function purchaseUpgrade(
  state: GameState,
  registry: ContentRegistry,
  upgradeId: UpgradeId,
): UpgradeRefusal | undefined {
  const refusal = checkUpgradeRefusal(state, registry, upgradeId)
  if (refusal) {
    return refusal
  }
  const upgrade = registry.upgradesById.get(upgradeId)!

  payCosts(state, upgradeCost(state, upgrade))
  state.purchasedUpgrades[upgradeId] = purchaseCount(state, upgradeId) + 1
  emitEvent(state, 'construction', 'chronicle.upgradeAdopted', { upgradeName: upgrade.name })
  return undefined
}

export function isUpgradeVisible(state: GameState, upgrade: UpgradeDefinition): boolean {
  return state.revealedUpgradeIds.includes(upgrade.id) || purchaseCount(state, upgrade.id) > 0
}

/** Listing every improvement from the first minute buries the two that matter. */
export function isUpgradeWithinReach(
  state: GameState,
  registry: ContentRegistry,
  upgrade: UpgradeDefinition,
): boolean {
  for (const prerequisiteId of upgrade.requires.upgradeIds ?? []) {
    if (purchaseCount(state, prerequisiteId) <= 0) {
      return false
    }
  }

  for (const [buildingId, requiredCount] of Object.entries(upgrade.requires.buildingCounts ?? {})) {
    if ((requiredCount ?? 0) > 0 && state.buildings[buildingId as BuildingId] < 1) {
      return false
    }
  }

  if (
    upgrade.requires.anyMagicCircleTier !== undefined &&
    highestTierUnlockedInAnyCircle(state, registry) < upgrade.requires.anyMagicCircleTier
  ) {
    return false
  }
  if (
    upgrade.requires.conquestTierDefeated !== undefined &&
    state.highestConquestTierDefeated < upgrade.requires.conquestTierDefeated
  ) {
    return false
  }

  const cost = upgradeCost(state, upgrade)
  return RESOURCE_IDS.every(
    (resourceId) =>
      state.resources[resourceId] >=
      (cost[resourceId] ?? 0) * BALANCE.upgrades.revealAtCostFraction,
  )
}

export const revealUpgrades = ({
  state,
  registry,
}: {
  state: GameState
  registry: ContentRegistry
}): void => {
  for (const upgrade of registry.upgrades) {
    if (state.revealedUpgradeIds.includes(upgrade.id)) {
      continue
    }
    if (!isUpgradeWithinReach(state, registry, upgrade)) {
      continue
    }
    state.revealedUpgradeIds.push(upgrade.id)
    emitEvent(state, 'construction', 'chronicle.upgradeAvailable', { upgradeName: upgrade.name })
  }
}
