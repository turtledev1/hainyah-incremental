import type { RaceDefinition } from '../model/content'

/** Rule removals are a `multiply: 0`, never a special case in a system. */
export const RACE_DEFINITIONS: readonly RaceDefinition[] = [
  {
    id: 'human',
    magicCircleAccess: {
      grantedCircleIds: [],
      chosenCircleCount: 1,
      choosableCircleIds: ['fire', 'air', 'water', 'earth'],
    },
    modifiers: [
      { target: 'populationGrowthRate', operation: 'multiply', value: 1.3 },
      { target: 'buildingCost', operation: 'multiply', value: 0.9 },
      { target: 'constructionSpeed', operation: 'multiply', value: 1.25 },
    ],
  },
  {
    id: 'dwarf',
    magicCircleAccess: {
      grantedCircleIds: [],
      chosenCircleCount: 1,
      choosableCircleIds: ['fire', 'earth'],
    },
    modifiers: [
      { target: 'buildingOutput.mine', operation: 'multiply', value: 1.6 },
      { target: 'buildingOutput.quarry', operation: 'multiply', value: 1.25 },
      { target: 'buildingOutput.farm', operation: 'multiply', value: 0.85 },
      { target: 'warfare.casualtyRate', operation: 'multiply', value: 0.8 },
      { target: 'warfare.travelSpeed', operation: 'multiply', value: 0.8 },
    ],
  },
  {
    id: 'undead',
    magicCircleAccess: { grantedCircleIds: ['dark'], chosenCircleCount: 0, choosableCircleIds: [] },
    modifiers: [
      { target: 'consumption.food', operation: 'multiply', value: 0 },
      { target: 'warfare.casualtyRate', operation: 'multiply', value: 0 },
      { target: 'populationGrowthRate', operation: 'multiply', value: 0.6 },
      { target: 'magic.experienceGain', operation: 'multiply', value: 0.8 },
      { target: 'thievery.successChance', operation: 'multiply', value: 0.8 },
    ],
  },
  {
    id: 'elf',
    magicCircleAccess: {
      grantedCircleIds: ['dark'],
      chosenCircleCount: 1,
      choosableCircleIds: ['fire', 'air', 'water', 'earth'],
    },
    modifiers: [
      { target: 'magic.experienceGain', operation: 'multiply', value: 1.5 },
      { target: 'buildingOutput.lumberCamp', operation: 'multiply', value: 1.3 },
      { target: 'buildingOutput.mine', operation: 'multiply', value: 0.8 },
      { target: 'populationGrowthRate', operation: 'multiply', value: 0.75 },
      { target: 'warfare.casualtyRate', operation: 'multiply', value: 1.25 },
    ],
  },
]
