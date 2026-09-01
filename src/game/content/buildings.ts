import type { BuildingDefinition } from '../model/content'

/** Every building occupies exactly one acre, so land is the master constraint. */
const ONE_ACRE = 1

export const BUILDING_DEFINITIONS: readonly BuildingDefinition[] = [
  {
    id: 'house',
    acreCost: ONE_ACRE,
    costs: { wood: 20, stone: 5 },
    baseConstructionSeconds: 8,
    workerSlotsPerBuilding: 0,
    effects: [{ kind: 'grantCapacity', capacityId: 'population', amountPerBuilding: 4 }],
  },
  {
    id: 'farm',
    acreCost: ONE_ACRE,
    costs: { wood: 15, stone: 5 },
    baseConstructionSeconds: 10,
    workerSlotsPerBuilding: 3,
    effects: [{ kind: 'produceResource', resourceId: 'food', amountPerWorkerPerSecond: 0.28 }],
  },
  {
    id: 'lumberCamp',
    acreCost: ONE_ACRE,
    costs: { wood: 10, stone: 12 },
    baseConstructionSeconds: 10,
    workerSlotsPerBuilding: 3,
    effects: [{ kind: 'produceResource', resourceId: 'wood', amountPerWorkerPerSecond: 0.28 }],
  },
  {
    id: 'quarry',
    acreCost: ONE_ACRE,
    costs: { wood: 25, stone: 8 },
    baseConstructionSeconds: 12,
    workerSlotsPerBuilding: 3,
    effects: [{ kind: 'produceResource', resourceId: 'stone', amountPerWorkerPerSecond: 0.2 }],
  },
  {
    id: 'mine',
    acreCost: ONE_ACRE,
    costs: { wood: 40, stone: 30 },
    baseConstructionSeconds: 16,
    workerSlotsPerBuilding: 3,
    effects: [{ kind: 'produceResource', resourceId: 'gold', amountPerWorkerPerSecond: 0.13 }],
  },
  {
    id: 'barracks',
    acreCost: ONE_ACRE,
    costs: { wood: 60, stone: 40, gold: 20 },
    baseConstructionSeconds: 20,
    workerSlotsPerBuilding: 2,
    effects: [{ kind: 'grantCapacity', capacityId: 'army', amountPerWorker: 6 }],
  },
  {
    id: 'thievesGuild',
    acreCost: ONE_ACRE,
    costs: { wood: 50, stone: 30, gold: 35 },
    baseConstructionSeconds: 20,
    workerSlotsPerBuilding: 2,
    effects: [{ kind: 'grantCapacity', capacityId: 'thieves', amountPerWorker: 3 }],
  },
  {
    id: 'temple',
    acreCost: ONE_ACRE,
    costs: { wood: 80, stone: 60, gold: 40 },
    baseConstructionSeconds: 26,
    workerSlotsPerBuilding: 2,
    effects: [{ kind: 'generateMagicExperience', experiencePerWorkerPerSecond: 0.03 }],
  },
]
