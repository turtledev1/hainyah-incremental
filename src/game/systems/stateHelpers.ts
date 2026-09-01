import { BALANCE } from '../content/balance'
import type { BuildingId, ResourceAmounts, ResourceId } from '../model/ids'
import { BUILDING_IDS } from '../model/ids'
import type { TranslationValues } from '../../i18n'
import type { GameEventKind, GameState } from '../model/state'

/** Whose work the realm can most afford to lose, in order. */
export const LEAST_ESSENTIAL_BUILDINGS_FIRST: readonly BuildingId[] = [
  'temple',
  'thievesGuild',
  'barracks',
  'mine',
  'quarry',
  'lumberCamp',
  'farm',
  'house',
]

export function addResource(state: GameState, resourceId: ResourceId, amount: number): void {
  state.resources[resourceId] = Math.max(0, state.resources[resourceId] + amount)
}

export function addResources(state: GameState, amounts: ResourceAmounts): void {
  for (const [resourceId, amount] of Object.entries(amounts)) {
    addResource(state, resourceId as ResourceId, amount ?? 0)
  }
}

export function canAfford(state: GameState, costs: ResourceAmounts): boolean {
  return Object.entries(costs).every(
    ([resourceId, amount]) => state.resources[resourceId as ResourceId] >= (amount ?? 0),
  )
}

export function payCosts(state: GameState, costs: ResourceAmounts): void {
  for (const [resourceId, amount] of Object.entries(costs)) {
    addResource(state, resourceId as ResourceId, -(amount ?? 0))
  }
}

export function totalAssignedWorkers(state: GameState): number {
  return BUILDING_IDS.reduce(
    (runningTotal, buildingId) => runningTotal + state.workerAssignments[buildingId],
    0,
  )
}

export function soldiersAway(state: GameState): number {
  return state.expeditions.reduce((runningTotal, expedition) => runningTotal + expedition.soldiers, 0)
}

export function thievesAway(state: GameState): number {
  return state.heists.reduce((runningTotal, heist) => runningTotal + heist.thieves, 0)
}

export function totalSoldiers(state: GameState): number {
  return state.soldiersAtHome + soldiersAway(state)
}

export function totalThieves(state: GameState): number {
  return state.thievesAtHome + thievesAway(state)
}

/** Citizens holding no role: available to be assigned, recruited or lost. */
export function idleCitizens(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.population) -
      totalAssignedWorkers(state) -
      totalSoldiers(state) -
      totalThieves(state),
  )
}

/**
 * Farmers go last, since taking them first turns one famine into a spiral. Soldiers
 * already on campaign are out of reach.
 */
export function removeCitizens(state: GameState, requestedCount: number): number {
  let remaining = Math.min(Math.floor(requestedCount), Math.floor(state.population))
  if (remaining <= 0) {
    return 0
  }
  const removedTotal = remaining

  const takeFromIdle = Math.min(remaining, idleCitizens(state))
  remaining -= takeFromIdle

  for (const buildingId of LEAST_ESSENTIAL_BUILDINGS_FIRST) {
    if (remaining <= 0) {
      break
    }
    const takenFromBuilding = Math.min(remaining, state.workerAssignments[buildingId])
    state.workerAssignments[buildingId] -= takenFromBuilding
    remaining -= takenFromBuilding
  }

  const takenFromThieves = Math.min(remaining, state.thievesAtHome)
  state.thievesAtHome -= takenFromThieves
  remaining -= takenFromThieves

  const takenFromSoldiers = Math.min(remaining, state.soldiersAtHome)
  state.soldiersAtHome -= takenFromSoldiers
  remaining -= takenFromSoldiers

  const actuallyRemoved = removedTotal - remaining
  state.population = Math.max(0, state.population - actuallyRemoved)
  return actuallyRemoved
}

export function buildingCount(state: GameState, buildingId: BuildingId): number {
  return state.buildings[buildingId]
}

export function workerSlotsAvailable(
  state: GameState,
  buildingId: BuildingId,
  slotsPerBuilding: number,
): number {
  return state.buildings[buildingId] * slotsPerBuilding - state.workerAssignments[buildingId]
}

/** How long a coalescing event keeps absorbing its repeats. */
const COALESCE_WINDOW_SECONDS = 60

export function emitEvent(
  state: GameState,
  kind: GameEventKind,
  messageKey: string,
  values?: TranslationValues,
  coalesceKey?: string,
): void {
  const mostRecent = state.eventLog[state.eventLog.length - 1]
  if (
    coalesceKey !== undefined &&
    mostRecent?.coalesceKey === coalesceKey &&
    state.elapsedSeconds - mostRecent.atElapsedSeconds < COALESCE_WINDOW_SECONDS
  ) {
    mostRecent.messageKey = messageKey
    mostRecent.values = values
    mostRecent.atElapsedSeconds = state.elapsedSeconds
    return
  }

  state.eventLog.push({
    id: state.nextEntityId++,
    atElapsedSeconds: state.elapsedSeconds,
    kind,
    messageKey,
    values,
    coalesceKey,
  })
  if (state.eventLog.length > BALANCE.eventLog.maximumEntries) {
    state.eventLog.splice(0, state.eventLog.length - BALANCE.eventLog.maximumEntries)
  }
}
