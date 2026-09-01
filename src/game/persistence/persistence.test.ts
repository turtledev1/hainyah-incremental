import { describe, expect, it } from 'vitest'
import { createRealm, testRegistry } from '../../test/realmFixtures'
import { migrateSave } from './migrations'
import { CURRENT_SAVE_FORMAT_VERSION, fromPersistedSave, toPersistedSave } from './saveSchema'
import { exportSaveToText, importSaveFromText } from './storage'

function playedRealm() {
  const state = createRealm({
    raceId: 'elf',
    circleIds: ['water', 'dark'],
    acres: 42,
    population: 31,
    resources: { wood: 1_234, stone: 567, gold: 89, food: 4_321 },
    buildings: { house: 6, farm: 3, temple: 2 },
    workers: { farm: 9, temple: 4 },
    soldiersAtHome: 12,
    thievesAtHome: 3,
  })
  state.elapsedSeconds = 9_876
  state.magic.experience.water = 1_500
  state.magic.mana = 33
  state.magic.activeBuffs.push({
    spellId: 'water.irrigation',
    label: 'Irrigation',
    remainingSeconds: 45,
    modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 1.4 }],
  })
  state.magic.pendingBoosts.push({
    spellId: 'dark.blight',
    label: 'Blight',
    consumeOn: 'expedition',
    modifiers: [{ target: 'warfare.targetDefense', operation: 'multiply', value: 0.8 }],
  })
  state.magic.spellCooldowns['water.irrigation'] = 60
  state.purchasedUpgrades['farming.ironPlows'] = 1
  state.purchasedUpgrades['fortification.reinforceWalls'] = 4
  state.defeatedConquestTargets.hamlet = 3
  state.highestConquestTierDefeated = 2
  state.completedAscensionStages = 1
  state.constructionQueue.push({ buildingId: 'mine', secondsRemaining: 5, totalSeconds: 16 })
  state.eventLog.push({
    id: 1,
    atElapsedSeconds: 10,
    kind: 'warfare',
    messageKey: 'chronicle.victoryWithoutLosses',
    values: { targetName: 'Outlying Hamlet', acres: 3 },
  })
  return state
}

describe('saving and loading a run', () => {
  it('round-trips everything the player would notice', () => {
    const original = playedRealm()

    const restored = fromPersistedSave(toPersistedSave(original, 1_000), testRegistry)

    expect(restored.raceId).toBe('elf')
    expect(restored.chosenMagicCircleIds).toEqual(['water', 'dark'])
    expect(restored.acres).toBe(42)
    expect(restored.population).toBe(31)
    expect(restored.resources).toEqual(original.resources)
    expect(restored.buildings).toEqual(original.buildings)
    expect(restored.workerAssignments).toEqual(original.workerAssignments)
    expect(restored.soldiersAtHome).toBe(12)
    expect(restored.thievesAtHome).toBe(3)
    expect(restored.purchasedUpgrades['fortification.reinforceWalls']).toBe(4)
    expect(restored.defeatedConquestTargets.hamlet).toBe(3)
    expect(restored.completedAscensionStages).toBe(1)
    expect(restored.constructionQueue).toHaveLength(1)
    expect(restored.eventLog).toHaveLength(1)
    expect(restored.elapsedSeconds).toBe(9_876)
  })

  it('keeps the generator cursor so the run continues on the same rolls', () => {
    const original = playedRealm()
    original.rngCursor = 4_242

    const restored = fromPersistedSave(toPersistedSave(original, 1_000), testRegistry)

    expect(restored.rngCursor).toBe(4_242)
  })

  it('stores buffs by spell id and rebuilds their effects from current content', () => {
    const original = playedRealm()

    const persisted = toPersistedSave(original, 1_000)
    const restored = fromPersistedSave(persisted, testRegistry)

    expect(persisted.activeBuffs).toEqual([{ spellId: 'water.irrigation', remainingSeconds: 45 }])
    expect(restored.magic.activeBuffs[0]!.modifiers).toEqual(
      testRegistry.spellsById.get('water.irrigation')!.effect.kind === 'buff'
        ? (testRegistry.spellsById.get('water.irrigation')!.effect as { modifiers: unknown }).modifiers
        : [],
    )
  })

  it('drops a buff whose spell no longer exists instead of failing to load', () => {
    const persisted = toPersistedSave(playedRealm(), 1_000)
    const tampered = {
      ...persisted,
      activeBuffs: [{ spellId: 'fire.spellRemovedInAPatch', remainingSeconds: 10 }],
    }

    const restored = fromPersistedSave(tampered, testRegistry)

    expect(restored.magic.activeBuffs).toHaveLength(0)
  })

  it('drops an expedition whose target no longer exists', () => {
    const persisted = toPersistedSave(playedRealm(), 1_000)
    const tampered = {
      ...persisted,
      expeditions: [
        {
          id: 9,
          targetId: 'placeThatWasCutFromTheGame',
          soldiers: 10,
          phase: 'travelling' as const,
          secondsRemaining: 5,
          totalPhaseSeconds: 60,
          appliedBoostSpellIds: [],
          outcomeAcresGained: 0,
          outcomePlunder: {},
          outcomeSoldiersLost: 0,
          outcomeSucceeded: false,
        },
      ],
    }

    expect(fromPersistedSave(tampered, testRegistry).expeditions).toHaveLength(0)
  })

  it('drops a purchased upgrade that has been removed from the game', () => {
    const persisted = toPersistedSave(playedRealm(), 1_000)
    const tampered = {
      ...persisted,
      purchasedUpgrades: { ...persisted.purchasedUpgrades, 'mining.somethingRemoved': 2 },
    }

    expect(fromPersistedSave(tampered, testRegistry).purchasedUpgrades['mining.somethingRemoved']).toBeUndefined()
  })

  it('falls back to a known race if the saved one has disappeared', () => {
    const persisted = { ...toPersistedSave(playedRealm(), 1_000), raceId: 'gargoyle' as never }

    expect(testRegistry.racesById.has(fromPersistedSave(persisted, testRegistry).raceId)).toBe(true)
  })
})

describe('exported save text', () => {
  it('can be imported back into an identical run', () => {
    const original = playedRealm()

    const imported = importSaveFromText(exportSaveToText(original), testRegistry)

    expect(imported?.state.acres).toBe(original.acres)
    expect(imported?.state.resources).toEqual(original.resources)
  })

  it('returns nothing for text that is not a save', () => {
    expect(importSaveFromText('not a save at all', testRegistry)).toBeUndefined()
  })
})

describe('save migrations', () => {
  it('passes a current save through untouched', () => {
    const persisted = toPersistedSave(playedRealm(), 1_000)

    const migrated = migrateSave(persisted as unknown as Record<string, unknown>)

    expect(migrated.formatVersion).toBe(CURRENT_SAVE_FORMAT_VERSION)
    expect(migrated.acres).toBe(persisted.acres)
  })

  it('refuses a save from a format it has no path from, rather than loading nonsense', () => {
    expect(() => migrateSave({ acres: 10 })).toThrow(/No migration from save format/)
  })
})
