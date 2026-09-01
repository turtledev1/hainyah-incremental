import type {
  BuildingId,
  ConquestTargetId,
  MagicCircleId,
  RaceId,
  ResourceId,
  SpellId,
  ThieveryTargetId,
  UpgradeId,
  UpgradeLineId,
} from '../game/model/ids'

/** A message nests one of these with `$t({{key}})`; systems store the key, never the word. */
export const contentKeys = {
  resourceName: (id: ResourceId) => `content.resources.${id}.name`,
  resourceFlavor: (id: ResourceId) => `content.resources.${id}.flavor`,
  gatherAction: (id: ResourceId) => `content.resources.${id}.gatherAction`,

  raceName: (id: RaceId) => `content.races.${id}.name`,
  raceTagline: (id: RaceId) => `content.races.${id}.tagline`,
  raceAdvantages: (id: RaceId) => `content.races.${id}.advantages`,
  raceDisadvantages: (id: RaceId) => `content.races.${id}.disadvantages`,

  buildingName: (id: BuildingId) => `content.buildings.${id}.name`,
  buildingFlavor: (id: BuildingId) => `content.buildings.${id}.flavor`,
  buildingWorkerRole: (id: BuildingId) => `content.buildings.${id}.workerRole`,
  buildingWorkerRoleSingular: (id: BuildingId) =>
    `content.buildings.${id}.workerRoleSingular`,

  circleName: (id: MagicCircleId) => `content.magicCircles.${id}.name`,
  circleFlavor: (id: MagicCircleId) => `content.magicCircles.${id}.flavor`,

  spellName: (id: SpellId) => `content.spells.${id}.name`,
  spellDescription: (id: SpellId) => `content.spells.${id}.description`,

  upgradeLineName: (id: UpgradeLineId) => `content.upgradeLines.${id}.name`,
  upgradeLineFlavor: (id: UpgradeLineId) => `content.upgradeLines.${id}.flavor`,
  upgradeName: (id: UpgradeId) => `content.upgrades.${id}.name`,
  upgradeFlavor: (id: UpgradeId) => `content.upgrades.${id}.flavor`,

  conquestTargetName: (id: ConquestTargetId) => `content.conquestTargets.${id}.name`,
  conquestTargetFlavor: (id: ConquestTargetId) => `content.conquestTargets.${id}.flavor`,

  thieveryTargetName: (id: ThieveryTargetId) => `content.thieveryTargets.${id}.name`,
  thieveryTargetFlavor: (id: ThieveryTargetId) => `content.thieveryTargets.${id}.flavor`,

  ascensionStageName: (index: number) => `content.ascensionStages.stage${index}.name`,
  ascensionStageFlavor: (index: number) => `content.ascensionStages.stage${index}.flavor`,
} as const
