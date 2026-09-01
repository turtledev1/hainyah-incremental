import type { TFunction } from 'i18next'
import type { ContentRegistry, UpgradeDefinition } from '../game/model/content'
import type { BuildingId } from '../game/model/ids'
import type { GameState } from '../game/model/state'
import { highestTierUnlockedInAnyCircle } from '../game/systems/magic'
import { purchaseCount } from '../game/systems/upgrades'

export function describeUnmetRequirements(
  upgrade: UpgradeDefinition,
  state: GameState,
  registry: ContentRegistry,
  translate: TFunction,
): readonly string[] {
  const unmet: string[] = []

  for (const prerequisiteId of upgrade.requires.upgradeIds ?? []) {
    if (purchaseCount(state, prerequisiteId) <= 0) {
      unmet.push(
        translate('realm.requiresUpgrade', {
          upgradeName: registry.upgradesById.get(prerequisiteId)?.name ?? prerequisiteId,
        }),
      )
    }
  }

  for (const [buildingId, requiredCount] of Object.entries(upgrade.requires.buildingCounts ?? {})) {
    const owned = state.buildings[buildingId as BuildingId]
    if (owned < (requiredCount ?? 0)) {
      unmet.push(
        translate('realm.requiresBuildings', {
          required: requiredCount ?? 0,
          owned,
          buildingName: registry.buildingsById.get(buildingId as BuildingId)?.name ?? buildingId,
        }),
      )
    }
  }

  const requiredMagicTier = upgrade.requires.anyMagicCircleTier
  if (
    requiredMagicTier !== undefined &&
    highestTierUnlockedInAnyCircle(state, registry) < requiredMagicTier
  ) {
    unmet.push(translate('realm.requiresMagicTier', { tier: requiredMagicTier }))
  }

  const requiredConquestTier = upgrade.requires.conquestTierDefeated
  if (
    requiredConquestTier !== undefined &&
    state.highestConquestTierDefeated < requiredConquestTier
  ) {
    const target = registry.conquestTargets.find(
      (candidate) => candidate.tier === requiredConquestTier,
    )
    unmet.push(
      translate('realm.requiresConquest', {
        targetName: target?.name ?? translate('realm.somewhere'),
      }),
    )
  }

  return unmet
}
