import { BALANCE } from '../content/balance'
import type { ContentRegistry } from '../model/content'
import type { BuildingId } from '../model/ids'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import { capacityOf, workerSlotsTotal } from './capacity'
import {
  LEAST_ESSENTIAL_BUILDINGS_FIRST,
  emitEvent,
  idleCitizens,
  totalSoldiers,
  totalThieves,
} from './stateHelpers'

/** A citizen holds exactly one role at a time; every transition goes through here. */
export function assignWorkers(
  state: GameState,
  registry: ContentRegistry,
  buildingId: BuildingId,
  requestedCount: number,
): number {
  const freeSlots = workerSlotsTotal(state, registry, buildingId) - state.workerAssignments[buildingId]
  const assignable = Math.max(0, Math.min(requestedCount, freeSlots, idleCitizens(state)))
  state.workerAssignments[buildingId] += assignable
  return assignable
}

/** Every free slot the realm has the idle citizens to cover. */
export function fillWorkerSlots(
  state: GameState,
  registry: ContentRegistry,
  buildingId: BuildingId,
): number {
  return assignWorkers(state, registry, buildingId, Number.MAX_SAFE_INTEGER)
}

export function clearWorkers(state: GameState, buildingId: BuildingId): number {
  return unassignWorkers(state, buildingId, state.workerAssignments[buildingId])
}

export function unassignWorkers(
  state: GameState,
  buildingId: BuildingId,
  requestedCount: number,
): number {
  const removable = Math.max(0, Math.min(requestedCount, state.workerAssignments[buildingId]))
  state.workerAssignments[buildingId] -= removable
  return removable
}

export function recruitSoldiers(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  requestedCount: number,
): number {
  const capacity = capacityOf(state, registry, modifiers, 'army')
  const room = Math.max(0, capacity - totalSoldiers(state))
  const recruited = Math.max(0, Math.min(requestedCount, room, idleCitizens(state)))
  state.soldiersAtHome += recruited
  return recruited
}

export function dismissSoldiers(state: GameState, requestedCount: number): number {
  const dismissed = Math.max(0, Math.min(requestedCount, state.soldiersAtHome))
  state.soldiersAtHome -= dismissed
  return dismissed
}

export function recruitThieves(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  requestedCount: number,
): number {
  const capacity = capacityOf(state, registry, modifiers, 'thieves')
  const room = Math.max(0, capacity - totalThieves(state))
  const recruited = Math.max(0, Math.min(requestedCount, room, idleCitizens(state)))
  state.thievesAtHome += recruited
  return recruited
}

export function dismissThieves(state: GameState, requestedCount: number): number {
  const dismissed = Math.max(0, Math.min(requestedCount, state.thievesAtHome))
  state.thievesAtHome -= dismissed
  return dismissed
}

/** Starvation and lost battles can leave more roles filled than citizens alive. */
export const reconcileWorkforce = ({
  state,
  registry,
  modifiers,
  deltaSeconds,
}: {
  state: GameState
  registry: ContentRegistry
  modifiers: ModifierIndex
  deltaSeconds: number
}): void => {
  for (const building of registry.buildings) {
    const slots = workerSlotsTotal(state, registry, building.id)
    if (state.workerAssignments[building.id] > slots) {
      state.workerAssignments[building.id] = slots
    }
  }

  const soldiersOverCapacity = totalSoldiers(state) - capacityOf(state, registry, modifiers, 'army')
  const thievesOverCapacity =
    totalThieves(state) - capacityOf(state, registry, modifiers, 'thieves')
  const overCapacity = Math.max(0, soldiersOverCapacity) + Math.max(0, thievesOverCapacity)

  if (overCapacity <= 0) {
    state.pendingDesertions = 0
    state.desertedSoldiersSinceLastReport = 0
    state.desertedThievesSinceLastReport = 0
  } else {
    state.pendingDesertions +=
      overCapacity * BALANCE.workforce.desertionFractionPerSecond * deltaSeconds
    const leaving = Math.floor(state.pendingDesertions)
    if (leaving > 0) {
      state.pendingDesertions -= leaving
      const soldiersDeserted = Math.min(
        leaving,
        Math.max(0, soldiersOverCapacity),
        state.soldiersAtHome,
      )
      if (soldiersDeserted > 0) {
        state.desertedSoldiersSinceLastReport += soldiersDeserted
        state.soldiersAtHome -= soldiersDeserted
        emitEvent(
          state,
          'population',
          'chronicle.soldiersDeserted',
          { count: state.desertedSoldiersSinceLastReport },
          'soldiersDeserting',
        )
      }
      const thievesDeserted = Math.min(
        leaving - soldiersDeserted,
        Math.max(0, thievesOverCapacity),
        state.thievesAtHome,
      )
      if (thievesDeserted > 0) {
        state.desertedThievesSinceLastReport += thievesDeserted
        state.thievesAtHome -= thievesDeserted
        emitEvent(
          state,
          'population',
          'chronicle.thievesDeserted',
          { count: state.desertedThievesSinceLastReport },
          'thievesDeserting',
        )
      }
    }
  }

  trimRolesToPopulation(state, registry)
}

function trimRolesToPopulation(state: GameState, registry: ContentRegistry): void {
  const livingCitizens = Math.floor(state.population)
  let excessRoles =
    registry.buildings.reduce(
      (runningTotal, building) => runningTotal + state.workerAssignments[building.id],
      0,
    ) +
    totalSoldiers(state) +
    totalThieves(state) -
    livingCitizens
  if (excessRoles <= 0) {
    return
  }

  for (const buildingId of LEAST_ESSENTIAL_BUILDINGS_FIRST) {
    if (excessRoles <= 0) {
      break
    }
    const removed = Math.min(excessRoles, state.workerAssignments[buildingId])
    state.workerAssignments[buildingId] -= removed
    excessRoles -= removed
  }

  const thievesRemoved = Math.min(excessRoles, state.thievesAtHome)
  state.thievesAtHome -= thievesRemoved
  excessRoles -= thievesRemoved

  state.soldiersAtHome = Math.max(0, state.soldiersAtHome - excessRoles)
}
