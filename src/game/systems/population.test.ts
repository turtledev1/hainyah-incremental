import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { advanceGame } from '../engine/tick'
import { capacityOf } from './capacity'
import { computeFoodConsumptionPerSecond } from './food'
import { buildModifierIndexForState } from './modifiers'
import { freeHousingSlots, secondsUntilNextCitizen } from './population'

const wellFed = { food: 100_000 }

function modifiersFor(state: ReturnType<typeof createRealm>) {
  return buildModifierIndexForState(state, testRegistry)
}

describe('when the next citizen arrives', () => {
  it('is a finite wait once there is housing and food', () => {
    const state = createRealm({ buildings: { house: 1 }, resources: wellFed })

    expect(secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))).toBeGreaterThan(0)
    expect(secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))).toBeLessThan(600)
  })

  it('never comes when every house is full', () => {
    const state = createRealm({ buildings: { house: 1 }, population: 4, resources: wellFed })

    expect(freeHousingSlots(state, testRegistry, modifiersFor(state))).toBe(0)
    expect(secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))).toBe(
      Number.POSITIVE_INFINITY,
    )
  })

  it('never comes when the granary is too low to raise anyone', () => {
    const state = createRealm({ buildings: { house: 2 }, population: 3, resources: { food: 0 } })

    expect(freeHousingSlots(state, testRegistry, modifiersFor(state))).toBeGreaterThan(0)
    expect(secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))).toBe(
      Number.POSITIVE_INFINITY,
    )
  })

  it('counts down second for second while that citizen is still on the way', () => {
    const state = createRealm({ buildings: { house: 2 }, resources: wellFed })
    const atStart = secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))

    const partWay = advanceGame(state, atStart / 2, testRegistry)
    const remaining = secondsUntilNextCitizen(partWay, testRegistry, modifiersFor(partWay))

    expect(remaining).toBeCloseTo(atStart / 2, 6)
  })

  it('starts a fresh countdown once a citizen has arrived', () => {
    const state = createRealm({ buildings: { house: 2 }, resources: wellFed })
    const atStart = secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))

    const justAfterBirth = advanceGame(state, atStart + 0.5, testRegistry)

    expect(Math.floor(justAfterBirth.population)).toBe(1)
    expect(
      secondsUntilNextCitizen(justAfterBirth, testRegistry, modifiersFor(justAfterBirth)),
    ).toBeGreaterThan(atStart / 2)
  })

  it('predicts the arrival closely enough to trust the countdown', () => {
    const state = createRealm({ buildings: { house: 3 }, resources: wellFed })
    const predicted = secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))

    const justBefore = advanceGame(state, predicted - 1, testRegistry)
    const justAfter = advanceGame(state, predicted + 1, testRegistry)

    expect(Math.floor(justBefore.population)).toBe(0)
    expect(Math.floor(justAfter.population)).toBe(1)
  })

  it('fills the very last housing slot rather than stalling just short of it', () => {
    const state = createRealm({ buildings: { house: 1 }, resources: wellFed })
    const capacity = capacityOf(state, testRegistry, modifiersFor(state), 'population')

    const muchLater = advanceGame(state, 60 * 60, testRegistry)

    expect(Math.floor(muchLater.population)).toBe(capacity)
  })
})

describe('who eats', () => {
  it('charges only for the citizens the player can see', () => {
    const state = createRealm({ population: 2.9, buildings: { house: 3 }, resources: wellFed })

    const forTwoCitizens = createRealm({ population: 2, buildings: { house: 3 } })

    expect(computeFoodConsumptionPerSecond(state, modifiersFor(state))).toBe(
      computeFoodConsumptionPerSecond(forTwoCitizens, modifiersFor(forTwoCitizens)),
    )
  })

  it('steps up when a citizen is actually born, not before', () => {
    const almostThere = createRealm({ population: 2.99, buildings: { house: 3 } })
    const bornAtLast = createRealm({ population: 3, buildings: { house: 3 } })

    expect(computeFoodConsumptionPerSecond(bornAtLast, modifiersFor(bornAtLast))).toBeGreaterThan(
      computeFoodConsumptionPerSecond(almostThere, modifiersFor(almostThere)),
    )
  })

  it('charges nothing before the first citizen has finished arriving', () => {
    const state = createRealm({ population: 0.8, buildings: { house: 1 } })

    expect(computeFoodConsumptionPerSecond(state, modifiersFor(state))).toBe(0)
  })
})

describe('the pace of arrivals', () => {
  /** Waits used to grow with each citizen, because the rate tapered as housing filled. */
  it('does not make each citizen in a house slower than the last', () => {
    const emptyHouse = createRealm({ buildings: { house: 3 }, population: 0, resources: wellFed })
    const nearlyFull = createRealm({ buildings: { house: 3 }, population: 11, resources: wellFed })

    expect(secondsUntilNextCitizen(nearlyFull, testRegistry, modifiersFor(nearlyFull))).toBeLessThanOrEqual(
      secondsUntilNextCitizen(emptyHouse, testRegistry, modifiersFor(emptyHouse)),
    )
  })

  it('fills a new house faster in a large realm than in a small one', () => {
    const small = createRealm({ buildings: { house: 2 }, population: 4, resources: wellFed })
    const large = createRealm({ buildings: { house: 40 }, population: 120, resources: wellFed })

    expect(secondsUntilNextCitizen(large, testRegistry, modifiersFor(large))).toBeLessThan(
      secondsUntilNextCitizen(small, testRegistry, modifiersFor(small)),
    )
  })

  it('holds the rate steady between one birth and the next, so the countdown is exact', () => {
    const state = createRealm({ buildings: { house: 5 }, population: 3, resources: wellFed })
    const predicted = secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))

    const partWay = advanceGame(state, predicted * 0.75, testRegistry)

    expect(secondsUntilNextCitizen(partWay, testRegistry, modifiersFor(partWay))).toBeCloseTo(
      predicted * 0.25,
      6,
    )
  })

  it('still stops dead when the last house is full', () => {
    const state = createRealm({ buildings: { house: 1 }, population: 4, resources: wellFed })

    expect(secondsUntilNextCitizen(state, testRegistry, modifiersFor(state))).toBe(
      Number.POSITIVE_INFINITY,
    )
  })
})
