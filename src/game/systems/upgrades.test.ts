import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { BALANCE } from '../content/balance'
import { advanceGame } from '../engine/tick'
import { capacityOf } from './capacity'
import { queueBuilding } from './construction'
import { buildModifierIndexForState, resolveMultiplier } from './modifiers'
import {
  checkUpgradeRefusal,
  isUpgradeVisible,
  isUpgradeWithinReach,
  purchaseUpgrade,
  revealUpgrades,
  upgradeCost,
} from './upgrades'

/** Upgrades state the total their line reaches, so tests read that rather than recompute it. */
function declaredTotal(upgradeId: string, target: string): number {
  return testRegistry
    .upgradesById.get(upgradeId)!
    .modifiers.find((modifier) => modifier.target === target)!.value
}

const generousStores = { wood: 10_000_000, stone: 10_000_000, gold: 10_000_000, food: 10_000_000 }

describe('upgrade requirements', () => {
  it('refuses an upgrade whose supporting buildings are missing', () => {
    const state = createRealm({ resources: generousStores })

    expect(checkUpgradeRefusal(state, testRegistry, 'housing.timberFrames')).toBe('missingBuildings')
  })

  it('refuses a later tier until the earlier tier in the line is owned', () => {
    const state = createRealm({ resources: generousStores, buildings: { house: 20 } })

    expect(checkUpgradeRefusal(state, testRegistry, 'housing.stoneHouses')).toBe(
      'missingPrerequisiteUpgrade',
    )
  })

  it('refuses an upgrade gated on conquest until a large enough place has fallen', () => {
    const state = createRealm({ resources: generousStores, buildings: { house: 30 } })
    state.purchasedUpgrades['housing.timberFrames'] = 1
    state.purchasedUpgrades['housing.stoneHouses'] = 1

    expect(checkUpgradeRefusal(state, testRegistry, 'housing.manorHalls')).toBe('conquestTierTooLow')

    state.highestConquestTierDefeated = 2

    expect(checkUpgradeRefusal(state, testRegistry, 'housing.manorHalls')).toBeUndefined()
  })

  it('refuses an upgrade gated on magic until some circle is deep enough', () => {
    const state = createRealm({ resources: generousStores, buildings: { mine: 12 } })
    state.purchasedUpgrades['mining.ironPicks'] = 1
    state.purchasedUpgrades['mining.steelPicks'] = 1

    expect(checkUpgradeRefusal(state, testRegistry, 'mining.blastingPowder')).toBe('magicTierTooLow')

    state.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[1]!

    expect(checkUpgradeRefusal(state, testRegistry, 'mining.blastingPowder')).toBeUndefined()
  })

  it('accepts a magic gate satisfied by whichever circle the race happens to have', () => {
    const undeadRealm = createRealm({
      raceId: 'undead',
      circleIds: ['dark'],
      resources: generousStores,
      buildings: { mine: 12 },
    })
    undeadRealm.purchasedUpgrades['mining.ironPicks'] = 1
    undeadRealm.purchasedUpgrades['mining.steelPicks'] = 1
    undeadRealm.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[1]!

    expect(checkUpgradeRefusal(undeadRealm, testRegistry, 'mining.blastingPowder')).toBeUndefined()
  })

  it('refuses to sell the same one-off upgrade twice', () => {
    const state = createRealm({ resources: generousStores, buildings: { house: 5 } })
    purchaseUpgrade(state, testRegistry, 'housing.timberFrames')

    expect(checkUpgradeRefusal(state, testRegistry, 'housing.timberFrames')).toBe('alreadyAtMaximum')
  })
})

describe('buying an upgrade', () => {
  it('takes payment and records the purchase', () => {
    const state = createRealm({ resources: generousStores, buildings: { house: 5 } })
    const woodBefore = state.resources.wood

    expect(purchaseUpgrade(state, testRegistry, 'housing.timberFrames')).toBeUndefined()

    expect(state.purchasedUpgrades['housing.timberFrames']).toBe(1)
    expect(state.resources.wood).toBe(woodBefore - 400)
  })

  it('raises the housing capacity a house provides, which is the point of stone houses', () => {
    const state = createRealm({ resources: generousStores, buildings: { house: 10 } })
    const capacityBefore = capacityOf(
      state,
      testRegistry,
      buildModifierIndexForState(state, testRegistry),
      'population',
    )

    purchaseUpgrade(state, testRegistry, 'housing.timberFrames')
    purchaseUpgrade(state, testRegistry, 'housing.stoneHouses')

    const capacityAfter = capacityOf(
      state,
      testRegistry,
      buildModifierIndexForState(state, testRegistry),
      'population',
    )

    expect(capacityAfter).toBe(
      Math.floor(capacityBefore * declaredTotal('housing.stoneHouses', 'capacity.population')),
    )
  })

  it('improves the building it targets and nothing else', () => {
    const state = createRealm({ resources: generousStores, buildings: { lumberCamp: 3 } })
    purchaseUpgrade(state, testRegistry, 'woodcutting.bronzeAxes')
    const modifiers = buildModifierIndexForState(state, testRegistry)

    expect(resolveMultiplier(modifiers, 'buildingOutput.lumberCamp')).toBeCloseTo(1.3, 10)
    expect(resolveMultiplier(modifiers, 'buildingOutput.mine')).toBe(1)
  })
})

describe('repeatable upgrades', () => {
  it('costs more every time it is bought', () => {
    const state = createRealm({ resources: generousStores, buildings: { barracks: 2 } })
    const definition = testRegistry.upgradesById.get('fortification.reinforceWalls')!

    const firstCost = upgradeCost(state, definition).stone!
    purchaseUpgrade(state, testRegistry, definition.id)
    const secondCost = upgradeCost(state, definition).stone!

    expect(secondCost).toBe(Math.ceil(firstCost * 1.35))
  })

  it('stacks its effect once per purchase', () => {
    const state = createRealm({ resources: generousStores, buildings: { barracks: 2 } })
    purchaseUpgrade(state, testRegistry, 'fortification.reinforceWalls')
    purchaseUpgrade(state, testRegistry, 'fortification.reinforceWalls')

    expect(
      resolveMultiplier(buildModifierIndexForState(state, testRegistry), 'warfare.casualtyRate'),
    ).toBeCloseTo(0.96 * 0.96, 10)
  })

  it('stops selling once its maximum number of purchases is reached', () => {
    const state = createRealm({ resources: generousStores, buildings: { barracks: 2 } })
    const definition = testRegistry.upgradesById.get('fortification.reinforceWalls')!
    state.purchasedUpgrades[definition.id] = definition.repeatable!.maxPurchases

    expect(checkUpgradeRefusal(state, testRegistry, definition.id)).toBe('alreadyAtMaximum')
  })
})

describe('improvements the guild has to earn', () => {
  const generousGuild = {
    resources: generousStores,
    buildings: { thievesGuild: 12 },
  } as const

  it('refuses a thievery improvement until a mark of that standing has been robbed', () => {
    const state = createRealm(generousGuild)
    state.purchasedUpgrades['thievery.lockpicks'] = 1

    expect(checkUpgradeRefusal(state, testRegistry, 'thievery.smokeBombs')).toBe(
      'thieveryTierTooLow',
    )

    state.highestThieveryTierRobbed = 2

    expect(checkUpgradeRefusal(state, testRegistry, 'thievery.smokeBombs')).toBeUndefined()
  })

  it('keeps such an improvement out of the list until then', () => {
    const state = createRealm(generousGuild)
    state.purchasedUpgrades['thievery.lockpicks'] = 1
    const smokeBombs = testRegistry.upgradesById.get('thievery.smokeBombs')!

    expect(isUpgradeWithinReach(state, testRegistry, smokeBombs)).toBe(false)

    state.highestThieveryTierRobbed = 2

    expect(isUpgradeWithinReach(state, testRegistry, smokeBombs)).toBe(true)
  })
})

describe('a line that states its totals', () => {
  const mineOutput = (state: ReturnType<typeof createRealm>) =>
    resolveMultiplier(buildModifierIndexForState(state, testRegistry), 'buildingOutput.mine')

  it('reaches the total a tier declares, not the product of the line', () => {
    const state = createRealm({ raceId: 'human' })

    state.purchasedUpgrades['mining.ironPicks'] = 1
    expect(mineOutput(state)).toBeCloseTo(declaredTotal('mining.ironPicks', 'buildingOutput.mine'), 10)

    state.purchasedUpgrades['mining.steelPicks'] = 1
    expect(mineOutput(state)).toBeCloseTo(declaredTotal('mining.steelPicks', 'buildingOutput.mine'), 10)

    state.purchasedUpgrades['mining.blastingPowder'] = 1
    expect(mineOutput(state)).toBeCloseTo(
      declaredTotal('mining.blastingPowder', 'buildingOutput.mine'),
      10,
    )
  })

  it('keeps what a later tier says nothing about', () => {
    const state = createRealm({ raceId: 'human' })
    state.purchasedUpgrades['military.drillYards'] = 1
    state.purchasedUpgrades['military.standingArmy'] = 1
    state.purchasedUpgrades['military.siegeEngines'] = 1
    const index = buildModifierIndexForState(state, testRegistry)

    expect(resolveMultiplier(index, 'warfare.attackPower')).toBeCloseTo(
      declaredTotal('military.siegeEngines', 'warfare.attackPower'),
      10,
    )
    expect(resolveMultiplier(index, 'capacity.army')).toBeCloseTo(
      declaredTotal('military.standingArmy', 'capacity.army'),
      10,
    )
  })

  it('still compounds a repeatable, which has no later tier to take it over', () => {
    const state = createRealm({ raceId: 'human' })
    state.purchasedUpgrades['fortification.reinforceWalls'] = 10
    const perPurchase = declaredTotal('fortification.reinforceWalls', 'warfare.casualtyRate')

    expect(
      resolveMultiplier(buildModifierIndexForState(state, testRegistry), 'warfare.casualtyRate'),
    ).toBeCloseTo(perPurchase ** 10, 10)
  })
})

describe('the masonry line', () => {
  it('drains a long queue several times faster once it is fully adopted', () => {
    const queueAHundredHouses = (state: ReturnType<typeof createRealm>) => {
      for (let order = 0; order < 100; order += 1) {
        queueBuilding(state, testRegistry, buildModifierIndexForState(state, testRegistry), 'house')
      }
      return state
    }
    const plainRealm = queueAHundredHouses(
      createRealm({ raceId: 'dwarf', acres: 150, resources: generousStores }),
    )
    const skilledRealm = createRealm({ raceId: 'dwarf', acres: 150, resources: generousStores })
    for (const upgradeId of ['masonry.workCrews', 'masonry.scaffolding', 'masonry.masterBuilders']) {
      skilledRealm.purchasedUpgrades[upgradeId] = 1
    }
    queueAHundredHouses(skilledRealm)

    const plainBuilt = advanceGame(plainRealm, 40, testRegistry).buildings.house
    const skilledBuilt = advanceGame(skilledRealm, 40, testRegistry).buildings.house

    expect(skilledBuilt).toBeGreaterThan(plainBuilt * 5)
  })
})

describe('which improvements are listed', () => {
  it('lists nothing at all on the first morning', () => {
    const state = createRealm()

    const listed = testRegistry.upgrades.filter((upgrade) => isUpgradeWithinReach(state, testRegistry, upgrade))

    expect(listed).toEqual([])
  })

  it('lists an improvement once its building stands and half its cost is in hand', () => {
    const picks = testRegistry.upgradesById.get('mining.ironPicks')!
    const halfPaid = {
      wood: picks.costs.wood! * 0.5,
      stone: picks.costs.stone! * 0.5,
      gold: picks.costs.gold! * 0.5,
    }

    const withoutAMine = createRealm({ resources: halfPaid })
    const withAMine = createRealm({ buildings: { mine: 1 }, resources: halfPaid })

    expect(isUpgradeWithinReach(withoutAMine, testRegistry, picks)).toBe(false)
    expect(isUpgradeWithinReach(withAMine, testRegistry, picks)).toBe(true)
  })

  it('keeps an improvement hidden while the materials are far off', () => {
    const picks = testRegistry.upgradesById.get('mining.ironPicks')!
    const state = createRealm({ buildings: { mine: 2 }, resources: { gold: 1 } })

    expect(isUpgradeWithinReach(state, testRegistry, picks)).toBe(false)
  })

  it('does not need the full building count that buying it will require', () => {
    const picks = testRegistry.upgradesById.get('mining.ironPicks')!
    const state = createRealm({ buildings: { mine: 1 }, resources: generousStores })

    expect(picks.requires.buildingCounts!.mine).toBeGreaterThan(1)
    expect(isUpgradeWithinReach(state, testRegistry, picks)).toBe(true)
    expect(checkUpgradeRefusal(state, testRegistry, picks.id)).toBe('missingBuildings')
  })

  it('keeps a later tier of a line out of sight until the earlier one is adopted', () => {
    const state = createRealm({ buildings: { mine: 12 }, resources: generousStores })

    expect(isUpgradeWithinReach(state, testRegistry, testRegistry.upgradesById.get('mining.steelPicks')!)).toBe(false)

    state.purchasedUpgrades['mining.ironPicks'] = 1

    expect(isUpgradeWithinReach(state, testRegistry, testRegistry.upgradesById.get('mining.steelPicks')!)).toBe(true)
  })

  it('respects the magic and conquest gates rather than teasing what cannot be had', () => {
    const state = createRealm({ buildings: { mine: 12 }, resources: generousStores })
    state.purchasedUpgrades['mining.ironPicks'] = 1
    state.purchasedUpgrades['mining.steelPicks'] = 1
    const powder = testRegistry.upgradesById.get('mining.blastingPowder')!

    expect(isUpgradeWithinReach(state, testRegistry, powder)).toBe(false)

    state.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[1]!

    expect(isUpgradeWithinReach(state, testRegistry, powder)).toBe(true)
  })

  it('remembers an improvement it has revealed, even after the materials are spent', () => {
    const state = createRealm({ buildings: { mine: 1 }, resources: generousStores })

    revealUpgrades({ state, registry: testRegistry })
    const revealedCount = state.revealedUpgradeIds.length
    Object.assign(state.resources, { food: 0, wood: 0, stone: 0, gold: 0 })
    revealUpgrades({ state, registry: testRegistry })

    expect(state.revealedUpgradeIds).toHaveLength(revealedCount)
    expect(state.revealedUpgradeIds).toContain('mining.ironPicks')
    expect(isUpgradeVisible(state, testRegistry.upgradesById.get('mining.ironPicks')!)).toBe(true)
  })

  it('announces a newly reachable improvement in the chronicle', () => {
    const state = createRealm({ buildings: { mine: 1 }, resources: generousStores })

    revealUpgrades({ state, registry: testRegistry })

    expect(state.eventLog.some((event) => event.messageKey === 'chronicle.upgradeAvailable')).toBe(true)
  })

  it('grows the list gradually rather than showing every line at once', () => {
    const earlyRealm = createRealm({ buildings: { house: 1 }, resources: { wood: 500, stone: 300 } })
    revealUpgrades({ state: earlyRealm, registry: testRegistry })

    const richRealm = createRealm({
      buildings: { house: 5, mine: 2, farm: 2, quarry: 2, lumberCamp: 2, barracks: 2, thievesGuild: 2, temple: 2 },
      resources: generousStores,
    })
    revealUpgrades({ state: richRealm, registry: testRegistry })

    expect(earlyRealm.revealedUpgradeIds.length).toBeLessThan(richRealm.revealedUpgradeIds.length)
    expect(earlyRealm.revealedUpgradeIds.length).toBeLessThan(5)
  })
})
