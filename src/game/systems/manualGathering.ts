import type { ContentRegistry } from '../model/content'
import type { ResourceId } from '../model/ids'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import { resolveMultiplier } from './modifiers'
import { addResource } from './stateHelpers'

export function manualGatherAmount(
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  resourceId: ResourceId,
): number {
  const resource = registry.resourcesById.get(resourceId)
  if (!resource?.manualGather) {
    return 0
  }
  return resource.manualGather.baseAmountPerClick * resolveMultiplier(modifiers, 'manualGatherYield')
}

/** The only thing the player can do on an empty ten acres. */
export function gatherByHand(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  resourceId: ResourceId,
): number {
  const amount = manualGatherAmount(registry, modifiers, resourceId)
  if (amount <= 0) {
    return 0
  }
  addResource(state, resourceId, amount)
  state.statistics.manualGatherClicks += 1
  return amount
}
