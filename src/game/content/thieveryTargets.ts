import type { ThieveryTargetDefinition } from '../model/content'

/** Thievery is the impatient economy: fast, repeatable, and it costs lives. */
export const THIEVERY_TARGET_DEFINITIONS: readonly ThieveryTargetDefinition[] = [
  {
    id: 'granary',
    tier: 1,
    requiredThieves: 1,
    baseSuccessChance: 0.8,
    baseCasualtyRate: 0.08,
    durationSeconds: 45,
    loot: { food: 90, wood: 30 },
  },
  {
    id: 'timberYard',
    tier: 1,
    requiredThieves: 2,
    baseSuccessChance: 0.72,
    baseCasualtyRate: 0.1,
    durationSeconds: 70,
    loot: { wood: 200, stone: 60 },
  },
  {
    id: 'masonsCompound',
    tier: 2,
    requiredThieves: 4,
    baseSuccessChance: 0.62,
    baseCasualtyRate: 0.14,
    durationSeconds: 120,
    loot: { stone: 520, wood: 180 },
  },
  {
    id: 'countingHouse',
    tier: 3,
    requiredThieves: 8,
    baseSuccessChance: 0.5,
    baseCasualtyRate: 0.2,
    durationSeconds: 210,
    loot: { gold: 1_300, food: 400 },
  },
  {
    id: 'templeTreasury',
    tier: 4,
    requiredThieves: 18,
    baseSuccessChance: 0.4,
    baseCasualtyRate: 0.28,
    durationSeconds: 360,
    loot: { gold: 5_500, stone: 2_500, wood: 2_500 },
  },
  {
    id: 'royalVault',
    tier: 5,
    requiredThieves: 45,
    baseSuccessChance: 0.32,
    baseCasualtyRate: 0.35,
    durationSeconds: 600,
    loot: { gold: 30_000, food: 14_000, wood: 11_000, stone: 11_000 },
  },
]
