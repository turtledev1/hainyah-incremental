import type { ContentRegistry } from '../model/content'
import type { BuildingId, CapacityId } from '../model/ids'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import { resolveMultiplier, resolveValue } from './modifiers'

/** Building effects produce capacity, so "stone houses" is an upgrade, not a building. */
export function capacityOf(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  capacityId: CapacityId,
): number {
  let base = 0

  for (const building of registry.buildings) {
    const count = state.buildings[building.id]
    if (count <= 0) {
      continue
    }
    const workers = state.workerAssignments[building.id]

    for (const effect of building.effects) {
      if (effect.kind !== 'grantCapacity' || effect.capacityId !== capacityId) {
        continue
      }
      const perBuilding = effect.amountPerBuilding ?? 0
      const perWorker = effect.amountPerWorker ?? 0
      base += count * perBuilding + workers * perWorker
    }
  }

  return Math.floor(resolveValue(modifiers, `capacity.${capacityId}`, base))
}

export function workerSlotsTotal(
  state: GameState,
  registry: ContentRegistry,
  buildingId: BuildingId,
): number {
  const building = registry.buildingsById.get(buildingId)
  if (!building) {
    return 0
  }
  return state.buildings[buildingId] * building.workerSlotsPerBuilding
}

export function populationGrowthMultiplier(modifiers: ModifierIndex): number {
  return resolveMultiplier(modifiers, 'populationGrowthRate')
}
