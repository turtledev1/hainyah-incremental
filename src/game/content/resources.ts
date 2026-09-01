import type { ResourceDefinition } from '../model/content'

export const RESOURCE_DEFINITIONS: readonly ResourceDefinition[] = [
  {
    id: 'food',
    name: 'Food',
    flavor: 'Grain, roots and salted meat. Your people eat whether or not you conquer.',
    manualGather: { actionLabel: 'Forage', baseAmountPerClick: 1 },
  },
  {
    id: 'wood',
    name: 'Wood',
    flavor: 'Timber for houses, scaffolds and siege ladders.',
    manualGather: { actionLabel: 'Gather wood', baseAmountPerClick: 1 },
  },
  {
    id: 'stone',
    name: 'Stone',
    flavor: 'Cut blocks. Everything that must outlast you is built from it.',
    manualGather: { actionLabel: 'Collect stone', baseAmountPerClick: 1 },
  },
  {
    id: 'gold',
    name: 'Gold',
    flavor: 'Struck coin. It buys tools, silence and soldiers.',
  },
]
