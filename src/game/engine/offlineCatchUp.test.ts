import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { BALANCE } from '../content/balance'
import { applyOfflineProgress } from './offlineCatchUp'

function productiveRealm() {
  return createRealm({
    population: 12,
    buildings: { house: 6, farm: 2, lumberCamp: 2, quarry: 1 },
    workers: { farm: 6, lumberCamp: 6, quarry: 3 },
    resources: { food: 5_000 },
  })
}

describe('crediting time away', () => {
  it('produces resources for the time that passed', () => {
    const state = productiveRealm()

    const { state: caughtUp, summary } = applyOfflineProgress(state, testRegistry, 60 * 30)

    expect(caughtUp.resources.wood).toBeGreaterThan(state.resources.wood)
    expect(summary.resourceGains.wood).toBeGreaterThan(0)
  })

  it('credits nothing for no time away', () => {
    const state = productiveRealm()

    const { summary } = applyOfflineProgress(state, testRegistry, 0)

    expect(summary.creditedSeconds).toBe(0)
    expect(summary.resourceGains.wood).toBe(0)
  })

  it('caps the credited time and says so', () => {
    const state = productiveRealm()
    const threeDays = 3 * 24 * 60 * 60

    const { summary } = applyOfflineProgress(state, testRegistry, threeDays)

    expect(summary.creditedSeconds).toBe(BALANCE.offline.maximumCreditedSeconds)
    expect(summary.wasCapped).toBe(true)
    expect(summary.awaySeconds).toBe(threeDays)
  })

  it('does not report a cap for a short absence', () => {
    const { summary } = applyOfflineProgress(productiveRealm(), testRegistry, 120)

    expect(summary.wasCapped).toBe(false)
  })

  it('leaves the original state untouched, so a failed catch-up cannot corrupt a run', () => {
    const state = productiveRealm()
    const woodBefore = state.resources.wood

    applyOfflineProgress(state, testRegistry, 60 * 60)

    expect(state.resources.wood).toBe(woodBefore)
  })

  it('gives the same result twice for the same save, since the generator is seeded', () => {
    const firstRun = applyOfflineProgress(productiveRealm(), testRegistry, 60 * 60 * 4)
    const secondRun = applyOfflineProgress(productiveRealm(), testRegistry, 60 * 60 * 4)

    expect(firstRun.state.resources).toEqual(secondRun.state.resources)
    expect(firstRun.state.population).toBe(secondRun.state.population)
  })

  it('finishes buildings that were under construction while the tab was closed', () => {
    const state = productiveRealm()
    state.constructionQueue.push({ buildingId: 'house', secondsRemaining: 8, totalSeconds: 8 })

    const { state: caughtUp, summary } = applyOfflineProgress(state, testRegistry, 60)

    expect(caughtUp.buildings.house).toBe(7)
    expect(summary.buildingsCompleted).toBe(1)
  })

  it('resolves battles that were in flight while the tab was closed', () => {
    const state = productiveRealm()
    state.soldiersAtHome = 0
    state.population = 120
    state.buildings.barracks = 8
    state.workerAssignments.barracks = 16
    state.buildings.house = 40
    state.expeditions.push({
      id: 1,
      targetId: 'hamlet',
      soldiers: 40,
      phase: 'travelling',
      secondsRemaining: 30,
      totalPhaseSeconds: 60,
      appliedBoostSpellIds: [],
      outcomeAcresGained: 0,
      outcomeSoldiersLost: 0,
      outcomeSucceeded: false,
    })

    const { state: caughtUp, summary } = applyOfflineProgress(state, testRegistry, 60 * 10)

    expect(summary.battlesResolved).toBe(1)
    expect(caughtUp.expeditions).toHaveLength(0)
    expect(caughtUp.soldiersAtHome).toBeGreaterThan(0)
  })

  it('starves a hungry realm left without food, rather than pausing the clock', () => {
    const state = createRealm({ population: 30, buildings: { house: 20 }, resources: { food: 0 } })

    const { state: caughtUp } = applyOfflineProgress(state, testRegistry, 60 * 60)

    expect(caughtUp.population).toBeLessThan(30)
  })

  it('simulates half a day quickly enough to run on load', () => {
    const startedAtMs = performance.now()

    applyOfflineProgress(productiveRealm(), testRegistry, BALANCE.offline.maximumCreditedSeconds)

    expect(performance.now() - startedAtMs).toBeLessThan(2_000)
  })
})
