import { describe, expect, it } from 'vitest'
import { CONTENT_REGISTRY } from '../game/content'
import { i18n } from '../i18n'
import { describeModifierEffect, stackModifiers, summariseModifiers } from './modifierLabels'
import { contentKeys } from '../i18n/contentKeys'

const translate = i18n.t.bind(i18n)

describe('telling the player what an upgrade changes', () => {
  it('says plainly that Calloused Hands is about gathering by hand', () => {
    const callousedHands = CONTENT_REGISTRY.upgradesById.get('gathering.callousedHands')!

    expect(summariseModifiers(callousedHands.modifiers, CONTENT_REGISTRY, translate)).toEqual([
      'Gathering by hand +100%',
    ])
  })

  it('names the building an output modifier applies to', () => {
    expect(
      describeModifierEffect(
        { target: 'buildingOutput.mine', operation: 'multiply', value: 1.6 },
        CONTENT_REGISTRY,
        translate,
      ),
    ).toBe('Mine output +60%')
  })

  it('reads a reduction as a reduction', () => {
    expect(
      describeModifierEffect(
        { target: 'consumption.food', operation: 'multiply', value: 0.9 },
        CONTENT_REGISTRY,
        translate,
      ),
    ).toBe('Hunger for food -10%')
  })

  it('collapses a modifier on every resource into one line', () => {
    const handcarts = CONTENT_REGISTRY.upgradesById.get('logistics.handcarts')!

    expect(summariseModifiers(handcarts.modifiers, CONTENT_REGISTRY, translate)).toEqual([
      'All production +10%',
    ])
  })

  it('keeps the other effects alongside a collapsed production line', () => {
    const wagons = CONTENT_REGISTRY.upgradesById.get('logistics.wagons')!

    const described = summariseModifiers(wagons.modifiers, CONTENT_REGISTRY, translate)

    expect(described[0]).toBe('All production +15%')
    expect(described).toContain('March speed +15%')
  })

  it('has a readable label for every modifier any upgrade uses', () => {
    const unlabelled = CONTENT_REGISTRY.upgrades.flatMap((upgrade) =>
      summariseModifiers(upgrade.modifiers, CONTENT_REGISTRY, translate).filter((effect) =>
        effect.includes('modifiers.'),
      ),
    )

    expect(unlabelled).toEqual([])
  })

  it('has a readable label for every modifier any race or spell uses', () => {
    const fromRaces = CONTENT_REGISTRY.races.flatMap((race) => race.modifiers)
    const fromSpells = CONTENT_REGISTRY.spells.flatMap((spell) =>
      spell.effect.kind === 'instant' ? [] : spell.effect.modifiers,
    )

    const unlabelled = [...fromRaces, ...fromSpells]
      .map((modifier) => describeModifierEffect(modifier, CONTENT_REGISTRY, translate))
      .filter((effect) => effect.includes('modifiers.'))

    expect(unlabelled).toEqual([])
  })
})

describe('what a repeatable upgrade adds up to', () => {
  /** Nobody should have to raise 0.96 to the twenty-fifth power in their head. */
  it('compounds a reduction across every purchase', () => {
    const walls = CONTENT_REGISTRY.upgradesById.get('fortification.reinforceWalls')!

    expect(summariseModifiers(walls.modifiers, CONTENT_REGISTRY, translate)).toEqual([
      'Battle casualties -4%',
    ])
    expect(
      summariseModifiers(stackModifiers(walls.modifiers, 25), CONTENT_REGISTRY, translate),
    ).toEqual(['Battle casualties -64%'])
  })

  it('compounds a bonus the same way', () => {
    const bribes = CONTENT_REGISTRY.upgradesById.get('bribery.guildBribes')!

    expect(
      summariseModifiers(stackModifiers(bribes.modifiers, 25), CONTENT_REGISTRY, translate),
    ).toEqual(['Heist success +109%'])
  })

  it('reports the partway total for the purchases already made', () => {
    const walls = CONTENT_REGISTRY.upgradesById.get('fortification.reinforceWalls')!

    expect(
      summariseModifiers(stackModifiers(walls.modifiers, 6), CONTENT_REGISTRY, translate),
    ).toEqual(['Battle casualties -22%'])
  })

  it('leaves a single purchase reading exactly as the upgrade does', () => {
    const walls = CONTENT_REGISTRY.upgradesById.get('fortification.reinforceWalls')!

    expect(summariseModifiers(stackModifiers(walls.modifiers, 1), CONTENT_REGISTRY, translate)).toEqual(
      summariseModifiers(walls.modifiers, CONTENT_REGISTRY, translate),
    )
  })

  it('adds up an additive modifier rather than compounding it', () => {
    expect(
      stackModifiers([{ target: 'capacity.army', operation: 'add', value: 5 }], 4),
    ).toEqual([{ target: 'capacity.army', operation: 'add', value: 20 }])
  })
})

describe('what a spell tells the player it does', () => {
  const effectsOf = (spellId: string) => {
    const effect = CONTENT_REGISTRY.spellsById.get(spellId)!.effect
    return effect.kind === 'instant'
      ? []
      : summariseModifiers(effect.modifiers, CONTENT_REGISTRY, translate)
  }

  it('states a buff in the same terms as an upgrade', () => {
    expect(effectsOf('water.irrigation')).toEqual(['Farm output +70%'])
    expect(effectsOf('fire.immolate')).toEqual(['Attack power +200%'])
  })

  it('states what a raid boost does to the enemy', () => {
    expect(effectsOf('dark.blight')).toEqual(['Enemy defence -35%'])
  })

  it('lists each effect of a spell that does several things', () => {
    expect(effectsOf('air.tailwind')).toEqual(['March speed +80%', 'Thief speed +80%'])
  })

  it('collapses a spell that lifts all production into one line', () => {
    expect(effectsOf('air.haste')).toEqual(['All production +50%'])
  })

  it('has a readable effect for every spell that carries modifiers', () => {
    for (const spell of CONTENT_REGISTRY.spells) {
      if (spell.effect.kind === 'instant') {
        continue
      }
      const described = effectsOf(spell.id)
      expect(described.length).toBeGreaterThan(0)
      expect(described.join(' ')).not.toContain('modifiers.')
    }
  })

  /** Instants have no modifiers, so their prose has to carry the whole explanation. */
  it('leaves every instant spell with a description that explains itself', () => {
    for (const spell of CONTENT_REGISTRY.spells) {
      if (spell.effect.kind !== 'instant') {
        continue
      }
      expect(translate(contentKeys.spellDescription(spell.id)).length).toBeGreaterThan(30)
    }
  })
})
