import type { MagicCircleDefinition } from '../model/content'
import { BALANCE } from './balance'

const TIER_THRESHOLDS = BALANCE.magic.tierExperienceThresholds

export const MAGIC_CIRCLE_DEFINITIONS: readonly MagicCircleDefinition[] = [
  {
    id: 'fire',
    name: 'Circle of Fire',
    flavor: 'Hai’s half of the sky: the sun that ripens and the flame that ends.',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'air',
    name: 'Circle of Air',
    flavor: 'Everything moves faster when the wind is on your side.',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'water',
    name: 'Circle of Water',
    flavor: 'Rain, wells and tides. The circle that feeds a growing people.',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'earth',
    name: 'Circle of Earth',
    flavor: 'Stone answers slowly, but it answers, and it does not break.',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'dark',
    name: 'Dark Circle',
    flavor: 'Yah’s half: the ledger where one thing is traded for another.',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
]
