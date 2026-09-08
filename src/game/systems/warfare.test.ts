import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { advanceGame } from '../engine/tick'
import { deriveRealmView } from '../selectors/realmView'
import type { GameState } from '../model/state'
import { checkExpeditionRefusal, computeLegSeconds, launchExpedition } from './warfare'

const HAMLET = testRegistry.conquestTargetsById.get('hamlet')!

/** Enough barracks and drill-masters to hold the force, so nothing gets disbanded mid-test. */
function armedRealm(soldiers: number, overrides: Partial<Parameters<typeof createRealm>[0]> = {}): GameState {
  const barracks = Math.max(1, Math.ceil(soldiers / 12))
  return createRealm({
    acres: 10_000,
    population: soldiers + barracks * 2 + 5,
    soldiersAtHome: soldiers,
    buildings: { barracks, house: soldiers + 50 },
    workers: { barracks: barracks * 2 },
    resources: { food: 100_000_000 },
    ...overrides,
  })
}

describe('sending an army', () => {
  it('lets a small force march, because the battle is settled on power', () => {
    const state = armedRealm(HAMLET.recommendedSoldiers - 1)

    expect(
      checkExpeditionRefusal(state, testRegistry, 'hamlet', HAMLET.recommendedSoldiers - 1),
    ).toBeUndefined()
  })

  it('refuses an expedition with nobody in it', () => {
    expect(checkExpeditionRefusal(armedRealm(10), testRegistry, 'hamlet', 0)).toBe('noSoldiersSent')
  })

  it('lets a buffed handful take a place a bare handful could not', () => {
    const spell = testRegistry.spellsById.get('fire.immolate')!
    const buffed = armedRealm(HAMLET.recommendedSoldiers - 3)
    buffed.magic.activeBuffs.push({
      spellId: spell.id,
      remainingSeconds: HAMLET.travelSeconds + 10,
      modifiers: spell.effect.kind === 'buff' ? spell.effect.modifiers : [],
    })
    const soldiers = HAMLET.recommendedSoldiers - 3
    launchExpedition(buffed, testRegistry, 'hamlet', soldiers)

    const afterBattle = advanceGame(buffed, HAMLET.travelSeconds + 1, testRegistry)

    expect(afterBattle.statistics.battlesWon).toBe(1)
  })

  it('refuses to send soldiers the realm does not have at home', () => {
    const state = armedRealm(HAMLET.recommendedSoldiers)

    expect(checkExpeditionRefusal(state, testRegistry, 'hamlet', 500)).toBe(
      'notEnoughSoldiersAtHome',
    )
  })

  it('counts down the places the realm can still march on', () => {
    const capital = testRegistry.conquestTargetsById.get('capital')!
    const state = armedRealm(capital.recommendedSoldiers * 2)
    const placesFreeForCapital = (realm: GameState) =>
      deriveRealmView(realm, testRegistry).conquestTargets.find(
        (target) => target.definition.id === 'capital',
      )!.placesFree

    expect(placesFreeForCapital(state)).toBe(capital.placesInTheWorld)

    launchExpedition(state, testRegistry, 'capital', capital.recommendedSoldiers)

    expect(placesFreeForCapital(state)).toBe(capital.placesInTheWorld - 1)
  })

  it('refuses a further army once every place of that kind is under attack', () => {
    const twinThrones = testRegistry.conquestTargetsById.get('twinThrones')!
    const state = armedRealm(twinThrones.recommendedSoldiers * 2)
    launchExpedition(state, testRegistry, 'twinThrones', twinThrones.recommendedSoldiers)

    expect(twinThrones.placesInTheWorld).toBe(1)
    expect(
      checkExpeditionRefusal(state, testRegistry, 'twinThrones', twinThrones.recommendedSoldiers),
    ).toBe('everyPlaceUnderAttack')
  })

  it('lets as many armies out as the world has places of that kind', () => {
    const capital = testRegistry.conquestTargetsById.get('capital')!
    const state = armedRealm(capital.recommendedSoldiers * (capital.placesInTheWorld + 1))

    for (let army = 0; army < capital.placesInTheWorld; army += 1) {
      expect(
        launchExpedition(state, testRegistry, 'capital', capital.recommendedSoldiers),
      ).toBeUndefined()
    }

    expect(
      checkExpeditionRefusal(state, testRegistry, 'capital', capital.recommendedSoldiers),
    ).toBe('everyPlaceUnderAttack')
  })

  it('frees a place again once the army is home', () => {
    const twinThrones = testRegistry.conquestTargetsById.get('twinThrones')!
    const state = armedRealm(twinThrones.recommendedSoldiers)
    launchExpedition(state, testRegistry, 'twinThrones', twinThrones.recommendedSoldiers)

    const afterTheCampaign = advanceGame(state, twinThrones.travelSeconds * 2 + 2, testRegistry)

    expect(afterTheCampaign.expeditions).toHaveLength(0)
    expect(checkExpeditionRefusal(afterTheCampaign, testRegistry, 'twinThrones', 1)).toBeUndefined()
  })

  it('keeps taking a place that has been taken many times over', () => {
    const state = armedRealm(50)
    state.defeatedConquestTargets.hamlet = 500

    expect(checkExpeditionRefusal(state, testRegistry, 'hamlet', 50)).toBeUndefined()
  })

  it('marches the soldiers out of the realm while they are away', () => {
    const state = armedRealm(20)

    expect(launchExpedition(state, testRegistry, 'hamlet', 20)).toBeUndefined()

    expect(state.soldiersAtHome).toBe(0)
    expect(state.expeditions).toHaveLength(1)
    expect(state.expeditions[0]!.phase).toBe('travelling')
  })
})

describe('estimating the journey', () => {
  it('quotes a dwarf a longer leg than the map promises, both ways', () => {
    const dwarfRealm = createRealm({ raceId: 'dwarf' })

    expect(computeLegSeconds(dwarfRealm, testRegistry, 'hamlet')).toBeGreaterThan(
      HAMLET.travelSeconds,
    )
  })

  it('quotes a human the plain distance', () => {
    expect(computeLegSeconds(createRealm(), testRegistry, 'hamlet')).toBe(HAMLET.travelSeconds)
  })
})

describe('resolving a battle', () => {
  it('gives the walk home the same length as the march out', () => {
    const state = armedRealm(60, { raceId: 'dwarf' })
    launchExpedition(state, testRegistry, 'hamlet', 60)
    const marchOut = state.expeditions[0]!.totalPhaseSeconds

    const afterBattle = advanceGame(state, marchOut + 1, testRegistry)

    expect(marchOut).toBeGreaterThan(HAMLET.travelSeconds)
    expect(afterBattle.expeditions[0]!.totalPhaseSeconds).toBe(marchOut)
  })

  it('wins the battle when the force is overwhelming', () => {
    const state = armedRealm(60)
    launchExpedition(state, testRegistry, 'hamlet', 60)

    const afterBattle = advanceGame(state, HAMLET.travelSeconds + 1, testRegistry)

    expect(afterBattle.statistics.battlesWon).toBe(1)
    expect(afterBattle.expeditions[0]!.phase).toBe('returning')
  })

  it('leaves the acres untouched until the victorious army walks back in', () => {
    const state = armedRealm(60)
    const acresBefore = state.acres
    launchExpedition(state, testRegistry, 'hamlet', 60)

    const afterBattle = advanceGame(state, HAMLET.travelSeconds + 1, testRegistry)
    expect(afterBattle.acres).toBe(acresBefore)
    expect(afterBattle.expeditions[0]!.outcomeAcresGained).toBe(HAMLET.acresGained)

    const afterReturn = advanceGame(afterBattle, HAMLET.travelSeconds + 1, testRegistry)
    expect(afterReturn.acres).toBe(acresBefore + HAMLET.acresGained)
    expect(afterReturn.statistics.acresConquered).toBe(HAMLET.acresGained)
  })

  it('holds the plunder until the army is home', () => {
    const state = armedRealm(60, { resources: { food: 0 } })
    launchExpedition(state, testRegistry, 'hamlet', 60)

    const afterBattle = advanceGame(state, HAMLET.travelSeconds + 1, testRegistry)
    expect(afterBattle.resources.gold).toBe(0)

    const afterReturn = advanceGame(afterBattle, HAMLET.travelSeconds + 1, testRegistry)
    expect(afterReturn.resources.gold).toBeGreaterThan(0)
  })

  it('settles the plunder at the battle, so a boost that has since faded still pays out', () => {
    const soulHarvest = testRegistry.spellsById.get('dark.soulHarvest')!
    const withBoost = armedRealm(60, { resources: { food: 0 } })
    withBoost.magic.activeBuffs.push({
      spellId: soulHarvest.id,
      remainingSeconds: HAMLET.travelSeconds + 2,
      modifiers: soulHarvest.effect.kind === 'buff' ? soulHarvest.effect.modifiers : [],
    })
    launchExpedition(withBoost, testRegistry, 'hamlet', 60)

    const plain = armedRealm(60, { resources: { food: 0 } })
    launchExpedition(plain, testRegistry, 'hamlet', 60)

    const goldAfterTheWholeCampaign = (state: GameState): number => {
      const afterBattle = advanceGame(state, HAMLET.travelSeconds + 1, testRegistry)
      return advanceGame(afterBattle, HAMLET.travelSeconds + 1, testRegistry).resources.gold
    }

    expect(withBoost.magic.activeBuffs).toHaveLength(1)
    expect(goldAfterTheWholeCampaign(withBoost)).toBeGreaterThan(
      goldAfterTheWholeCampaign(plain),
    )
  })

  it('fails and takes no acres when the defences far outmatch the force sent', () => {
    const barelyEnoughToMarch = testRegistry.conquestTargetsById.get('capital')!.recommendedSoldiers
    const state = armedRealm(barelyEnoughToMarch)
    launchExpedition(state, testRegistry, 'capital', barelyEnoughToMarch)
    const acresBefore = state.acres

    const afterBattle = advanceGame(
      state,
      testRegistry.conquestTargetsById.get('capital')!.travelSeconds + 1,
      testRegistry,
    )

    expect(afterBattle.statistics.battlesLost).toBe(1)
    expect(afterBattle.acres).toBe(acresBefore)
  })

  it('brings the survivors home after the return journey', () => {
    const state = armedRealm(60)
    launchExpedition(state, testRegistry, 'hamlet', 60)

    const afterReturn = advanceGame(
      state,
      HAMLET.travelSeconds + HAMLET.travelSeconds + 2,
      testRegistry,
    )

    expect(afterReturn.expeditions).toHaveLength(0)
    expect(afterReturn.soldiersAtHome).toBeGreaterThan(0)
  })

  it('costs a defeated army more soldiers than a victorious one', () => {
    const winningRealm = armedRealm(60)
    launchExpedition(winningRealm, testRegistry, 'hamlet', 60)
    const losingRealm = armedRealm(30)
    losingRealm.rngCursor = winningRealm.rngCursor
    launchExpedition(losingRealm, testRegistry, 'village', 30)

    const wonBattle = advanceGame(winningRealm, HAMLET.travelSeconds + 1, testRegistry)
    const lostBattle = advanceGame(
      losingRealm,
      testRegistry.conquestTargetsById.get('village')!.travelSeconds + 1,
      testRegistry,
    )

    expect(lostBattle.statistics.soldiersLost).toBeGreaterThan(wonBattle.statistics.soldiersLost)
  })

  it('never kills an undead soldier, though the assault can still fail', () => {
    const doomedForce = testRegistry.conquestTargetsById.get('capital')!.recommendedSoldiers
    const state = armedRealm(doomedForce, { raceId: 'undead', circleIds: ['dark'] })
    launchExpedition(state, testRegistry, 'capital', doomedForce)

    const afterBattle = advanceGame(
      state,
      testRegistry.conquestTargetsById.get('capital')!.travelSeconds + 1,
      testRegistry,
    )

    expect(afterBattle.statistics.battlesLost).toBe(1)
    expect(afterBattle.statistics.soldiersLost).toBe(0)
    expect(afterBattle.expeditions[0]!.soldiers).toBe(doomedForce)
  })

  it('spends a pending boost on the expedition that launches next', () => {
    const state = armedRealm(60, { circleIds: ['dark'] })
    state.magic.pendingBoosts.push({
      spellId: 'dark.blight',
      consumeOn: 'expedition',
      modifiers: [{ target: 'warfare.targetDefense', operation: 'multiply', value: 0.8 }],
    })

    launchExpedition(state, testRegistry, 'hamlet', 60)

    expect(state.magic.pendingBoosts).toHaveLength(0)
    expect(state.expeditions[0]!.appliedBoostSpellIds).toEqual(['dark.blight'])
  })

  it('records the last battle losses so resurrection spells have something to work with', () => {
    const state = armedRealm(30)
    launchExpedition(state, testRegistry, 'village', 30)

    const afterBattle = advanceGame(
      state,
      testRegistry.conquestTargetsById.get('village')!.travelSeconds + 1,
      testRegistry,
    )

    expect(afterBattle.lastBattleSoldiersLost).toBe(afterBattle.statistics.soldiersLost)
  })
})

describe('what protects an army', () => {
  /** Casualties are one axis now; a second "defence" knob only obscured it. */
  it('reduces casualties through one modifier and no other', () => {
    const doomed = armedRealm(30)
    launchExpedition(doomed, testRegistry, 'village', 30)

    const shielded = armedRealm(30)
    shielded.rngCursor = doomed.rngCursor
    shielded.magic.activeBuffs.push({
      spellId: 'earth.bulwark',
      remainingSeconds: 600,
      modifiers: [{ target: 'warfare.casualtyRate', operation: 'multiply', value: 0.05 }],
    })
    launchExpedition(shielded, testRegistry, 'village', 30)

    const travel = testRegistry.conquestTargetsById.get('village')!.travelSeconds + 1
    const withoutBulwark = advanceGame(doomed, travel, testRegistry).statistics.soldiersLost
    const withBulwark = advanceGame(shielded, travel, testRegistry).statistics.soldiersLost

    expect(withoutBulwark).toBeGreaterThan(0)
    expect(withBulwark).toBeLessThan(withoutBulwark)
  })

  it('does not change whether the battle is won, only what it costs', () => {
    const target = testRegistry.conquestTargetsById.get('capital')!
    const force = target.recommendedSoldiers
    const shielded = armedRealm(force)
    shielded.magic.activeBuffs.push({
      spellId: 'earth.bulwark',
      remainingSeconds: 600,
      modifiers: [{ target: 'warfare.casualtyRate', operation: 'multiply', value: 0.05 }],
    })
    launchExpedition(shielded, testRegistry, 'capital', force)

    const resolved = advanceGame(shielded, target.travelSeconds + 1, testRegistry)

    expect(resolved.statistics.battlesLost).toBe(1)
  })
})
