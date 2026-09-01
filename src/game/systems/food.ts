import { BALANCE } from '../content/balance'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import type { TickContext } from '../model/tick'
import { resolveMultiplier } from './modifiers'
import { emitEvent, removeCitizens } from './stateHelpers'

/** Resolves to zero for a race that does not eat, with no system knowing what one is. */
export function computeFoodConsumptionPerCitizenPerSecond(modifiers: ModifierIndex): number {
  return (
    resolveMultiplier(modifiers, 'consumption.food') *
    BALANCE.population.foodEatenPerCitizenPerSecond
  )
}

/** Whole citizens only: a half-grown citizen the player cannot see does not eat. */
export function computeFoodConsumptionPerSecond(
  state: GameState,
  modifiers: ModifierIndex,
): number {
  return Math.floor(state.population) * computeFoodConsumptionPerCitizenPerSecond(modifiers)
}

export const consumeFood = ({ state, modifiers, deltaSeconds }: TickContext): void => {
  const consumptionPerSecond = computeFoodConsumptionPerSecond(state, modifiers)
  if (consumptionPerSecond <= 0) {
    state.pendingStarvationDeaths = 0
    state.starvedSinceFamineBegan = 0
    return
  }

  const demanded = consumptionPerSecond * deltaSeconds
  const eaten = Math.min(state.resources.food, demanded)
  state.resources.food -= eaten

  const shortfall = demanded - eaten
  if (shortfall <= 0) {
    state.pendingStarvationDeaths = 0
    state.starvedSinceFamineBegan = 0
    return
  }

  state.pendingStarvationDeaths +=
    shortfall * BALANCE.population.starvationDeathsPerSecondPerMissingFood

  const wholeDeaths = Math.floor(state.pendingStarvationDeaths)
  if (wholeDeaths <= 0) {
    return
  }

  state.pendingStarvationDeaths -= wholeDeaths
  const starved = removeCitizens(state, wholeDeaths)
  if (starved > 0) {
    state.statistics.citizensStarved += starved
    state.starvedSinceFamineBegan += starved
    emitEvent(
      state,
      'population',
      'chronicle.famine',
      { count: state.starvedSinceFamineBegan },
      'famine',
    )
  }
}
