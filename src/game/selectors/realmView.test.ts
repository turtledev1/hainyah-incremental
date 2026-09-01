import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { deriveRealmView } from './realmView'

describe('what the interface is told about hunger', () => {
  it('does not claim a living race is free of hunger just because nobody lives there yet', () => {
    const emptyDwarfRealm = createRealm({ raceId: 'dwarf', circleIds: ['earth'], population: 0 })

    const view = deriveRealmView(emptyDwarfRealm, testRegistry)

    expect(view.foodConsumptionPerSecond).toBe(0)
    expect(view.foodConsumptionPerCitizenPerSecond).toBeGreaterThan(0)
  })

  it('reports no hunger per citizen for the undead, at any population', () => {
    const undeadRealm = createRealm({ raceId: 'undead', circleIds: ['dark'], population: 200 })

    expect(deriveRealmView(undeadRealm, testRegistry).foodConsumptionPerCitizenPerSecond).toBe(0)
  })

  it('shows the cost of every building and whether it can be raised right now', () => {
    const state = createRealm({ resources: { wood: 1_000, stone: 1_000 } })

    const view = deriveRealmView(state, testRegistry)
    const house = view.buildings.find((building) => building.definition.id === 'house')!
    const temple = view.buildings.find((building) => building.definition.id === 'temple')!

    expect(house.refusal).toBeUndefined()
    expect(temple.refusal).toBe('cannotAffordCost')
  })

  it('offers only the spells of the circles the realm actually studies', () => {
    const view = deriveRealmView(createRealm({ circleIds: ['fire'] }), testRegistry)

    expect(view.spells.length).toBe(6)
    expect(view.spells.every((spell) => spell.definition.circleId === 'fire')).toBe(true)
  })
})
