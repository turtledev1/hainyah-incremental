export type ResourceId = 'food' | 'wood' | 'stone' | 'gold'

export const RESOURCE_IDS: readonly ResourceId[] = ['food', 'wood', 'stone', 'gold']

export type BuildingId =
  | 'house'
  | 'farm'
  | 'mine'
  | 'quarry'
  | 'lumberCamp'
  | 'barracks'
  | 'thievesGuild'
  | 'temple'

export const BUILDING_IDS: readonly BuildingId[] = [
  'house',
  'farm',
  'mine',
  'quarry',
  'lumberCamp',
  'barracks',
  'thievesGuild',
  'temple',
]

export type RaceId = 'human' | 'dwarf' | 'undead' | 'elf'

export type MagicCircleId = 'fire' | 'air' | 'water' | 'earth' | 'dark'

export const MAGIC_CIRCLE_IDS: readonly MagicCircleId[] = ['fire', 'air', 'water', 'earth', 'dark']

export type CapacityId = 'population' | 'army' | 'thieves'

export type UpgradeLineId =
  | 'housing'
  | 'woodcutting'
  | 'mining'
  | 'quarrying'
  | 'farming'
  | 'preservation'
  | 'logistics'
  | 'masonry'
  | 'military'
  | 'command'
  | 'thievery'
  | 'arcana'
  | 'gathering'
  | 'fortification'
  | 'bribery'

/** Large id families stay plain strings; `content/index.ts` checks them at start-up. */
export type SpellId = string
export type UpgradeId = string
export type ConquestTargetId = string
export type ThieveryTargetId = string

export type ResourceAmounts = Partial<Record<ResourceId, number>>
