import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { buildAscensionStage, checkAscensionRefusal, nextAscensionStage } from './ascension'

const firstStage = testRegistry.ascensionStages[0]!

describe('the Wonder of Hai and Yah', () => {
  it('offers the first stage to a realm that has built nothing', () => {
    const state = createRealm()

    expect(nextAscensionStage(state, testRegistry)?.index).toBe(1)
  })

  it('refuses a stage the realm cannot pay for, and asks for nothing else', () => {
    const state = createRealm()

    expect(checkAscensionRefusal(state, testRegistry)).toBe('cannotAffordCost')
  })

  it('accepts a stage on resources alone, with no army, magic or land requirement', () => {
    const state = createRealm({ acres: 10, resources: { ...firstStage.costs } })

    expect(checkAscensionRefusal(state, testRegistry)).toBeUndefined()
    expect(buildAscensionStage(state, testRegistry)).toBeUndefined()
    expect(state.completedAscensionStages).toBe(1)
  })

  it('takes payment for the stage it builds', () => {
    const state = createRealm({ resources: { ...firstStage.costs } })

    buildAscensionStage(state, testRegistry)

    expect(state.resources.stone).toBe(0)
    expect(state.resources.wood).toBe(0)
  })

  it('moves on to the next, more expensive stage after each one is built', () => {
    const state = createRealm({ resources: { ...firstStage.costs } })

    buildAscensionStage(state, testRegistry)
    const secondStage = nextAscensionStage(state, testRegistry)!

    expect(secondStage.index).toBe(2)
    expect(secondStage.costs.stone!).toBeGreaterThan(firstStage.costs.stone!)
  })

  it('ends the run when the last stage is finished', () => {
    const state = createRealm()
    state.completedAscensionStages = testRegistry.ascensionStages.length - 1
    const lastStage = testRegistry.ascensionStages[testRegistry.ascensionStages.length - 1]!
    Object.assign(state.resources, lastStage.costs)

    buildAscensionStage(state, testRegistry)

    expect(state.hasAscended).toBe(true)
    expect(state.eventLog.some((event) => event.kind === 'ascension')).toBe(true)
  })

  it('has nothing left to sell once the Wonder stands', () => {
    const state = createRealm()
    state.completedAscensionStages = testRegistry.ascensionStages.length

    expect(checkAscensionRefusal(state, testRegistry)).toBe('alreadyAscended')
  })
})
