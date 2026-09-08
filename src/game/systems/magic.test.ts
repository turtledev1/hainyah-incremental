import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { BALANCE } from '../content/balance'
import { advanceGame } from '../engine/tick'
import { createRandomNumberGenerator } from '../engine/rng'
import {
  castSpell,
  checkCastRefusal,
  consumePendingBoosts,
  currentManaCapacity,
  modifiersFromSpellIds,
  tiersUnlockedInCircle,
} from './magic'
import { buildModifierIndexForState, resolveMultiplier } from './modifiers'
import { capacityOf } from './capacity'
import type { GameState } from '../model/state'
import { deriveRealmView } from '../selectors/realmView'

function castOn(state: ReturnType<typeof createRealm>, spellId: string) {
  return castSpell(state, testRegistry, spellId, createRandomNumberGenerator(state))
}

describe('circle experience', () => {
  it('unlocks no tiers before any temple has been staffed', () => {
    const state = createRealm()

    expect(tiersUnlockedInCircle(state, testRegistry, 'fire')).toBe(0)
  })

  it('unlocks tiers as the experience thresholds are passed', () => {
    const state = createRealm()
    state.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[2]!

    expect(tiersUnlockedInCircle(state, testRegistry, 'fire')).toBe(3)
  })

  it('accumulates experience from staffed temples over time', () => {
    const state = createRealm({
      buildings: { temple: 2 },
      workers: { temple: 4 },
      population: 10,
      resources: { food: 10_000 },
    })

    const advanced = advanceGame(state, 100, testRegistry)

    expect(advanced.magic.experience.fire).toBeGreaterThan(0)
  })

  it('gives elven temples more experience than human ones for the same priests', () => {
    const humanRealm = createRealm({
      raceId: 'human',
      circleIds: ['fire'],
      buildings: { temple: 1 },
      workers: { temple: 2 },
      population: 5,
      resources: { food: 10_000 },
    })
    const elfRealm = createRealm({
      raceId: 'elf',
      circleIds: ['fire'],
      buildings: { temple: 1 },
      workers: { temple: 2 },
      population: 5,
      resources: { food: 10_000 },
    })

    const humanExperience = advanceGame(humanRealm, 100, testRegistry).magic.experience.fire
    const elfExperience = advanceGame(elfRealm, 100, testRegistry).magic.experience.fire

    expect(elfExperience).toBeCloseTo(humanExperience * 1.5, 6)
  })

  it('splits temple experience between the two circles an elf studies', () => {
    const state = createRealm({
      raceId: 'elf',
      circleIds: ['water', 'dark'],
      buildings: { temple: 1 },
      workers: { temple: 2 },
      population: 5,
      resources: { food: 10_000 },
    })

    const advanced = advanceGame(state, 100, testRegistry)

    expect(advanced.magic.experience.water).toBeGreaterThan(0)
    expect(advanced.magic.experience.water).toBeCloseTo(advanced.magic.experience.dark, 10)
    expect(advanced.magic.experience.fire).toBe(0)
  })
})

describe('which spells a circle shows', () => {
  const revealedSpells = (state: GameState) =>
    deriveRealmView(state, testRegistry)
      .spells.filter((spell) => spell.isRevealed)
      .map((spell) => spell.definition.tier)

  it('shows only the first tier before a temple has taught anything', () => {
    expect(revealedSpells(createRealm({ circleIds: ['fire'] }))).toEqual([1])
  })

  it('shows the tier just beyond what the circle has reached', () => {
    const state = createRealm({ circleIds: ['fire'] })
    state.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[2]!

    expect(revealedSpells(state)).toEqual([1, 2, 3, 4])
  })

  it('shows both circles an elf studies, each at its own depth', () => {
    const state = createRealm({ raceId: 'elf', circleIds: ['dark', 'water'] })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[1]!

    const revealed = deriveRealmView(state, testRegistry).spells.filter((spell) => spell.isRevealed)

    expect(revealed.filter((spell) => spell.definition.circleId === 'dark')).toHaveLength(3)
    expect(revealed.filter((spell) => spell.definition.circleId === 'water')).toHaveLength(1)
  })
})

describe('casting', () => {
  it('refuses a spell from a circle the realm never studied', () => {
    const state = createRealm({ circleIds: ['fire'] })
    state.magic.mana = 999

    expect(checkCastRefusal(state, testRegistry, 'dark.blight')).toBe('circleNotStudied')
  })

  it('refuses a spell whose tier has not been reached yet', () => {
    const state = createRealm({ circleIds: ['fire'] })
    state.magic.mana = 999

    expect(checkCastRefusal(state, testRegistry, 'fire.solarZenith')).toBe('tierLocked')
  })

  it('refuses when there is not enough mana', () => {
    const state = createRealm({ circleIds: ['fire'] })
    state.magic.experience.fire = 100
    state.magic.mana = 0

    expect(checkCastRefusal(state, testRegistry, 'fire.sunlight')).toBe('notEnoughMana')
  })

  it('spends mana, starts the cooldown and refuses a second cast until it expires', () => {
    const state = createRealm({ circleIds: ['fire'] })
    state.magic.experience.fire = 100
    state.magic.mana = 500

    expect(castOn(state, 'fire.sunlight')).toBeUndefined()

    expect(state.magic.mana).toBe(500 - BALANCE.magic.manaCostByTier[0]!)
    expect(checkCastRefusal(state, testRegistry, 'fire.sunlight')).toBe('onCooldown')
  })

  it('puts a buff into the modifier pipeline and takes it out again when it expires', () => {
    const state = createRealm({ circleIds: ['fire'] })
    state.magic.experience.fire = 100
    state.magic.mana = 500
    castOn(state, 'fire.sunlight')

    const sunlight = testRegistry.spellsById.get('fire.sunlight')!
    const farmBonus =
      sunlight.effect.kind === 'buff'
        ? sunlight.effect.modifiers.find((modifier) => modifier.target === 'buildingOutput.farm')!.value
        : 1

    expect(
      resolveMultiplier(buildModifierIndexForState(state, testRegistry), 'buildingOutput.farm'),
    ).toBeCloseTo(farmBonus, 10)

    const afterExpiry = advanceGame(state, BALANCE.magic.sustainedDurationSeconds + 1, testRegistry)

    expect(afterExpiry.magic.activeBuffs).toHaveLength(0)
    expect(
      resolveMultiplier(buildModifierIndexForState(afterExpiry, testRegistry), 'buildingOutput.farm'),
    ).toBe(1)
  })

  it('refreshes a buff already running rather than stacking it with itself', () => {
    const state = createRealm({ circleIds: ['fire'] })
    state.magic.experience.fire = 100
    state.magic.mana = 500
    castOn(state, 'fire.sunlight')

    const partway = advanceGame(state, BALANCE.magic.sustainedDurationSeconds / 2, testRegistry)
    partway.magic.spellCooldowns['fire.sunlight'] = 0
    castOn(partway, 'fire.sunlight')

    expect(partway.magic.activeBuffs).toHaveLength(1)
    expect(partway.magic.activeBuffs[0]!.remainingSeconds).toBe(BALANCE.magic.sustainedDurationSeconds)
  })

  it('holds a one-shot boost until an expedition claims it', () => {
    const state = createRealm({ circleIds: ['dark'] })
    state.magic.experience.dark = 100
    state.magic.mana = 500
    castOn(state, 'dark.blight')

    expect(state.magic.pendingBoosts).toHaveLength(1)

    const claimedByExpedition = consumePendingBoosts(state, 'expedition')

    expect(claimedByExpedition).toEqual(['dark.blight'])
    expect(state.magic.pendingBoosts).toHaveLength(0)
    expect(modifiersFromSpellIds(testRegistry, claimedByExpedition)).toHaveLength(1)
  })

  it('does not let a heist claim a boost meant for an army', () => {
    const state = createRealm({ circleIds: ['dark'] })
    state.magic.experience.dark = 100
    state.magic.mana = 500
    castOn(state, 'dark.blight')

    expect(consumePendingBoosts(state, 'heist')).toHaveLength(0)
    expect(state.magic.pendingBoosts).toHaveLength(1)
  })

  it('runs an instant effect immediately — Sacrifice trades citizens for goods', () => {
    const state = createRealm({ circleIds: ['dark'], population: 50, buildings: { house: 20 } })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[2]!
    state.magic.mana = 500

    expect(castOn(state, 'dark.sacrifice')).toBeUndefined()

    expect(state.population).toBeLessThan(50)
    expect(state.resources.gold).toBeGreaterThan(0)
  })

  it('spends Transmute from the largest store and spreads it over every other resource', () => {
    const state = createRealm({
      circleIds: ['dark'],
      resources: { wood: 10_000, stone: 100, food: 5_000, gold: 3_000 },
    })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[1]!
    state.magic.mana = 500

    castOn(state, 'dark.transmute')

    expect(state.resources.wood).toBeCloseTo(9_000, 6)
    expect(state.resources.stone).toBeGreaterThan(100)
    expect(state.resources.food).toBeGreaterThan(5_000)
    expect(state.resources.gold).toBeGreaterThan(3_000)
  })

  it('never routes a transmutation into a single resource the realm cannot spend', () => {
    const state = createRealm({
      raceId: 'undead',
      circleIds: ['dark'],
      resources: { wood: 10_000, stone: 0, food: 0, gold: 0 },
    })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[1]!
    state.magic.mana = 500

    castOn(state, 'dark.transmute')

    expect(state.resources.stone).toBeGreaterThan(0)
    expect(state.resources.gold).toBeGreaterThan(0)
    expect(state.resources.stone).toBeCloseTo(state.resources.gold, 10)
  })

  it('trades Transmute at a loss until the Dark Circle is deep, and better once it is', () => {
    const shallowRealm = createRealm({
      circleIds: ['dark'],
      resources: { wood: 10_000, stone: 0, food: 5_000, gold: 3_000 },
    })
    shallowRealm.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[1]!
    shallowRealm.magic.mana = 500

    const deepRealm = createRealm({
      circleIds: ['dark'],
      resources: { wood: 10_000, stone: 0, food: 5_000, gold: 3_000 },
    })
    deepRealm.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[5]!
    deepRealm.magic.mana = 500

    castOn(shallowRealm, 'dark.transmute')
    castOn(deepRealm, 'dark.transmute')

    expect(shallowRealm.resources.stone).toBeLessThan(1_000)
    expect(deepRealm.resources.stone).toBeGreaterThan(shallowRealm.resources.stone)
  })

  it('pays a sacrifice out of what the realm produces, so the trade keeps pace with the realm', () => {
    const smallRealm = createRealm({
      circleIds: ['dark'],
      population: 200,
      buildings: { house: 60, quarry: 4 },
      workers: { quarry: 12 },
      resources: { food: 100_000 },
    })
    const largeRealm = createRealm({
      circleIds: ['dark'],
      population: 200,
      buildings: { house: 60, quarry: 40 },
      workers: { quarry: 120 },
      resources: { food: 100_000 },
    })
    for (const realm of [smallRealm, largeRealm]) {
      realm.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[2]!
      realm.magic.mana = 500
      castOn(realm, 'dark.sacrifice')
    }

    expect(largeRealm.resources.stone).toBeGreaterThan(smallRealm.resources.stone)
  })

  it('pays an undead realm no food for a sacrifice, because an undead realm farms none', () => {
    const state = createRealm({
      raceId: 'undead',
      circleIds: ['dark'],
      population: 200,
      buildings: { house: 60, quarry: 20 },
      workers: { quarry: 60 },
    })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[2]!
    state.magic.mana = 500

    castOn(state, 'dark.sacrifice')

    expect(state.resources.food).toBe(0)
    expect(state.resources.stone).toBeGreaterThan(0)
  })

  it('lets a barracks hold twice its soldiers while the Barrow Legion stands', () => {
    const state = createRealm({
      circleIds: ['dark'],
      population: 200,
      buildings: { house: 60, barracks: 4 },
      workers: { barracks: 8 },
      resources: { food: 100_000 },
    })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[3]!
    state.magic.mana = 500
    const capacityBefore = capacityOf(
      state,
      testRegistry,
      buildModifierIndexForState(state, testRegistry),
      'army',
    )

    expect(castOn(state, 'dark.barrowLegion')).toBeUndefined()

    expect(
      capacityOf(state, testRegistry, buildModifierIndexForState(state, testRegistry), 'army'),
    ).toBe(capacityBefore * BALANCE.magic.barrowLegionArmyCapacityMultiplier)
  })

  it('lets the soldiers raised over capacity desert once the Barrow Legion fades', () => {
    const state = createRealm({
      circleIds: ['dark'],
      population: 200,
      buildings: { house: 60, barracks: 4 },
      workers: { barracks: 8 },
      resources: { food: 100_000 },
    })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[3]!
    state.magic.mana = 500
    castOn(state, 'dark.barrowLegion')
    const modifiers = buildModifierIndexForState(state, testRegistry)
    state.soldiersAtHome = capacityOf(state, testRegistry, modifiers, 'army')
    const raisedStrength = state.soldiersAtHome

    // A tick snapshots its modifiers before magic runs, so the drop lands on the next one.
    const atExpiry = advanceGame(state, BALANCE.magic.burstDurationSeconds + 1, testRegistry)
    const afterExpiry = advanceGame(atExpiry, 600, testRegistry)

    expect(atExpiry.magic.activeBuffs).toHaveLength(0)
    expect(afterExpiry.soldiersAtHome).toBeLessThan(raisedStrength)
  })

  it('stops mana returning while the Pact of Hai and Yah holds', () => {
    const state = createRealm({ circleIds: ['dark'], resources: { food: 1_000_000 } })
    state.magic.experience.dark = BALANCE.magic.tierExperienceThresholds[5]!
    // A full pool and no more: anything above capacity is clamped away on the first tick.
    state.magic.mana = currentManaCapacity(
      state,
      testRegistry,
      buildModifierIndexForState(state, testRegistry),
    )
    castOn(state, 'dark.pactOfHaiAndYah')
    const manaAfterCasting = state.magic.mana

    const later = advanceGame(state, 30 * 60, testRegistry)

    expect(manaAfterCasting).toBeLessThan(
      currentManaCapacity(state, testRegistry, buildModifierIndexForState(state, testRegistry)),
    )
    expect(later.magic.mana).toBe(manaAfterCasting)
  })

  it('regenerates mana up to the pool the mage has earned and no further', () => {
    const state = createRealm({ resources: { food: 1_000_000 } })
    state.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[0]!
    state.magic.mana = 0

    const advanced = advanceGame(state, 24 * 60 * 60, testRegistry)
    const pool =
      BALANCE.magic.baseManaCapacity + BALANCE.magic.manaCapacityPerCircleTier

    expect(advanced.magic.mana).toBeGreaterThan(0)
    expect(advanced.magic.mana).toBeCloseTo(pool, 6)
  })

  /** Temples teach; they no longer carry a mage's mana. */
  it('gives no mana at all for temples the realm has built', () => {
    const withoutTemples = createRealm({ resources: { food: 1_000 } })
    const withTemples = createRealm({
      buildings: { temple: 5 },
      workers: { temple: 10 },
      population: 20,
      resources: { food: 1_000 },
    })
    for (const realm of [withoutTemples, withTemples]) {
      realm.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[0]!
    }

    expect(
      currentManaCapacity(
        withTemples,
        testRegistry,
        buildModifierIndexForState(withTemples, testRegistry),
      ),
    ).toBe(
      currentManaCapacity(
        withoutTemples,
        testRegistry,
        buildModifierIndexForState(withoutTemples, testRegistry),
      ),
    )
  })

  it('widens the pool with every tier the circles reach', () => {
    const novice = createRealm()
    const adept = createRealm()
    adept.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[2]!

    const poolOf = (realm: ReturnType<typeof createRealm>) =>
      currentManaCapacity(realm, testRegistry, buildModifierIndexForState(realm, testRegistry))

    expect(poolOf(novice)).toBe(BALANCE.magic.baseManaCapacity)
    expect(poolOf(adept)).toBe(
      BALANCE.magic.baseManaCapacity + 3 * BALANCE.magic.manaCapacityPerCircleTier,
    )
  })

  it('holds enough for the deepest spell a single circle can teach', () => {
    const master = createRealm()
    master.magic.experience.fire =
      BALANCE.magic.tierExperienceThresholds[BALANCE.magic.tierExperienceThresholds.length - 1]!

    const pool = currentManaCapacity(
      master,
      testRegistry,
      buildModifierIndexForState(master, testRegistry),
    )
    const priciestFireSpell = Math.max(
      ...testRegistry.spells.filter((spell) => spell.circleId === 'fire').map((spell) => spell.manaCost),
    )

    expect(pool).toBeGreaterThanOrEqual(priciestFireSpell)
  })
})
