import type { UpgradeDefinition, UpgradeLineDefinition } from '../model/content'
import { RESOURCE_IDS } from '../model/ids'
import type { Modifier } from '../model/modifiers'

export const UPGRADE_LINE_DEFINITIONS: readonly UpgradeLineDefinition[] = [
  { id: 'housing' },
  { id: 'farming' },
  { id: 'woodcutting' },
  { id: 'quarrying' },
  { id: 'mining' },
  { id: 'preservation' },
  { id: 'logistics' },
  { id: 'masonry' },
  { id: 'military' },
  { id: 'thievery' },
  { id: 'arcana' },
  { id: 'gathering' },
  { id: 'fortification' },
  { id: 'bribery' },
]

const allProductionModifiers = (multiplier: number): readonly Modifier[] =>
  RESOURCE_IDS.map((resourceId) => ({
    target: `production.${resourceId}` as const,
    operation: 'multiply' as const,
    value: multiplier,
  }))

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'housing.timberFrames',
    lineId: 'housing',
    costs: { wood: 400, stone: 120 },
    requires: { buildingCounts: { house: 3 } },
    modifiers: [{ target: 'capacity.population', operation: 'multiply', value: 1.4 }],
  },
  {
    id: 'housing.stoneHouses',
    lineId: 'housing',
    costs: { wood: 2_500, stone: 4_000, gold: 800 },
    requires: { upgradeIds: ['housing.timberFrames'], buildingCounts: { house: 8 } },
    modifiers: [{ target: 'capacity.population', operation: 'multiply', value: 2.2 }],
  },
  {
    id: 'housing.manorHalls',
    lineId: 'housing',
    costs: { wood: 40_000, stone: 60_000, gold: 20_000 },
    requires: {
      upgradeIds: ['housing.stoneHouses'],
      buildingCounts: { house: 20 },
      conquestTierDefeated: 2,
    },
    modifiers: [{ target: 'capacity.population', operation: 'multiply', value: 4 }],
  },

  {
    id: 'farming.ironPlows',
    lineId: 'farming',
    costs: { wood: 300, gold: 150 },
    requires: { buildingCounts: { farm: 2 } },
    modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 1.3 }],
  },
  {
    id: 'farming.cropRotation',
    lineId: 'farming',
    costs: { wood: 2_000, food: 3_000, gold: 1_200 },
    requires: { upgradeIds: ['farming.ironPlows'], buildingCounts: { farm: 5 } },
    modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 1.8 }],
  },
  {
    id: 'farming.aqueducts',
    lineId: 'farming',
    costs: { stone: 45_000, wood: 20_000, gold: 15_000 },
    requires: { upgradeIds: ['farming.cropRotation'], buildingCounts: { farm: 12 } },
    modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 2.7 }],
  },

  {
    id: 'woodcutting.bronzeAxes',
    lineId: 'woodcutting',
    costs: { wood: 250, gold: 120 },
    requires: { buildingCounts: { lumberCamp: 2 } },
    modifiers: [{ target: 'buildingOutput.lumberCamp', operation: 'multiply', value: 1.3 }],
  },
  {
    id: 'woodcutting.steelAxes',
    lineId: 'woodcutting',
    costs: { wood: 1_800, stone: 900, gold: 1_400 },
    requires: { upgradeIds: ['woodcutting.bronzeAxes'], buildingCounts: { lumberCamp: 5 } },
    modifiers: [{ target: 'buildingOutput.lumberCamp', operation: 'multiply', value: 1.8 }],
  },
  {
    id: 'woodcutting.whipsaws',
    lineId: 'woodcutting',
    costs: { wood: 30_000, stone: 18_000, gold: 22_000 },
    requires: { upgradeIds: ['woodcutting.steelAxes'], buildingCounts: { lumberCamp: 12 } },
    modifiers: [{ target: 'buildingOutput.lumberCamp', operation: 'multiply', value: 2.7 }],
  },

  {
    id: 'quarrying.ironChisels',
    lineId: 'quarrying',
    costs: { wood: 200, gold: 180 },
    requires: { buildingCounts: { quarry: 2 } },
    modifiers: [{ target: 'buildingOutput.quarry', operation: 'multiply', value: 1.3 }],
  },
  {
    id: 'quarrying.wedgeAndFeather',
    lineId: 'quarrying',
    costs: { wood: 1_500, stone: 1_200, gold: 1_500 },
    requires: { upgradeIds: ['quarrying.ironChisels'], buildingCounts: { quarry: 5 } },
    modifiers: [{ target: 'buildingOutput.quarry', operation: 'multiply', value: 1.8 }],
  },
  {
    id: 'quarrying.cranes',
    lineId: 'quarrying',
    costs: { wood: 35_000, stone: 25_000, gold: 20_000 },
    requires: { upgradeIds: ['quarrying.wedgeAndFeather'], buildingCounts: { quarry: 12 } },
    modifiers: [{ target: 'buildingOutput.quarry', operation: 'multiply', value: 2.7 }],
  },

  {
    id: 'mining.ironPicks',
    lineId: 'mining',
    costs: { wood: 400, stone: 300, gold: 200 },
    requires: { buildingCounts: { mine: 2 } },
    modifiers: [{ target: 'buildingOutput.mine', operation: 'multiply', value: 1.3 }],
  },
  {
    id: 'mining.steelPicks',
    lineId: 'mining',
    costs: { wood: 2_500, stone: 2_500, gold: 2_000 },
    requires: { upgradeIds: ['mining.ironPicks'], buildingCounts: { mine: 5 } },
    modifiers: [{ target: 'buildingOutput.mine', operation: 'multiply', value: 1.8 }],
  },
  {
    id: 'mining.blastingPowder',
    lineId: 'mining',
    costs: { wood: 40_000, stone: 40_000, gold: 35_000 },
    requires: {
      upgradeIds: ['mining.steelPicks'],
      buildingCounts: { mine: 12 },
      anyMagicCircleTier: 2,
    },
    modifiers: [{ target: 'buildingOutput.mine', operation: 'multiply', value: 2.9 }],
  },

  {
    id: 'preservation.rootCellars',
    lineId: 'preservation',
    costs: { wood: 350, stone: 350 },
    requires: { buildingCounts: { farm: 3 } },
    modifiers: [{ target: 'consumption.food', operation: 'multiply', value: 0.9 }],
  },
  {
    id: 'preservation.granaries',
    lineId: 'preservation',
    costs: { wood: 3_000, stone: 3_000, gold: 1_000 },
    requires: { upgradeIds: ['preservation.rootCellars'], buildingCounts: { farm: 8 } },
    modifiers: [{ target: 'consumption.food', operation: 'multiply', value: 0.75 }],
  },
  {
    id: 'preservation.coldVaults',
    lineId: 'preservation',
    costs: { stone: 50_000, wood: 25_000, gold: 25_000 },
    requires: {
      upgradeIds: ['preservation.granaries'],
      buildingCounts: { farm: 15 },
      anyMagicCircleTier: 3,
    },
    modifiers: [{ target: 'consumption.food', operation: 'multiply', value: 0.6 }],
  },

  {
    id: 'logistics.handcarts',
    lineId: 'logistics',
    costs: { wood: 600, gold: 300 },
    requires: { buildingCounts: { house: 5 } },
    modifiers: allProductionModifiers(1.1),
  },
  {
    id: 'logistics.wagons',
    lineId: 'logistics',
    costs: { wood: 5_000, stone: 2_000, gold: 3_500 },
    requires: { upgradeIds: ['logistics.handcarts'], buildingCounts: { house: 12 } },
    modifiers: [
      ...allProductionModifiers(1.25),
      { target: 'warfare.travelSpeed', operation: 'multiply', value: 1.15 },
    ],
  },
  {
    id: 'logistics.pavedRoads',
    lineId: 'logistics',
    costs: { stone: 80_000, wood: 40_000, gold: 40_000 },
    requires: {
      upgradeIds: ['logistics.wagons'],
      buildingCounts: { house: 25 },
      conquestTierDefeated: 3,
    },
    modifiers: [
      ...allProductionModifiers(1.5),
      { target: 'warfare.travelSpeed', operation: 'multiply', value: 1.5 },
      { target: 'thievery.speed', operation: 'multiply', value: 1.25 },
    ],
  },

  {
    id: 'masonry.workCrews',
    lineId: 'masonry',
    costs: { wood: 2_500, stone: 1_800, gold: 1_200 },
    requires: { buildingCounts: { house: 6 } },
    modifiers: [{ target: 'constructionSpeed', operation: 'multiply', value: 1.5 }],
  },
  {
    id: 'masonry.scaffolding',
    lineId: 'masonry',
    costs: { wood: 40_000, stone: 32_000, gold: 22_000 },
    requires: { upgradeIds: ['masonry.workCrews'], buildingCounts: { quarry: 8, house: 20 } },
    modifiers: [{ target: 'constructionSpeed', operation: 'multiply', value: 2.6 }],
  },
  {
    id: 'masonry.masterBuilders',
    lineId: 'masonry',
    costs: { wood: 280_000, stone: 280_000, gold: 240_000 },
    requires: {
      upgradeIds: ['masonry.scaffolding'],
      buildingCounts: { quarry: 25, house: 60 },
      conquestTierDefeated: 3,
    },
    modifiers: [{ target: 'constructionSpeed', operation: 'multiply', value: 6.6 }],
  },

  {
    id: 'military.drillYards',
    lineId: 'military',
    costs: { wood: 800, stone: 400, gold: 500 },
    requires: { buildingCounts: { barracks: 1 } },
    modifiers: [{ target: 'warfare.attackPower', operation: 'multiply', value: 1.25 }],
  },
  {
    id: 'military.standingArmy',
    lineId: 'military',
    costs: { wood: 6_000, stone: 3_000, gold: 6_000 },
    requires: {
      upgradeIds: ['military.drillYards'],
      buildingCounts: { barracks: 3 },
      conquestTierDefeated: 1,
    },
    modifiers: [
      { target: 'warfare.attackPower', operation: 'multiply', value: 1.7 },
      { target: 'capacity.army', operation: 'multiply', value: 1.2 },
    ],
  },
  {
    id: 'military.siegeEngines',
    lineId: 'military',
    costs: { wood: 70_000, stone: 50_000, gold: 60_000 },
    requires: {
      upgradeIds: ['military.standingArmy'],
      buildingCounts: { barracks: 8 },
      conquestTierDefeated: 3,
    },
    modifiers: [
      { target: 'warfare.attackPower', operation: 'multiply', value: 2.7 },
      { target: 'warfare.casualtyRate', operation: 'multiply', value: 0.8 },
    ],
  },

  {
    id: 'thievery.lockpicks',
    lineId: 'thievery',
    costs: { wood: 400, gold: 600 },
    requires: { buildingCounts: { thievesGuild: 1 } },
    modifiers: [{ target: 'thievery.successChance', operation: 'multiply', value: 1.2 }],
  },
  {
    id: 'thievery.smokeBombs',
    lineId: 'thievery',
    costs: { wood: 3_000, stone: 1_500, gold: 5_000 },
    requires: {
      upgradeIds: ['thievery.lockpicks'],
      buildingCounts: { thievesGuild: 3 },
      thieveryTierRobbed: 2,
    },
    modifiers: [
      { target: 'thievery.casualtyRate', operation: 'multiply', value: 0.7 },
      { target: 'thievery.loot', operation: 'multiply', value: 1.25 },
    ],
  },
  {
    id: 'thievery.guildNetwork',
    lineId: 'thievery',
    costs: { wood: 40_000, stone: 25_000, gold: 70_000 },
    requires: {
      upgradeIds: ['thievery.smokeBombs'],
      buildingCounts: { thievesGuild: 8 },
      anyMagicCircleTier: 3,
      thieveryTierRobbed: 4,
    },
    modifiers: [
      { target: 'thievery.successChance', operation: 'multiply', value: 1.5 },
      { target: 'thievery.loot', operation: 'multiply', value: 2 },
    ],
  },

  {
    id: 'arcana.scriptoria',
    lineId: 'arcana',
    costs: { wood: 900, stone: 600, gold: 700 },
    requires: { buildingCounts: { temple: 1 } },
    modifiers: [{ target: 'magic.experienceGain', operation: 'multiply', value: 1.3 }],
  },
  {
    id: 'arcana.astrolabes',
    lineId: 'arcana',
    costs: { wood: 5_000, stone: 4_000, gold: 6_000 },
    requires: { upgradeIds: ['arcana.scriptoria'], buildingCounts: { temple: 3 } },
    modifiers: [
      { target: 'magic.experienceGain', operation: 'multiply', value: 1.8 },
      { target: 'magic.manaPool', operation: 'multiply', value: 1.5 },
      { target: 'magic.manaRegen', operation: 'multiply', value: 1.3 },
    ],
  },
  {
    id: 'arcana.leyLines',
    lineId: 'arcana',
    costs: { wood: 50_000, stone: 50_000, gold: 60_000 },
    requires: {
      upgradeIds: ['arcana.astrolabes'],
      buildingCounts: { temple: 8 },
      anyMagicCircleTier: 3,
    },
    modifiers: [
      { target: 'magic.experienceGain', operation: 'multiply', value: 2.9 },
      { target: 'magic.manaPool', operation: 'multiply', value: 3 },
      { target: 'magic.manaRegen', operation: 'multiply', value: 2.3 },
    ],
  },

  {
    id: 'gathering.callousedHands',
    lineId: 'gathering',
    costs: { wood: 40, stone: 20 },
    requires: {},
    modifiers: [{ target: 'manualGatherYield', operation: 'multiply', value: 2 }],
  },
  {
    id: 'gathering.practisedHands',
    lineId: 'gathering',
    costs: { wood: 500, stone: 400, gold: 100 },
    requires: { upgradeIds: ['gathering.callousedHands'] },
    modifiers: [{ target: 'manualGatherYield', operation: 'multiply', value: 6 }],
  },
  {
    id: 'gathering.masterGatherers',
    lineId: 'gathering',
    costs: { wood: 8_000, stone: 6_000, gold: 4_000 },
    requires: { upgradeIds: ['gathering.practisedHands'], buildingCounts: { house: 10 } },
    modifiers: [{ target: 'manualGatherYield', operation: 'multiply', value: 60 }],
  },

  {
    id: 'fortification.reinforceWalls',
    lineId: 'fortification',
    costs: { stone: 6_000, wood: 3_000, gold: 2_000 },
    requires: { buildingCounts: { barracks: 2 } },
    modifiers: [{ target: 'warfare.casualtyRate', operation: 'multiply', value: 0.96 }],
    repeatable: { maxPurchases: 25, costGrowth: 1.35 },
  },
  {
    id: 'bribery.guildBribes',
    lineId: 'bribery',
    costs: { gold: 9_000 },
    requires: { buildingCounts: { thievesGuild: 2 }, thieveryTierRobbed: 3 },
    modifiers: [{ target: 'thievery.successChance', operation: 'multiply', value: 1.03 }],
    repeatable: { maxPurchases: 12, costGrowth: 1.4 },
  },
]
