import { BALANCE } from '../content/balance'
import type { ContentRegistry } from '../model/content'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import type { TickContext } from '../model/tick'
import { capacityOf, populationGrowthMultiplier } from './capacity'
import { computeFoodConsumptionPerCitizenPerSecond } from './food'

/** Whole slots, so the count matches the citizens the player can see. */
export function freeHousingSlots(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
): number {
  const capacity = capacityOf(state, registry, modifiers, 'population')
  return Math.max(0, capacity - Math.floor(state.population))
}

export function computePopulationGrowthPerSecond(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
): number {
  const freeSlots = freeHousingSlots(state, registry, modifiers)
  if (freeSlots <= 0) {
    return 0
  }

  // Per citizen, not in total: at a population of zero the total gate would open.
  const consumptionPerCitizenPerSecond = computeFoodConsumptionPerCitizenPerSecond(modifiers)
  if (consumptionPerCitizenPerSecond > 0) {
    const mouthsToPlanFor = Math.max(1, Math.floor(state.population))
    const requiredReserve =
      consumptionPerCitizenPerSecond *
      mouthsToPlanFor *
      BALANCE.population.foodReserveSecondsRequiredForGrowth
    if (state.resources.food < requiredReserve) {
      return 0
    }
  }

  /** Whole citizens only, so the countdown to the next birth holds still between births. */
  const arrivalsPerSecond =
    BALANCE.population.arrivalsPerSecond +
    Math.sqrt(Math.floor(state.population)) *
      BALANCE.population.extraArrivalsPerRootCitizenPerSecond

  return arrivalsPerSecond * populationGrowthMultiplier(modifiers)
}

/** Infinite when nobody is on the way: no housing left, or no granary to raise them on. */
export function secondsUntilNextCitizen(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
): number {
  const growthPerSecond = computePopulationGrowthPerSecond(state, registry, modifiers)
  if (growthPerSecond <= 0) {
    return Number.POSITIVE_INFINITY
  }
  return (Math.floor(state.population) + 1 - state.population) / growthPerSecond
}

export function progressTowardsNextCitizen(state: GameState): number {
  return state.population - Math.floor(state.population)
}

export const growPopulation = ({ state, registry, modifiers, deltaSeconds }: TickContext): void => {
  const growthPerSecond = computePopulationGrowthPerSecond(state, registry, modifiers)
  if (growthPerSecond <= 0) {
    return
  }
  const capacity = capacityOf(state, registry, modifiers, 'population')
  state.population = Math.min(capacity, state.population + growthPerSecond * deltaSeconds)
}
