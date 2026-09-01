import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { BALANCE } from '../content/balance'
import { advanceGame } from '../engine/tick'
import { capacityOf } from './capacity'
import { computeFoodConsumptionPerSecond } from './food'
import { buildModifierIndexForState } from './modifiers'
import { computePopulationGrowthPerSecond } from './population'
import { computeProductionPerSecond } from './production'

describe('production', () => {
  it('produces nothing from a building that has no workers assigned', () => {
    const state = createRealm({ buildings: { farm: 3 } })

    const perSecond = computeProductionPerSecond(
      state,
      testRegistry,
      buildModifierIndexForState(state, testRegistry),
    )

    expect(perSecond.food).toBe(0)
  })

  it('scales output with the number of workers actually assigned', () => {
    const oneWorker = createRealm({ buildings: { farm: 2 }, workers: { farm: 1 }, population: 5 })
    const threeWorkers = createRealm({ buildings: { farm: 2 }, workers: { farm: 3 }, population: 5 })

    const oneWorkerFood = computeProductionPerSecond(
      oneWorker,
      testRegistry,
      buildModifierIndexForState(oneWorker, testRegistry),
    ).food
    const threeWorkerFood = computeProductionPerSecond(
      threeWorkers,
      testRegistry,
      buildModifierIndexForState(threeWorkers, testRegistry),
    ).food

    expect(threeWorkerFood).toBeCloseTo(oneWorkerFood * 3, 10)
  })

  it('ignores workers assigned beyond the slots the buildings provide', () => {
    const state = createRealm({ buildings: { farm: 1 }, workers: { farm: 99 }, population: 200 })

    const perSecond = computeProductionPerSecond(
      state,
      testRegistry,
      buildModifierIndexForState(state, testRegistry),
    )
    const slotsInOneFarm = testRegistry.buildingsById.get('farm')!.workerSlotsPerBuilding

    expect(perSecond.food).toBeCloseTo(slotsInOneFarm * 0.28, 10)
  })

  it('gives dwarven mines more gold than human mines from the same workers', () => {
    const humanRealm = createRealm({ raceId: 'human', buildings: { mine: 1 }, workers: { mine: 3 } })
    const dwarfRealm = createRealm({
      raceId: 'dwarf',
      circleIds: ['earth'],
      buildings: { mine: 1 },
      workers: { mine: 3 },
    })

    const humanGold = computeProductionPerSecond(
      humanRealm,
      testRegistry,
      buildModifierIndexForState(humanRealm, testRegistry),
    ).gold
    const dwarfGold = computeProductionPerSecond(
      dwarfRealm,
      testRegistry,
      buildModifierIndexForState(dwarfRealm, testRegistry),
    ).gold

    expect(dwarfGold).toBeCloseTo(humanGold * 1.6, 10)
  })

  it('adds produced resources to the stores over a tick', () => {
    const state = createRealm({ buildings: { lumberCamp: 1 }, workers: { lumberCamp: 3 }, population: 3 })

    const advanced = advanceGame(state, 10, testRegistry)

    expect(advanced.resources.wood).toBeGreaterThan(0)
  })
})

describe('food and famine', () => {
  it('eats food in proportion to the population', () => {
    const state = createRealm({ population: 20 })

    const consumption = computeFoodConsumptionPerSecond(
      state,
      buildModifierIndexForState(state, testRegistry),
    )

    expect(consumption).toBeCloseTo(20 * BALANCE.population.foodEatenPerCitizenPerSecond, 10)
  })

  it('has the undead eat nothing at all, however many of them there are', () => {
    const state = createRealm({ raceId: 'undead', circleIds: ['dark'], population: 500 })

    const consumption = computeFoodConsumptionPerSecond(
      state,
      buildModifierIndexForState(state, testRegistry),
    )

    expect(consumption).toBe(0)
  })

  it('reduces consumption when the preservation line has been adopted', () => {
    const state = createRealm({ population: 100 })
    state.purchasedUpgrades['preservation.rootCellars'] = 1
    state.purchasedUpgrades['preservation.granaries'] = 1

    const consumption = computeFoodConsumptionPerSecond(
      state,
      buildModifierIndexForState(state, testRegistry),
    )

    expect(consumption).toBeCloseTo(100 * BALANCE.population.foodEatenPerCitizenPerSecond * 0.9 * 0.85, 10)
  })

  it('leaves undead consumption at zero even with the preservation line adopted', () => {
    const state = createRealm({ raceId: 'undead', circleIds: ['dark'], population: 100 })
    state.purchasedUpgrades['preservation.rootCellars'] = 1

    expect(
      computeFoodConsumptionPerSecond(state, buildModifierIndexForState(state, testRegistry)),
    ).toBe(0)
  })

  it('starves citizens once the granary is empty and stays empty', () => {
    const state = createRealm({ population: 40, buildings: { house: 20 }, resources: { food: 0 } })

    const advanced = advanceGame(state, 60, testRegistry)

    expect(advanced.population).toBeLessThan(40)
    expect(advanced.statistics.citizensStarved).toBeGreaterThan(0)
  })

  it('never starves the undead, who have no need of a granary', () => {
    const state = createRealm({
      raceId: 'undead',
      circleIds: ['dark'],
      population: 40,
      buildings: { house: 20 },
      resources: { food: 0 },
    })

    const advanced = advanceGame(state, 600, testRegistry)

    expect(advanced.statistics.citizensStarved).toBe(0)
    expect(advanced.population).toBeGreaterThanOrEqual(40)
  })
})

describe('population growth', () => {
  it('does not grow at all when there is no housing', () => {
    const state = createRealm({ resources: { food: 1_000 } })

    expect(computePopulationGrowthPerSecond(state, testRegistry, buildModifierIndexForState(state, testRegistry))).toBe(0)
  })

  it('grows towards the capacity that houses provide', () => {
    const state = createRealm({ buildings: { house: 3 }, resources: { food: 1_000 } })
    const modifiers = buildModifierIndexForState(state, testRegistry)

    expect(capacityOf(state, testRegistry, modifiers, 'population')).toBeGreaterThan(0)
    expect(computePopulationGrowthPerSecond(state, testRegistry, modifiers)).toBeGreaterThan(0)
  })

  it('stops growing when a hungry realm has no food reserve left', () => {
    const state = createRealm({ buildings: { house: 5 }, population: 4, resources: { food: 0 } })

    expect(
      computePopulationGrowthPerSecond(state, testRegistry, buildModifierIndexForState(state, testRegistry)),
    ).toBe(0)
  })

  it('keeps growing an undead realm with an empty granary, since they never eat', () => {
    const state = createRealm({
      raceId: 'undead',
      circleIds: ['dark'],
      buildings: { house: 5 },
      population: 4,
      resources: { food: 0 },
    })

    expect(
      computePopulationGrowthPerSecond(state, testRegistry, buildModifierIndexForState(state, testRegistry)),
    ).toBeGreaterThan(0)
  })

  it('never exceeds the housing capacity, however long it runs', () => {
    const state = createRealm({ buildings: { house: 2 }, resources: { food: 100_000 } })

    const advanced = advanceGame(state, 60 * 60, testRegistry)
    const capacity = capacityOf(
      advanced,
      testRegistry,
      buildModifierIndexForState(advanced, testRegistry),
      'population',
    )

    expect(advanced.population).toBeLessThanOrEqual(capacity)
  })

  it('grows humans faster than elves from the same housing, as their traits promise', () => {
    const humanRealm = createRealm({ raceId: 'human', buildings: { house: 5 }, resources: { food: 10_000 } })
    const elfRealm = createRealm({
      raceId: 'elf',
      circleIds: ['water', 'dark'],
      buildings: { house: 5 },
      resources: { food: 10_000 },
    })

    const humanGrowth = computePopulationGrowthPerSecond(
      humanRealm,
      testRegistry,
      buildModifierIndexForState(humanRealm, testRegistry),
    )
    const elfGrowth = computePopulationGrowthPerSecond(
      elfRealm,
      testRegistry,
      buildModifierIndexForState(elfRealm, testRegistry),
    )

    expect(humanGrowth).toBeGreaterThan(elfGrowth)
  })
})
