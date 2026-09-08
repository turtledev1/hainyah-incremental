import { describe, expect, it } from 'vitest'
import { createRealm } from '../test/realmFixtures'
import { CONTENT_REGISTRY } from '../game/content'
import { BALANCE } from '../game/content/balance'
import { i18n } from '../i18n'
import { describeUnmetRequirements } from './upgradeLabels'

const translate = i18n.t.bind(i18n)
const BLASTING_POWDER = CONTENT_REGISTRY.upgradesById.get('mining.blastingPowder')!

function requirementsFor(state: ReturnType<typeof createRealm>): readonly string[] {
  return describeUnmetRequirements(BLASTING_POWDER, state, CONTENT_REGISTRY, translate)
}

describe('telling the player how to unlock an improvement', () => {
  it('states how many buildings are wanted and how many stand', () => {
    const state = createRealm({ buildings: { mine: 4 } })

    expect(requirementsFor(state)).toContain('Needs 12 × Mine — you have 4')
  })

  it('names the improvement that has to come first', () => {
    expect(requirementsFor(createRealm())).toContain('Needs Steel Picks')
  })

  it('names the tier of magic the improvement waits on', () => {
    expect(requirementsFor(createRealm())).toContain('Needs a circle at tier 2')
  })

  it('says nothing once every requirement but the cost is met', () => {
    const state = createRealm({ buildings: { mine: 12 } })
    state.purchasedUpgrades['mining.ironPicks'] = 1
    state.purchasedUpgrades['mining.steelPicks'] = 1
    state.magic.experience.fire = BALANCE.magic.tierExperienceThresholds[1]!

    expect(requirementsFor(state)).toEqual([])
  })

  it('names the mark that has to be robbed for a guild-gated improvement', () => {
    const smokeBombs = CONTENT_REGISTRY.upgradesById.get('thievery.smokeBombs')!

    expect(
      describeUnmetRequirements(smokeBombs, createRealm(), CONTENT_REGISTRY, translate),
    ).toContain("Needs Mason's Compound robbed")
  })

  it('names the place that has to fall for a conquest-gated improvement', () => {
    const siegeEngines = CONTENT_REGISTRY.upgradesById.get('military.siegeEngines')!

    expect(
      describeUnmetRequirements(siegeEngines, createRealm(), CONTENT_REGISTRY, translate),
    ).toContain('Needs Walled Town taken')
  })
})
