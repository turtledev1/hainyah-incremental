import type { AscensionStageDefinition } from '../model/content'

/** This curve sets the length of a whole run; `npm run simulate` measures it. */
export const ASCENSION_STAGE_DEFINITIONS: readonly AscensionStageDefinition[] = [
  {
    index: 1,
    costs: { stone: 4_620_000, wood: 1_850_000, gold: 6_160_000, food: 1_850_000 },
  },
  {
    index: 2,
    costs: { stone: 13_800_000, wood: 5_540_000, gold: 19_100_000, food: 5_540_000 },
  },
  {
    index: 3,
    costs: { stone: 36_900_000, wood: 13_800_000, gold: 53_800_000, food: 15_400_000 },
  },
  {
    index: 4,
    costs: { stone: 92_300_000, wood: 33_900_000, gold: 138_000_000, food: 40_000_000 },
  },
  {
    index: 5,
    costs: { stone: 185_000_000, wood: 67_700_000, gold: 293_000_000, food: 86_200_000 },
  },
  {
    index: 6,
    costs: { stone: 293_000_000, wood: 108_000_000, gold: 509_000_000, food: 145_000_000 },
  },
  {
    index: 7,
    costs: { stone: 415_000_000, wood: 154_000_000, gold: 739_000_000, food: 216_000_000 },
  },
  {
    index: 8,
    costs: { stone: 493_000_000, wood: 191_000_000, gold: 954_000_000, food: 261_000_000 },
  },
]
