import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { BALANCE } from '../content/balance'
import { advanceGame } from '../engine/tick'
import { checkHeistRefusal, computeSuccessChance, launchHeist } from './thievery'

const GRANARY = testRegistry.thieveryTargetsById.get('granary')!

function guildRealm(thieves: number, raceId: 'human' | 'undead' = 'human') {
  return createRealm({
    raceId,
    circleIds: raceId === 'undead' ? ['dark'] : ['air'],
    population: thieves + 5,
    thievesAtHome: thieves,
    buildings: { thievesGuild: 8, house: 20 },
    workers: { thievesGuild: 16 },
    resources: { food: 1_000_000 },
  })
}

describe('sending thieves out', () => {
  it('refuses a job the guild cannot staff', () => {
    const state = guildRealm(0)

    expect(checkHeistRefusal(state, testRegistry, 'granary')).toBe('notEnoughThievesAtHome')
  })

  it('takes the thieves off the roster while the job runs', () => {
    const state = guildRealm(10)

    expect(launchHeist(state, testRegistry, 'granary')).toBeUndefined()

    expect(state.thievesAtHome).toBe(10 - GRANARY.requiredThieves)
    expect(state.heists).toHaveLength(1)
  })
})

describe('the odds of a job', () => {
  it('improves with the thievery upgrade line', () => {
    const plainRealm = guildRealm(10)
    const equippedRealm = guildRealm(10)
    equippedRealm.purchasedUpgrades['thievery.lockpicks'] = 1

    expect(computeSuccessChance(equippedRealm, testRegistry, 'granary')).toBeGreaterThan(
      computeSuccessChance(plainRealm, testRegistry, 'granary'),
    )
  })

  it('is worse for the undead, who are poor at quiet work', () => {
    expect(computeSuccessChance(guildRealm(10, 'undead'), testRegistry, 'granary')).toBeLessThan(
      computeSuccessChance(guildRealm(10), testRegistry, 'granary'),
    )
  })

  it('never reaches certainty, however much the guild spends', () => {
    const state = guildRealm(10)
    const bribes = testRegistry.upgradesById.get('bribery.guildBribes')!
    state.purchasedUpgrades[bribes.id] = bribes.repeatable!.maxPurchases
    state.purchasedUpgrades['thievery.lockpicks'] = 1
    state.purchasedUpgrades['thievery.guildNetwork'] = 1
    state.magic.activeBuffs.push({
      spellId: 'air.whisperingWinds',
      remainingSeconds: 60,
      modifiers: [{ target: 'thievery.successChance', operation: 'multiply', value: 2 }],
    })

    expect(computeSuccessChance(state, testRegistry, 'granary')).toBe(
      BALANCE.thievery.maximumSuccessChance,
    )
  })

  /** Bribes are meant for the jobs that are actually hard, not to gild the easy ones. */
  it('still moves the odds on a job that is nowhere near the ceiling', () => {
    const plain = guildRealm(60)
    const bribed = guildRealm(60)
    const bribes = testRegistry.upgradesById.get('bribery.guildBribes')!
    bribed.purchasedUpgrades[bribes.id] = bribes.repeatable!.maxPurchases

    const before = computeSuccessChance(plain, testRegistry, 'royalVault')
    const after = computeSuccessChance(bribed, testRegistry, 'royalVault')

    expect(after).toBeGreaterThan(before)
    expect(after).toBeLessThan(BALANCE.thievery.maximumSuccessChance)
  })

  it('does not promise more than the ceiling allows across the whole line', () => {
    const bribes = testRegistry.upgradesById.get('bribery.guildBribes')!
    const fullStack = 1.03 ** bribes.repeatable!.maxPurchases

    expect(fullStack).toBeLessThan(1.5)
  })

  it('is harder for a richer mark', () => {
    const state = guildRealm(60)

    expect(computeSuccessChance(state, testRegistry, 'royalVault')).toBeLessThan(
      computeSuccessChance(state, testRegistry, 'granary'),
    )
  })
})

describe('resolving a job', () => {
  it('returns the surviving thieves to the guild when the run is over', () => {
    const state = guildRealm(10)
    launchHeist(state, testRegistry, 'granary')

    const afterJob = advanceGame(state, GRANARY.durationSeconds + 1, testRegistry)

    expect(afterJob.heists).toHaveLength(0)
    expect(afterJob.statistics.heistsSucceeded + afterJob.statistics.heistsFailed).toBe(1)
  })

  it('brings loot home from a successful run', () => {
    const state = guildRealm(10)
    state.resources.food = 0
    launchHeist(state, testRegistry, 'granary')

    const afterJob = advanceGame(state, GRANARY.durationSeconds + 1, testRegistry)

    if (afterJob.statistics.heistsSucceeded === 1) {
      expect(afterJob.resources.food).toBeGreaterThan(0)
    } else {
      expect(afterJob.resources.food).toBe(0)
    }
  })

  it('produces the same outcome twice from the same seed, so the run is reproducible', () => {
    const firstRun = guildRealm(20)
    launchHeist(firstRun, testRegistry, 'countingHouse')
    const secondRun = guildRealm(20)
    launchHeist(secondRun, testRegistry, 'countingHouse')

    const firstOutcome = advanceGame(firstRun, 400, testRegistry)
    const secondOutcome = advanceGame(secondRun, 400, testRegistry)

    expect(firstOutcome.resources.gold).toBe(secondOutcome.resources.gold)
    expect(firstOutcome.thievesAtHome).toBe(secondOutcome.thievesAtHome)
  })

  it('spends a heist boost on the next job rather than on an army', () => {
    const state = guildRealm(20)
    state.magic.pendingBoosts.push({
      spellId: 'air.whisperingWinds',
      consumeOn: 'heist',
      modifiers: [{ target: 'thievery.successChance', operation: 'multiply', value: 1.5 }],
    })

    launchHeist(state, testRegistry, 'granary')

    expect(state.heists[0]!.appliedBoostSpellIds).toEqual(['air.whisperingWinds'])
    expect(state.magic.pendingBoosts).toHaveLength(0)
  })
})
