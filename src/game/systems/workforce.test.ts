import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { advanceGame } from '../engine/tick'
import { buildModifierIndexForState } from './modifiers'
import { removeCitizens } from './stateHelpers'
import { reconcileWorkforce } from './workforce'

function reconcile(state: ReturnType<typeof createRealm>, deltaSeconds = 1) {
  reconcileWorkforce({
    state,
    registry: testRegistry,
    modifiers: buildModifierIndexForState(state, testRegistry),
    deltaSeconds,
  })
}

describe('losing citizens', () => {
  it('takes priests before farmers, so one famine does not spiral into the next', () => {
    const state = createRealm({
      population: 8,
      buildings: { farm: 2, temple: 2 },
      workers: { farm: 4, temple: 4 },
    })

    removeCitizens(state, 4)

    expect(state.workerAssignments.temple).toBe(0)
    expect(state.workerAssignments.farm).toBe(4)
  })

  it('takes idle citizens before anyone with a job', () => {
    const state = createRealm({ population: 10, buildings: { farm: 2 }, workers: { farm: 4 } })

    removeCitizens(state, 5)

    expect(state.workerAssignments.farm).toBe(4)
    expect(state.population).toBe(5)
  })

  it('cannot reach the soldiers who are already away on campaign', () => {
    const state = createRealm({ population: 10, soldiersAtHome: 0 })
    state.expeditions.push({
      id: 1,
      targetId: 'hamlet',
      soldiers: 10,
      phase: 'travelling',
      secondsRemaining: 30,
      totalPhaseSeconds: 60,
      appliedBoostSpellIds: [],
      outcomeAcresGained: 0,
      outcomePlunder: {},
      outcomeSoldiersLost: 0,
      outcomeSucceeded: false,
    })

    removeCitizens(state, 10)

    expect(state.expeditions[0]!.soldiers).toBe(10)
  })
})

describe('reconciling roles with the population', () => {
  it('gives back worker slots that a razed building can no longer provide', () => {
    const state = createRealm({ population: 20, buildings: { farm: 1 }, workers: { farm: 9 } })

    reconcile(state)

    expect(state.workerAssignments.farm).toBe(3)
  })

  it('trims the least essential work when more roles are filled than citizens remain', () => {
    const state = createRealm({
      population: 6,
      buildings: { farm: 4, temple: 4, mine: 4 },
      workers: { farm: 6, temple: 6, mine: 6 },
    })

    reconcile(state)

    const totalWorkers =
      state.workerAssignments.farm + state.workerAssignments.temple + state.workerAssignments.mine
    expect(totalWorkers).toBeLessThanOrEqual(6)
    expect(state.workerAssignments.farm).toBe(6)
    expect(state.workerAssignments.temple).toBe(0)
  })

  it('thins the ranks gradually rather than erasing an army when a drill-master starves', () => {
    const state = createRealm({
      population: 40,
      soldiersAtHome: 30,
      buildings: { barracks: 1 },
      workers: { barracks: 0 },
    })

    reconcile(state)

    expect(state.soldiersAtHome).toBeGreaterThan(0)
    expect(state.soldiersAtHome).toBeLessThan(30)
  })

  it('empties the ranks eventually if the barracks stay unstaffed', () => {
    const state = createRealm({
      population: 40,
      soldiersAtHome: 30,
      buildings: { barracks: 1 },
      workers: { barracks: 0 },
    })

    for (let tick = 0; tick < 400; tick += 1) {
      reconcile(state)
    }

    expect(state.soldiersAtHome).toBe(0)
  })

  it('reports a trickle of deserters as one chronicle line rather than fifty', () => {
    const state = createRealm({
      population: 40,
      soldiersAtHome: 30,
      buildings: { barracks: 1 },
      workers: { barracks: 0 },
    })

    for (let tick = 0; tick < 20; tick += 1) {
      reconcile(state)
    }

    const desertionLines = state.eventLog.filter(
      (event) => event.messageKey === 'chronicle.soldiersDeserted',
    )
    expect(desertionLines).toHaveLength(1)
    expect(desertionLines[0]!.values?.count).toBeGreaterThan(1)
  })

  it('says in the chronicle when soldiers drift away', () => {
    const state = createRealm({
      population: 40,
      soldiersAtHome: 30,
      buildings: { barracks: 1 },
      workers: { barracks: 0 },
    })

    reconcile(state)

    expect(
      state.eventLog.some((event) => event.messageKey === 'chronicle.soldiersDeserted'),
    ).toBe(true)
  })

  it('leaves a well-staffed realm exactly as it found it', () => {
    const state = createRealm({
      population: 12,
      buildings: { farm: 2, house: 6 },
      workers: { farm: 6 },
      resources: { food: 10_000 },
    })

    const advanced = advanceGame(state, 1, testRegistry)

    expect(advanced.workerAssignments.farm).toBe(6)
  })
})
