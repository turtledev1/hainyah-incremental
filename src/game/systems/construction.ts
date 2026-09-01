import { BALANCE } from '../content/balance'
import type { ContentRegistry } from '../model/content'
import type { BuildingId, ResourceAmounts, ResourceId } from '../model/ids'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import type { TickContext } from '../model/tick'
import { freeAcres } from './land'
import { resolveMultiplier } from './modifiers'
import { addResource, canAfford, emitEvent, payCosts } from './stateHelpers'

export function buildingCost(
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  buildingId: BuildingId,
): ResourceAmounts {
  const building = registry.buildingsById.get(buildingId)
  if (!building) {
    return {}
  }
  const costMultiplier = resolveMultiplier(modifiers, 'buildingCost')

  const cost: ResourceAmounts = {}
  for (const [resourceId, amount] of Object.entries(building.costs)) {
    cost[resourceId as ResourceId] = Math.ceil((amount ?? 0) * costMultiplier)
  }
  return cost
}

/** Steps the realm is large enough to place in one go. */
export function unlockedBulkSteps(state: GameState): readonly number[] {
  return BALANCE.construction.bulkSteps
    .filter((step) => state.acres >= step.unlockedAtAcres)
    .map((step) => step.size)
}

/** The queue has to hold whatever the largest available order can put in it. */
export function maximumQueueLength(state: GameState): number {
  return Math.max(BALANCE.construction.baseQueueLength, ...unlockedBulkSteps(state), 0)
}

export type ConstructionRefusal =
  | 'unknownBuilding'
  | 'queueFull'
  | 'noFreeAcres'
  | 'cannotAffordCost'

export function describeConstructionRefusal(refusal: ConstructionRefusal): string {
  switch (refusal) {
    case 'unknownBuilding':
      return 'No such building.'
    case 'queueFull':
      return 'Your builders already have all they can handle.'
    case 'noFreeAcres':
      return 'No free acre to build on — you will have to take more land.'
    case 'cannotAffordCost':
      return 'Not enough materials.'
  }
}

export function checkConstructionRefusal(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  buildingId: BuildingId,
): ConstructionRefusal | undefined {
  const building = registry.buildingsById.get(buildingId)
  if (!building) {
    return 'unknownBuilding'
  }
  if (state.constructionQueue.length >= maximumQueueLength(state)) {
    return 'queueFull'
  }
  if (freeAcres(state, registry) < building.acreCost) {
    return 'noFreeAcres'
  }
  if (!canAfford(state, buildingCost(registry, modifiers, buildingId))) {
    return 'cannotAffordCost'
  }
  return undefined
}

export function queueBuilding(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  buildingId: BuildingId,
): ConstructionRefusal | undefined {
  const refusal = checkConstructionRefusal(state, registry, modifiers, buildingId)
  if (refusal) {
    return refusal
  }
  const building = registry.buildingsById.get(buildingId)!

  payCosts(state, buildingCost(registry, modifiers, buildingId))
  state.constructionQueue.push({
    buildingId,
    secondsRemaining: building.baseConstructionSeconds,
    totalSeconds: building.baseConstructionSeconds,
  })
  return undefined
}

/**
 * Places as many orders as the realm can pay for and find room for, up to the count
 * asked. Stopping short beats a button that refuses because the last one of a hundred
 * would not fit.
 */
export function queueBuildings(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  buildingId: BuildingId,
  count: number,
): number {
  let placed = 0
  while (placed < count && queueBuilding(state, registry, modifiers, buildingId) === undefined) {
    placed += 1
  }
  return placed
}

export type DemolitionRefusal = 'unknownBuilding' | 'nothingToDemolish'

export function describeDemolitionRefusal(refusal: DemolitionRefusal): string {
  switch (refusal) {
    case 'unknownBuilding':
      return 'No such building.'
    case 'nothingToDemolish':
      return 'You have none of those to pull down.'
  }
}

/**
 * Half the cost back. Without this, ten acres filled without a barracks is an
 * unwinnable run: no army, so no land, so nowhere to put a barracks.
 */
export function demolishBuilding(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  buildingId: BuildingId,
): DemolitionRefusal | undefined {
  const building = registry.buildingsById.get(buildingId)
  if (!building) {
    return 'unknownBuilding'
  }
  if (state.buildings[buildingId] <= 0) {
    return 'nothingToDemolish'
  }

  state.buildings[buildingId] -= 1
  const paidForThisOne = buildingCost(registry, modifiers, buildingId)
  for (const [resourceId, amount] of Object.entries(paidForThisOne)) {
    addResource(state, resourceId as ResourceId, Math.floor((amount ?? 0) * 0.5))
  }

  const remainingSlots = state.buildings[buildingId] * building.workerSlotsPerBuilding
  if (state.workerAssignments[buildingId] > remainingSlots) {
    state.workerAssignments[buildingId] = remainingSlots
  }

  emitEvent(state, 'construction', 'chronicle.buildingRazed', {
    buildingName: building.name.toLowerCase(),
  })
  return undefined
}

export const advanceConstruction = ({
  state,
  registry,
  modifiers,
  deltaSeconds,
}: TickContext): void => {
  if (state.constructionQueue.length === 0) {
    return
  }

  const speedMultiplier = resolveMultiplier(modifiers, 'constructionSpeed')
  const order = state.constructionQueue[0]!
  order.secondsRemaining -= deltaSeconds * speedMultiplier

  while (state.constructionQueue.length > 0 && state.constructionQueue[0]!.secondsRemaining <= 0) {
    const completed = state.constructionQueue.shift()!
    state.buildings[completed.buildingId] += 1
    state.statistics.buildingsConstructed += 1
    const building = registry.buildingsById.get(completed.buildingId)
    emitEvent(state, 'construction', 'chronicle.buildingFinished', {
      buildingName: building?.name ?? completed.buildingId,
    })

    const overflow = -completed.secondsRemaining
    const nextOrder = state.constructionQueue[0]
    if (nextOrder && overflow > 0) {
      nextOrder.secondsRemaining -= overflow
    }
  }
}
