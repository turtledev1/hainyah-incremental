import type { ContentRegistry } from '../model/content'
import { BUILDING_IDS } from '../model/ids'
import type { GameState } from '../model/state'

function acreCostOf(registry: ContentRegistry, buildingId: (typeof BUILDING_IDS)[number]): number {
  return registry.buildingsById.get(buildingId)?.acreCost ?? 1
}

/** Counts acres already reserved by the construction queue. */
export function occupiedAcres(state: GameState, registry: ContentRegistry): number {
  const standing = BUILDING_IDS.reduce(
    (runningTotal, buildingId) =>
      runningTotal + state.buildings[buildingId] * acreCostOf(registry, buildingId),
    0,
  )
  const reservedByQueue = state.constructionQueue.reduce(
    (runningTotal, order) => runningTotal + acreCostOf(registry, order.buildingId),
    0,
  )
  return standing + reservedByQueue
}

export function freeAcres(state: GameState, registry: ContentRegistry): number {
  return state.acres - occupiedAcres(state, registry)
}

export function grantAcres(state: GameState, acres: number): void {
  state.acres += acres
}
