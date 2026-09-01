import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../test/realmFixtures'
import { deriveRealmView } from '../game/selectors/realmView'
import type { GameState } from '../game/model/state'
import { tabToShow, unlockedTabs } from './tabs'

function keysFor(state: GameState): readonly string[] {
  return unlockedTabs(state, deriveRealmView(state, testRegistry)).map((tab) => tab.key)
}

describe('which tabs a realm shows', () => {
  it('offers only the realm and its settings on the first morning', () => {
    expect(keysFor(createRealm())).toEqual(['realm', 'settings'])
  })

  it('opens Improvements as soon as one is within reach', () => {
    const state = createRealm({ buildings: { house: 1 }, resources: { wood: 400, stone: 200 } })
    state.revealedUpgradeIds.push('housing.timberFrames')

    expect(keysFor(state)).toContain('improvements')
  })

  it('keeps Improvements shut while nothing has been revealed', () => {
    expect(keysFor(createRealm({ resources: { wood: 400, stone: 200 } }))).not.toContain(
      'improvements',
    )
  })

  it('opens Magic with the first temple', () => {
    expect(keysFor(createRealm())).not.toContain('magic')
    expect(keysFor(createRealm({ buildings: { temple: 1 } }))).toContain('magic')
  })

  it('opens Conquest with the first barracks and Thievery with the first guild', () => {
    expect(keysFor(createRealm({ buildings: { barracks: 1 } }))).toContain('conquest')
    expect(keysFor(createRealm({ buildings: { barracks: 1 } }))).not.toContain('thievery')
    expect(keysFor(createRealm({ buildings: { thievesGuild: 1 } }))).toContain('thievery')
  })

  it('opens the Wonder once land has actually been taken', () => {
    const beforeAnyBattle = createRealm({ buildings: { temple: 4 } })
    const afterAVictory = createRealm({ buildings: { temple: 4 } })
    afterAVictory.highestConquestTierDefeated = 1

    expect(keysFor(beforeAnyBattle)).not.toContain('wonder')
    expect(keysFor(afterAVictory)).toContain('wonder')
  })

  it('shows everything to a realm that has built everything', () => {
    const state = createRealm({
      buildings: { temple: 4, barracks: 4, thievesGuild: 4, house: 10 },
      resources: { wood: 1_000, stone: 1_000, gold: 1_000 },
    })
    state.highestConquestTierDefeated = 3
    state.revealedUpgradeIds.push('housing.timberFrames')

    expect(keysFor(state)).toEqual([
      'realm',
      'improvements',
      'magic',
      'conquest',
      'thievery',
      'wonder',
      'settings',
    ])
  })

  it('keeps the realm and settings reachable no matter what', () => {
    expect(keysFor(createRealm())).toContain('realm')
    expect(keysFor(createRealm())).toContain('settings')
  })
})

describe('the tab actually displayed', () => {
  it('falls back to the realm when the chosen tab locks itself again', () => {
    const withTemple = createRealm({ buildings: { temple: 1 } })
    const withoutTemple = createRealm()

    expect(tabToShow('magic', withTemple, deriveRealmView(withTemple, testRegistry))).toBe('magic')
    expect(tabToShow('magic', withoutTemple, deriveRealmView(withoutTemple, testRegistry))).toBe(
      'realm',
    )
  })

  it('leaves an unlocked choice alone', () => {
    const state = createRealm({ buildings: { barracks: 2 } })

    expect(tabToShow('conquest', state, deriveRealmView(state, testRegistry))).toBe('conquest')
  })
})
