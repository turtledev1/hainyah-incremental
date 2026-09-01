import type { MagicCircleDefinition } from '../model/content'
import { BALANCE } from './balance'

const TIER_THRESHOLDS = BALANCE.magic.tierExperienceThresholds

export const MAGIC_CIRCLE_DEFINITIONS: readonly MagicCircleDefinition[] = [
  {
    id: 'fire',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'air',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'water',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'earth',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
  {
    id: 'dark',
    tierExperienceThresholds: TIER_THRESHOLDS,
  },
]
