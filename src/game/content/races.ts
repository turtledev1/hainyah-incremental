import type { RaceDefinition } from '../model/content'

/** Rule removals are a `multiply: 0`, never a special case in a system. */
export const RACE_DEFINITIONS: readonly RaceDefinition[] = [
  {
    id: 'human',
    name: 'Humans',
    tagline: 'Numerous, adaptable, unremarkable — and therefore hard to stop.',
    advantages: [
      'Citizens arrive 30% faster than for any other race',
      'Buildings cost 10% less and rise 25% faster',
      'Free choice of any single elemental circle',
    ],
    disadvantages: ['No exceptional talent in any single field', 'No access to the Dark Circle'],
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
    name: 'Dwarves',
    tagline: 'Stone is a language, and they are fluent.',
    advantages: [
      'Mines yield 60% more gold',
      'Quarries yield 25% more stone',
      'Sturdy soldiers: 20% fewer battle casualties',
    ],
    disadvantages: [
      'Farms yield 15% less food',
      'Armies march slowly: 20% longer travel',
      'Only the Fire or Earth Circle will have them',
    ],
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
    name: 'The Undead',
    tagline: 'They do not hunger, and they do not stay dead.',
    advantages: [
      'Your people never eat — farms are pointless, famine impossible',
      'Armies suffer no casualties, though an assault can still fail',
      'Command of the Dark Circle',
    ],
    disadvantages: [
      'The grave is slow to give up new bodies: 40% slower population growth',
      'Temples yield 20% less magical experience',
      'Thieves are clumsy: 20% lower success chance',
    ],
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
    name: 'Elves',
    tagline: 'They learned both songs: the one that grows and the one that unmakes.',
    advantages: [
      'The Dark Circle by right, plus one elemental circle of your choosing',
      'Temples yield 50% more magical experience',
      'Lumber camps yield 30% more wood',
    ],
    disadvantages: [
      'Few and slow to multiply: 25% slower population growth',
      'Mines yield 20% less gold',
      'Fragile in battle: 25% more casualties',
    ],
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
