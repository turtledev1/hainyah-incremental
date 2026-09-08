import type { TFunction } from 'i18next'
import { contentKeys } from '../i18n/contentKeys'
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
          upgradeName: translate(contentKeys.upgradeName(prerequisiteId)),
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
          buildingName: translate(contentKeys.buildingName(buildingId as BuildingId)),
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

  const requiredThieveryTier = upgrade.requires.thieveryTierRobbed
  if (
    requiredThieveryTier !== undefined &&
    state.highestThieveryTierRobbed < requiredThieveryTier
  ) {
    const mark = registry.thieveryTargets.find(
      (candidate) => candidate.tier === requiredThieveryTier,
    )
    unmet.push(
      translate('realm.requiresHeist', {
        targetName: mark
          ? translate(contentKeys.thieveryTargetName(mark.id))
          : translate('realm.somewhere'),
      }),
    )
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
        targetName: target
          ? translate(contentKeys.conquestTargetName(target.id))
          : translate('realm.somewhere'),
      }),
    )
  }

  return unmet
}
