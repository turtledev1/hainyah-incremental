import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { advanceGame } from '../engine/tick'
import {
  checkConstructionRefusal,
  demolishBuilding,
  buildingCost,
  queueBuilding,
  queueBuildings,
  unlockedBulkSteps,
} from './construction'
import { clearWorkers, fillWorkerSlots } from './workforce'
import { freeAcres } from './land'
import { buildModifierIndexForState } from './modifiers'

const generousStores = { wood: 1_000_000, stone: 1_000_000, gold: 1_000_000, food: 1_000_000 }

/** Dwarves have no building-cost modifier, so base costs read straight through. */
const NO_COST_MODIFIER_RACE = { raceId: 'dwarf', circleIds: ['earth'] } as const

const HOUSE = testRegistry.buildingsById.get('house')!

function modifiersFor(state: ReturnType<typeof createRealm>) {
  return buildModifierIndexForState(state, testRegistry)
}

describe('building costs', () => {
  it('charges the base cost for the first building of a type', () => {
    const state = createRealm({ ...NO_COST_MODIFIER_RACE, resources: generousStores })

    const cost = buildingCost(testRegistry, modifiersFor(state), 'house')

    expect(cost.wood).toBe(HOUSE.costs.wood)
    expect(cost.stone).toBe(HOUSE.costs.stone)
  })

  /** A house is a house: the thousandth costs what the first did. */
  it('charges the same for the hundredth as for the first', () => {
    const fresh = createRealm({ ...NO_COST_MODIFIER_RACE, resources: generousStores })
    const established = createRealm({
      ...NO_COST_MODIFIER_RACE,
      acres: 5_000,
      resources: generousStores,
      buildings: { house: 400 },
    })

    expect(buildingCost(testRegistry, modifiersFor(established), 'house')).toEqual(
      buildingCost(testRegistry, modifiersFor(fresh), 'house'),
    )
  })

  it('is unmoved by what is already in the queue', () => {
    const state = createRealm({ ...NO_COST_MODIFIER_RACE, acres: 100, resources: generousStores })
    const before = buildingCost(testRegistry, modifiersFor(state), 'house')

    queueBuildings(state, testRegistry, modifiersFor(state), 'house', 10)

    expect(buildingCost(testRegistry, modifiersFor(state), 'house')).toEqual(before)
  })

  it('gives humans a discount on every building, as their traits promise', () => {
    const humanRealm = createRealm({ raceId: 'human', resources: generousStores })
    const dwarfRealm = createRealm({ raceId: 'dwarf', circleIds: ['earth'], resources: generousStores })

    const humanCost = buildingCost(testRegistry, modifiersFor(humanRealm), 'quarry')
    const dwarfCost = buildingCost(testRegistry, modifiersFor(dwarfRealm), 'quarry')

    expect(humanCost.wood!).toBeLessThan(dwarfCost.wood!)
  })
})

describe('queueing a building', () => {
  it('refuses when the realm cannot pay', () => {
    const state = createRealm()

    expect(checkConstructionRefusal(state, testRegistry, modifiersFor(state), 'house')).toBe(
      'cannotAffordCost',
    )
  })

  it('refuses when every acre is already taken', () => {
    const state = createRealm({ acres: 2, resources: generousStores, buildings: { house: 2 } })

    expect(checkConstructionRefusal(state, testRegistry, modifiersFor(state), 'house')).toBe(
      'noFreeAcres',
    )
  })

  it('reserves the acre as soon as the order is placed, not when it finishes', () => {
    const state = createRealm({ acres: 10, resources: generousStores })

    queueBuilding(state, testRegistry, modifiersFor(state), 'farm')

    expect(freeAcres(state, testRegistry)).toBe(9)
    expect(state.buildings.farm).toBe(0)
  })

  it('takes payment immediately so the same materials cannot be spent twice', () => {
    const state = createRealm({
      ...NO_COST_MODIFIER_RACE,
      resources: { ...generousStores, wood: HOUSE.costs.wood, stone: HOUSE.costs.stone },
    })

    queueBuilding(state, testRegistry, modifiersFor(state), 'house')

    expect(state.resources.wood).toBe(0)
    expect(checkConstructionRefusal(state, testRegistry, modifiersFor(state), 'house')).toBe(
      'cannotAffordCost',
    )
  })

  it('takes as many orders as there are acres and materials for, and no fewer', () => {
    const state = createRealm({ acres: 40, resources: generousStores })

    for (let order = 0; order < 30; order += 1) {
      expect(queueBuilding(state, testRegistry, modifiersFor(state), 'house')).toBeUndefined()
    }

    expect(state.constructionQueue).toHaveLength(30)
    expect(freeAcres(state, testRegistry)).toBe(10)
  })

  it('refuses only when the queue has reserved the last free acre', () => {
    const state = createRealm({ acres: 12, resources: generousStores })

    for (let order = 0; order < 12; order += 1) {
      queueBuilding(state, testRegistry, modifiersFor(state), 'house')
    }

    expect(checkConstructionRefusal(state, testRegistry, modifiersFor(state), 'house')).toBe(
      'noFreeAcres',
    )
  })
})

describe('construction progress', () => {
  it('completes a queued building once its time has passed', () => {
    const state = createRealm({ resources: generousStores })
    queueBuilding(state, testRegistry, modifiersFor(state), 'house')

    const advanced = advanceGame(state, 60, testRegistry)

    expect(advanced.buildings.house).toBe(1)
    expect(advanced.constructionQueue).toHaveLength(0)
    expect(advanced.statistics.buildingsConstructed).toBe(1)
  })

  it('carries leftover time into the next order instead of wasting it', () => {
    const state = createRealm({ acres: 20, resources: generousStores })
    queueBuilding(state, testRegistry, modifiersFor(state), 'house')
    queueBuilding(state, testRegistry, modifiersFor(state), 'house')

    const advanced = advanceGame(state, 200, testRegistry)

    expect(advanced.buildings.house).toBe(2)
  })

  it('builds faster while a construction-speed buff is active', () => {
    const withoutBuff = createRealm({ resources: generousStores })
    queueBuilding(withoutBuff, testRegistry, modifiersFor(withoutBuff), 'temple')

    const withBuff = createRealm({ resources: generousStores })
    queueBuilding(withBuff, testRegistry, modifiersFor(withBuff), 'temple')
    withBuff.magic.activeBuffs.push({
      spellId: 'earth.livingStone',
      remainingSeconds: 999,
      modifiers: [{ target: 'constructionSpeed', operation: 'multiply', value: 2 }],
    })

    const plainProgress = advanceGame(withoutBuff, 10, testRegistry).constructionQueue[0]!
    const buffedProgress = advanceGame(withBuff, 10, testRegistry).constructionQueue[0]!

    expect(buffedProgress.secondsRemaining).toBeLessThan(plainProgress.secondsRemaining)
  })
})

describe('razing a building', () => {
  it('refuses when there is nothing of that kind standing', () => {
    const state = createRealm({ resources: generousStores })

    expect(demolishBuilding(state, testRegistry, modifiersFor(state), 'house')).toBe(
      'nothingToDemolish',
    )
  })

  it('frees the acre again', () => {
    const state = createRealm({ acres: 10, buildings: { house: 4 } })

    demolishBuilding(state, testRegistry, modifiersFor(state), 'house')

    expect(state.buildings.house).toBe(3)
    expect(freeAcres(state, testRegistry)).toBe(7)
  })

  it('returns half of what the building cost, so razing is never profitable', () => {
    const state = createRealm({ ...NO_COST_MODIFIER_RACE, buildings: { house: 1 } })

    demolishBuilding(state, testRegistry, modifiersFor(state), 'house')

    expect(state.resources.wood).toBe(Math.floor(HOUSE.costs.wood! * 0.5))
  })

  it('sends home the workers the razed building can no longer hold', () => {
    const state = createRealm({ population: 20, buildings: { farm: 2 }, workers: { farm: 6 } })

    demolishBuilding(state, testRegistry, modifiersFor(state), 'farm')

    expect(state.workerAssignments.farm).toBe(3)
  })

  it('lets a realm that filled every acre make room for a barracks', () => {
    const state = createRealm({
      acres: 10,
      buildings: { house: 5, farm: 5 },
      resources: generousStores,
    })

    expect(checkConstructionRefusal(state, testRegistry, modifiersFor(state), 'barracks')).toBe(
      'noFreeAcres',
    )

    demolishBuilding(state, testRegistry, modifiersFor(state), 'farm')

    expect(
      checkConstructionRefusal(state, testRegistry, modifiersFor(state), 'barracks'),
    ).toBeUndefined()
  })
})

describe('building in bulk', () => {
  it('offers no larger step to a realm of ten acres', () => {
    expect(unlockedBulkSteps(createRealm({ acres: 10 }))).toEqual([])
  })

  it('opens up larger steps as the realm grows', () => {
    expect(unlockedBulkSteps(createRealm({ acres: 100 }))).toEqual([10])
    expect(unlockedBulkSteps(createRealm({ acres: 10_000 }))).toEqual([10, 100])
  })

  it('places the whole order when the realm can afford it', () => {
    const state = createRealm({ acres: 500, resources: generousStores })

    expect(queueBuildings(state, testRegistry, modifiersFor(state), 'quarry', 10)).toBe(10)
    expect(state.constructionQueue).toHaveLength(10)
  })

  /** A button that refuses because the hundredth would not fit is a button nobody uses. */
  it('places as many as the free acres allow rather than refusing the lot', () => {
    const state = createRealm({ acres: 1_000, buildings: { house: 988 }, resources: generousStores })

    const placed = queueBuildings(state, testRegistry, modifiersFor(state), 'quarry', 100)

    expect(placed).toBe(12)
    expect(freeAcres(state, testRegistry)).toBe(0)
  })

  it('stops when the materials run out, not when the acres do', () => {
    const state = createRealm({ acres: 1_000, resources: { wood: 200, stone: 200 } })

    const placed = queueBuildings(state, testRegistry, modifiersFor(state), 'quarry', 100)

    expect(placed).toBeGreaterThan(0)
    expect(placed).toBeLessThan(100)
  })

  it('charges exactly ten times the price for an order of ten', () => {
    const state = createRealm({ ...NO_COST_MODIFIER_RACE, acres: 500, resources: generousStores })
    const woodBefore = state.resources.wood
    const singleCost = buildingCost(testRegistry, modifiersFor(state), 'quarry').wood!

    queueBuildings(state, testRegistry, modifiersFor(state), 'quarry', 10)

    expect(woodBefore - state.resources.wood).toBe(singleCost * 10)
  })

  it('places a bulk order in one go', () => {
    const state = createRealm({ acres: 10_000, resources: generousStores })

    expect(queueBuildings(state, testRegistry, modifiersFor(state), 'house', 100)).toBe(100)
  })
})

describe('staffing in bulk', () => {
  it('fills every free slot the idle citizens can cover', () => {
    const state = createRealm({ population: 30, buildings: { quarry: 4 } })

    expect(fillWorkerSlots(state, testRegistry, 'quarry')).toBe(12)
    expect(state.workerAssignments.quarry).toBe(12)
  })

  it('fills only as far as the idle citizens go', () => {
    const state = createRealm({ population: 5, buildings: { quarry: 10 } })

    fillWorkerSlots(state, testRegistry, 'quarry')

    expect(state.workerAssignments.quarry).toBe(5)
  })

  it('sends everyone back to idle when cleared', () => {
    const state = createRealm({ population: 30, buildings: { quarry: 4 }, workers: { quarry: 12 } })

    expect(clearWorkers(state, 'quarry')).toBe(12)
    expect(state.workerAssignments.quarry).toBe(0)
  })
})
