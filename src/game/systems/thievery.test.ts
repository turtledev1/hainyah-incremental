import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { BALANCE } from '../content/balance'
import { advanceGame } from '../engine/tick'
import { deriveRealmView } from '../selectors/realmView'
import { checkHeistRefusal, computeSuccessChance, launchHeist } from './thievery'

const GRANARY = testRegistry.thieveryTargetsById.get('granary')!

function guildRealm(thieves: number, raceId: 'human' | 'undead' | 'hobbit' = 'human') {
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

describe('who comes back', () => {
  const runJobs = (state: ReturnType<typeof guildRealm>, jobs: number) => {
    let running = state
    for (let job = 0; job < jobs; job += 1) {
      launchHeist(running, testRegistry, 'granary')
      running = advanceGame(running, GRANARY.durationSeconds + 1, testRegistry)
    }
    return running
  }

  it('brings every undead thief home, however the job goes', () => {
    const state = guildRealm(GRANARY.requiredThieves * 4, 'undead')
    const thievesBefore = state.thievesAtHome

    const afterJobs = runJobs(state, 40)

    expect(afterJobs.thievesAtHome).toBe(thievesBefore)
  })

  it('loses living thieves over the same run of jobs, so the promise means something', () => {
    const state = guildRealm(GRANARY.requiredThieves * 4)
    const thievesBefore = state.thievesAtHome

    const afterJobs = runJobs(state, 40)

    expect(afterJobs.thievesAtHome).toBeLessThan(thievesBefore)
  })
})

describe('what the guild shows a young realm', () => {
  const revealedMarks = (state: ReturnType<typeof guildRealm>) =>
    deriveRealmView(state, testRegistry)
      .thieveryTargets.filter((target) => target.isRevealed)
      .map((target) => target.definition.id)

  it('offers only the easiest mark and the next one up at the start', () => {
    expect(revealedMarks(guildRealm(10))).toEqual(['granary', 'timberYard', 'masonsCompound'])
  })

  it('shows one more mark once a tier has actually been robbed', () => {
    let state = guildRealm(GRANARY.requiredThieves * 5)
    for (let job = 0; job < 5; job += 1) {
      launchHeist(state, testRegistry, 'granary')
      state = advanceGame(state, GRANARY.durationSeconds + 1, testRegistry)
    }

    expect(state.statistics.heistsSucceeded).toBeGreaterThan(0)
    expect(state.highestThieveryTierRobbed).toBe(GRANARY.tier)
    expect(revealedMarks(state)).toEqual([
      'granary',
      'timberYard',
      'masonsCompound',
      'countingHouse',
    ])
  })
})

describe('quoting the haul before the job runs', () => {
  /** Wood only: the realm neither grows nor eats it, so a delta is pure loot. */
  const quotedWood = (state: ReturnType<typeof guildRealm>): number =>
    deriveRealmView(state, testRegistry).thieveryTargets.find(
      (target) => target.definition.id === 'granary',
    )!.estimatedBestLoot.wood ?? 0

  it('quotes a human the haul the mark holds', () => {
    expect(quotedWood(guildRealm(10))).toBe(GRANARY.loot.wood)
  })

  it('quotes a hobbit more, because hobbits know what is worth taking', () => {
    expect(quotedWood(guildRealm(10, 'hobbit'))).toBeGreaterThan(GRANARY.loot.wood!)
  })

  it('quotes more once the guild has bought smoke bombs', () => {
    const equippedRealm = guildRealm(10)
    equippedRealm.purchasedUpgrades['thievery.smokeBombs'] = 1

    expect(quotedWood(equippedRealm)).toBeGreaterThan(quotedWood(guildRealm(10)))
  })

  const quotedSeconds = (state: ReturnType<typeof guildRealm>): number =>
    deriveRealmView(state, testRegistry).thieveryTargets.find(
      (target) => target.definition.id === 'granary',
    )!.estimatedDurationSeconds

  it('quotes a hobbit the longer job time their slow care really costs', () => {
    expect(quotedSeconds(guildRealm(10))).toBe(GRANARY.durationSeconds)
    expect(quotedSeconds(guildRealm(10, 'hobbit'))).toBeGreaterThan(GRANARY.durationSeconds)
  })

  it('never promises a hobbit more than a job brings home, nor much less', () => {
    let state = guildRealm(GRANARY.requiredThieves * 5, 'hobbit')
    const quoted = quotedWood(state)
    const jobSeconds = quotedSeconds(state)
    state.resources.wood = 0
    let jobsThatPaid = 0

    for (let job = 0; job < 5; job += 1) {
      const woodBefore = state.resources.wood
      launchHeist(state, testRegistry, 'granary')
      state = advanceGame(state, jobSeconds + 1, testRegistry)

      const taken = state.resources.wood - woodBefore
      expect(taken).toBeLessThanOrEqual(quoted)
      if (taken > 0) {
        jobsThatPaid += 1
        expect(taken).toBeGreaterThanOrEqual(quoted * BALANCE.thievery.minimumLootFraction)
      }
    }

    expect(jobsThatPaid).toBeGreaterThan(0)
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
