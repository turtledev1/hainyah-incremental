import type { ResourceDefinition } from '../model/content'

export const RESOURCE_DEFINITIONS: readonly ResourceDefinition[] = [
  {
    id: 'food',
    manualGather: { baseAmountPerClick: 1 },
  },
  {
    id: 'wood',
    manualGather: { baseAmountPerClick: 1 },
  },
  {
    id: 'stone',
    manualGather: { baseAmountPerClick: 1 },
  },
  {
    id: 'gold',
  },
]
