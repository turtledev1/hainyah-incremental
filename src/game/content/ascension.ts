import type { AscensionStageDefinition } from '../model/content'

/** This curve sets the length of a whole run; `npm run simulate` measures it. */
export const ASCENSION_STAGE_DEFINITIONS: readonly AscensionStageDefinition[] = [
  {
    index: 1,
    name: 'The Foundation',
    flavor: 'You dig until you strike something that will hold a god’s weight.',
    costs: { stone: 2_850_000, wood: 1_140_000, gold: 3_800_000, food: 1_140_000 },
  },
  {
    index: 2,
    name: 'The Twin Pillars',
    flavor: 'One for Hai, one for Yah, and no way to tell which is taller.',
    costs: { stone: 8_510_000, wood: 3_420_000, gold: 11_800_000, food: 3_420_000 },
  },
  {
    index: 3,
    name: 'The Outer Court',
    flavor: 'Room for everyone who will want to say they were there.',
    costs: { stone: 22_800_000, wood: 8_510_000, gold: 33_200_000, food: 9_500_000 },
  },
  {
    index: 4,
    name: 'The Hall of Names',
    flavor: 'Every acre you took, cut into the wall, in the order you took it.',
    costs: { stone: 57_000_000, wood: 20_900_000, gold: 85_100_000, food: 24_700_000 },
  },
  {
    index: 5,
    name: 'The Sun Vault',
    flavor: 'A ceiling that holds Hai’s light after Hai has gone down.',
    costs: { stone: 114_000_000, wood: 41_800_000, gold: 181_000_000, food: 53_200_000 },
  },
  {
    index: 6,
    name: 'The Shadow Vault',
    flavor: 'Yah’s half, and the reason nobody sleeps in this building.',
    costs: { stone: 181_000_000, wood: 66_500_000, gold: 314_000_000, food: 89_700_000 },
  },
  {
    index: 7,
    name: 'The Spire',
    flavor: 'High enough that the argument upstairs becomes audible.',
    costs: { stone: 256_000_000, wood: 95_000_000, gold: 456_000_000, food: 133_000_000 },
  },
  {
    index: 8,
    name: 'The Ascension',
    flavor: 'The last stone. You are expected.',
    costs: { stone: 304_000_000, wood: 118_000_000, gold: 589_000_000, food: 161_000_000 },
  },
]
