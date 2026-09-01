import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import type { Modifier } from '../model/modifiers'
import {
  buildModifierIndex,
  buildModifierIndexForState,
  resolveMultiplier,
  resolveValue,
  safeDivide,
} from './modifiers'

describe('the modifier pipeline', () => {
  it('applies additive contributions to the base value before any multiplier', () => {
    const index = buildModifierIndex([
      { target: 'production.food', operation: 'add', value: 2 },
      { target: 'production.food', operation: 'multiply', value: 3 },
    ])

    expect(resolveValue(index, 'production.food', 10)).toBe(36)
  })

  it('multiplies several multipliers together rather than taking the largest', () => {
    const index = buildModifierIndex([
      { target: 'buildingOutput.mine', operation: 'multiply', value: 1.5 },
      { target: 'buildingOutput.mine', operation: 'multiply', value: 2 },
    ])

    expect(resolveMultiplier(index, 'buildingOutput.mine')).toBe(3)
  })

  it('treats a missing target as an untouched base value', () => {
    const index = buildModifierIndex([])

    expect(resolveValue(index, 'capacity.army', 40)).toBe(40)
    expect(resolveMultiplier(index, 'warfare.attackPower')).toBe(1)
  })

  it('lets a zero multiplier remove a rule outright, and no additive can undo it', () => {
    const removeFoodConsumption: Modifier = {
      target: 'consumption.food',
      operation: 'multiply',
      value: 0,
    }
    const index = buildModifierIndex([
      removeFoodConsumption,
      { target: 'consumption.food', operation: 'add', value: 1_000 },
    ])

    expect(resolveValue(index, 'consumption.food', 5)).toBe(0)
  })

  it('collects modifiers from the race, purchased upgrades and active buffs together', () => {
    const state = createRealm({ raceId: 'dwarf', circleIds: ['earth'] })
    state.purchasedUpgrades['mining.ironPicks'] = 1
    state.magic.activeBuffs.push({
      spellId: 'earth.veinsOfOre',
      label: 'Veins of Ore',
      remainingSeconds: 30,
      modifiers: [{ target: 'buildingOutput.mine', operation: 'multiply', value: 1.35 }],
    })

    const index = buildModifierIndexForState(state, testRegistry)

    // Dwarf 1.6, Iron Picks 1.3, Veins of Ore 1.35.
    expect(resolveMultiplier(index, 'buildingOutput.mine')).toBeCloseTo(1.6 * 1.3 * 1.35, 10)
  })

  it('counts a repeatable upgrade once for every purchase', () => {
    const state = createRealm()
    state.purchasedUpgrades['fortification.reinforceWalls'] = 3

    const index = buildModifierIndexForState(state, testRegistry)

    expect(resolveMultiplier(index, 'warfare.casualtyRate')).toBeCloseTo(0.96 ** 3, 10)
  })

  it('ignores purchases of upgrades the current content no longer defines', () => {
    const state = createRealm()
    state.purchasedUpgrades['mining.somethingRemovedInAPatch'] = 4

    expect(() => buildModifierIndexForState(state, testRegistry)).not.toThrow()
  })
})

describe('dividing by a resolved rate', () => {
  it('returns infinity rather than NaN when the rate has been zeroed out', () => {
    expect(safeDivide(120, 0)).toBe(Number.POSITIVE_INFINITY)
  })

  it('returns zero when there is nothing to divide and no rate to divide by', () => {
    expect(safeDivide(0, 0)).toBe(0)
  })
})
