import { describe, expect, it } from 'vitest'
import { testRegistry } from '../../test/realmFixtures'
import { BALANCE } from './balance'
import { RESOURCE_IDS } from '../model/ids'
import { buildModifierIndexForState, resolveMultiplier } from '../systems/modifiers'
import { createRealm } from '../../test/realmFixtures'
import { englishTranslations } from '../../i18n/locales/en'

describe('the content registry', () => {
  it('assembles without tripping any of its own consistency checks', () => {
    expect(testRegistry.races.length).toBeGreaterThan(0)
    expect(testRegistry.spells.length).toBe(30)
    expect(testRegistry.ascensionStages).toHaveLength(8)
  })

  it('gives every magic circle a full ladder of six tiers of spells', () => {
    for (const circle of testRegistry.magicCircles) {
      const tiers = testRegistry.spells
        .filter((spell) => spell.circleId === circle.id)
        .map((spell) => spell.tier)
        .sort()

      expect(tiers).toEqual([1, 2, 3, 4, 5, 6])
    }
  })

  it('gives every upgrade a cost, so nothing is accidentally free', () => {
    for (const upgrade of testRegistry.upgrades) {
      const total = RESOURCE_IDS.reduce(
        (runningTotal, resourceId) => runningTotal + (upgrade.costs[resourceId] ?? 0),
        0,
      )
      expect(total).toBeGreaterThan(0)
    }
  })

  it('never asks a race to choose more circles than it is offered', () => {
    for (const race of testRegistry.races) {
      expect(race.magicCircleAccess.choosableCircleIds.length).toBeGreaterThanOrEqual(
        race.magicCircleAccess.chosenCircleCount,
      )
    }
  })

  it('leaves every race with at least one circle to study', () => {
    for (const race of testRegistry.races) {
      const { grantedCircleIds, chosenCircleCount } = race.magicCircleAccess
      expect(grantedCircleIds.length + chosenCircleCount).toBeGreaterThanOrEqual(1)
    }
  })

  it('never offers a race a circle it already holds by right', () => {
    for (const race of testRegistry.races) {
      const { grantedCircleIds, choosableCircleIds } = race.magicCircleAccess
      expect(choosableCircleIds.filter((circleId) => grantedCircleIds.includes(circleId))).toEqual([])
    }
  })

  it('raises the cost of each conquest tier along with its reward', () => {
    const byTier = [...testRegistry.conquestTargets].sort((left, right) => left.tier - right.tier)

    for (let index = 1; index < byTier.length; index += 1) {
      expect(byTier[index]!.requiredSoldiers).toBeGreaterThan(byTier[index - 1]!.requiredSoldiers)
      expect(byTier[index]!.acresGained).toBeGreaterThan(byTier[index - 1]!.acresGained)
    }
  })

  it('raises the cost of every ascension stage above the one before it', () => {
    for (let index = 1; index < testRegistry.ascensionStages.length; index += 1) {
      expect(testRegistry.ascensionStages[index]!.costs.stone!).toBeGreaterThan(
        testRegistry.ascensionStages[index - 1]!.costs.stone!,
      )
    }
  })
})

describe('each playable race', () => {
  it('delivers the undead promise: no hunger and no battle deaths', () => {
    const state = createRealm({ raceId: 'undead', circleIds: ['dark'] })
    const modifiers = buildModifierIndexForState(state, testRegistry)

    expect(resolveMultiplier(modifiers, 'consumption.food')).toBe(0)
    expect(resolveMultiplier(modifiers, 'warfare.casualtyRate')).toBe(0)
  })

  it('delivers the dwarven promise: richer mines and quarries', () => {
    const modifiers = buildModifierIndexForState(
      createRealm({ raceId: 'dwarf', circleIds: ['earth'] }),
      testRegistry,
    )

    expect(resolveMultiplier(modifiers, 'buildingOutput.mine')).toBeGreaterThan(1)
    expect(resolveMultiplier(modifiers, 'buildingOutput.quarry')).toBeGreaterThan(1)
  })

  it('gives elves the Dark Circle by right, with one elemental circle left to choose', () => {
    const elf = testRegistry.racesById.get('elf')!

    expect(elf.magicCircleAccess.grantedCircleIds).toEqual(['dark'])
    expect(elf.magicCircleAccess.chosenCircleCount).toBe(1)
    expect(elf.magicCircleAccess.choosableCircleIds).not.toContain('dark')
  })

  it('gives the undead the Dark Circle with nothing to choose', () => {
    const undead = testRegistry.racesById.get('undead')!

    expect(undead.magicCircleAccess.grantedCircleIds).toEqual(['dark'])
    expect(undead.magicCircleAccess.chosenCircleCount).toBe(0)
  })

  it('keeps the Dark Circle away from races that were not promised it', () => {
    for (const raceId of ['human', 'dwarf'] as const) {
      const access = testRegistry.racesById.get(raceId)!.magicCircleAccess
      expect(access.grantedCircleIds).not.toContain('dark')
      expect(access.choosableCircleIds).not.toContain('dark')
    }
  })

  it('states a cost for every strength, so no race is strictly better', () => {
    for (const race of testRegistry.races) {
      const copy = englishTranslations.content.races[race.id]
      expect(copy.advantages.length).toBeGreaterThan(0)
      expect(copy.disadvantages.length).toBeGreaterThan(0)
    }
  })
})

describe('the shape of a buff', () => {
  const buffs = testRegistry.spells.filter((spell) => spell.effect.kind === 'buff')

  /** The session's decision: one burst now, or two lasting buffs that outlive your visit. */
  it('prices a burst at exactly two lasting buffs of the same tier', () => {
    for (const spell of buffs) {
      if (spell.effect.kind !== 'buff' || spell.effect.shape !== 'burst') {
        continue
      }
      const lastingOfSameTier = buffs.find(
        (other) =>
          other.tier === spell.tier && other.effect.kind === 'buff' && other.effect.shape === 'sustained',
      )
      if (lastingOfSameTier) {
        expect(spell.manaCost).toBe(lastingOfSameTier.manaCost * 2)
      }
    }
  })

  it('makes a burst far shorter than a lasting buff', () => {
    for (const spell of buffs) {
      if (spell.effect.kind !== 'buff') {
        continue
      }
      const isBurst = spell.effect.shape === 'burst'
      expect(spell.effect.durationSeconds).toBe(
        isBurst ? BALANCE.magic.burstDurationSeconds : BALANCE.magic.sustainedDurationSeconds,
      )
    }
  })

  it('holds a pool deep enough for the priciest spell each circle can teach', () => {
    const fullyLearnedPool =
      BALANCE.magic.baseManaCapacity +
      BALANCE.magic.tierExperienceThresholds.length * BALANCE.magic.manaCapacityPerCircleTier

    for (const circle of testRegistry.magicCircles) {
      const priciest = Math.max(
        ...testRegistry.spells
          .filter((spell) => spell.circleId === circle.id)
          .map((spell) => spell.manaCost),
      )
      expect(fullyLearnedPool).toBeGreaterThanOrEqual(priciest)
    }
  })

  /**
   * Ten minutes of production can never rival ninety, so a burst that buffs production
   * is a trap. A burst has to buy a moment the player chooses: a battle, a building.
   */
  it('never spends a burst on passive production', () => {
    for (const spell of buffs) {
      if (spell.effect.kind !== 'buff' || spell.effect.shape !== 'burst') {
        continue
      }
      for (const modifier of spell.effect.modifiers) {
        expect(modifier.target).not.toMatch(/^production\./)
        expect(modifier.target).not.toMatch(/^buildingOutput\./)
      }
    }
  })

  it('gives the timing circles something worth a whole pool', () => {
    const circlesWithABurst = new Set(
      buffs
        .filter((spell) => spell.effect.kind === 'buff' && spell.effect.shape === 'burst')
        .map((spell) => spell.circleId),
    )

    expect(circlesWithABurst).toContain('fire')
    expect(circlesWithABurst).toContain('earth')
    expect(circlesWithABurst).toContain('dark')
  })

  it('leaves every circle at least one lasting buff to leave running', () => {
    for (const circle of testRegistry.magicCircles) {
      const lasting = buffs.filter(
        (spell) =>
          spell.circleId === circle.id &&
          spell.effect.kind === 'buff' &&
          spell.effect.shape === 'sustained',
      )
      expect(lasting.length).toBeGreaterThan(0)
    }
  })

  it('makes a burst hit far harder than anything left running', () => {
    const strongest = (spellId: string) => {
      const effect = testRegistry.spellsById.get(spellId)!.effect
      return effect.kind === 'buff'
        ? Math.max(...effect.modifiers.map((modifier) => modifier.value))
        : 0
    }

    expect(strongest('fire.immolate')).toBeGreaterThanOrEqual(3)
    expect(strongest('earth.livingStone')).toBeGreaterThanOrEqual(3)
    expect(strongest('dark.soulHarvest')).toBeGreaterThanOrEqual(3)
  })
})
