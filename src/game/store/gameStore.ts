import { create } from 'zustand'
import { CONTENT_REGISTRY } from '../content'
import { createInitialGameState } from '../engine/initialState'
import { applyOfflineProgress, type OfflineProgressSummary } from '../engine/offlineCatchUp'
import { createRandomNumberGenerator } from '../engine/rng'
import { advanceGame } from '../engine/tick'
import { cloneGameState } from '../engine/initialState'
import type { ContentRegistry } from '../model/content'
import type {
  BuildingId,
  ConquestTargetId,
  MagicCircleId,
  RaceId,
  ResourceId,
  SpellId,
  ThieveryTargetId,
  UpgradeId,
} from '../model/ids'
import type { GameState } from '../model/state'
import { buildAscensionStage, describeAscensionRefusal } from '../systems/ascension'
import {
  checkConstructionRefusal,
  demolishBuilding,
  describeConstructionRefusal,
  describeDemolitionRefusal,
  queueBuildings,
} from '../systems/construction'
import { gatherByHand } from '../systems/manualGathering'
import { castSpell, describeCastRefusal } from '../systems/magic'
import { buildModifierIndexForState } from '../systems/modifiers'
import { describeHeistRefusal, launchHeist } from '../systems/thievery'
import { describeUpgradeRefusal, purchaseUpgrade } from '../systems/upgrades'
import { describeExpeditionRefusal, launchExpedition } from '../systems/warfare'
import {
  assignWorkers,
  clearWorkers,
  dismissSoldiers,
  dismissThieves,
  fillWorkerSlots,
  recruitSoldiers,
  recruitThieves,
  unassignWorkers,
} from '../systems/workforce'
import { clearSave, exportSaveToText, importSaveFromText, readSave, writeSave } from '../persistence/storage'

export type GamePhase = 'raceSelection' | 'playing'

interface GameStoreState {
  readonly registry: ContentRegistry
  state?: GameState
  phase: GamePhase
  offlineSummary?: OfflineProgressSummary
  victoryAcknowledged: boolean
  notice?: string
}

interface GameStoreActions {
  startNewRun: (raceId: RaceId, chosenMagicCircleIds: readonly MagicCircleId[]) => void
  loadFromStorage: () => void
  abandonRun: () => void
  advance: (deltaSeconds: number) => void
  creditTimeAway: (secondsAway: number) => void
  dismissOfflineSummary: () => void
  acknowledgeVictory: () => void
  clearNotice: () => void
  gather: (resourceId: ResourceId) => void
  build: (buildingId: BuildingId, count?: number) => void
  demolish: (buildingId: BuildingId) => void
  assign: (buildingId: BuildingId, count: number) => void
  fillWorkers: (buildingId: BuildingId) => void
  clearWorkers: (buildingId: BuildingId) => void
  unassign: (buildingId: BuildingId, count: number) => void
  recruitSoldiers: (count: number) => void
  dismissSoldiers: (count: number) => void
  recruitThieves: (count: number) => void
  dismissThieves: (count: number) => void
  cast: (spellId: SpellId) => void
  attack: (targetId: ConquestTargetId, soldiers: number) => void
  steal: (targetId: ThieveryTargetId) => void
  buyUpgrade: (upgradeId: UpgradeId) => void
  advanceAscension: () => void
  exportSave: () => string | undefined
  importSave: (encoded: string) => boolean
}

export type GameStore = GameStoreState & GameStoreActions

export const useGameStore = create<GameStore>((set, get) => {
  /** A refusal from the system becomes a notice rather than a silent no-op. */
  const runAction = (
    mutate: (state: GameState, registry: ContentRegistry) => string | undefined,
  ): void => {
    const { state, registry } = get()
    if (!state) {
      return
    }
    const draft = cloneGameState(state)
    const notice = mutate(draft, registry)
    set({ state: draft, notice })
  }

  return {
    registry: CONTENT_REGISTRY,
    state: undefined,
    phase: 'raceSelection',
    victoryAcknowledged: false,

    startNewRun: (raceId, chosenMagicCircleIds) => {
      clearSave()
      const state = createInitialGameState({ raceId, chosenMagicCircleIds })
      writeSave(state)
      set({ state, phase: 'playing', offlineSummary: undefined, victoryAcknowledged: false, notice: undefined })
    },

    loadFromStorage: () => {
      const { registry } = get()
      const loaded = readSave(registry)
      if (!loaded) {
        set({ phase: 'raceSelection', state: undefined })
        return
      }
      const secondsAway = Math.max(0, (Date.now() - loaded.savedAtEpochMs) / 1000)
      if (secondsAway < 1) {
        set({ state: loaded.state, phase: 'playing' })
        return
      }
      const { state, summary } = applyOfflineProgress(loaded.state, registry, secondsAway)
      set({
        state,
        phase: 'playing',
        offlineSummary: summary.creditedSeconds >= 60 ? summary : undefined,
      })
    },

    abandonRun: () => {
      clearSave()
      set({ state: undefined, phase: 'raceSelection', offlineSummary: undefined, notice: undefined })
    },

    advance: (deltaSeconds) => {
      const { state, registry } = get()
      if (!state) {
        return
      }
      set({ state: advanceGame(state, deltaSeconds, registry) })
    },

    creditTimeAway: (secondsAway) => {
      const { state, registry } = get()
      if (!state) {
        return
      }
      const { state: caughtUp, summary } = applyOfflineProgress(state, registry, secondsAway)
      set({
        state: caughtUp,
        offlineSummary: summary.creditedSeconds >= 60 ? summary : get().offlineSummary,
      })
    },

    dismissOfflineSummary: () => set({ offlineSummary: undefined }),
    acknowledgeVictory: () => set({ victoryAcknowledged: true }),
    clearNotice: () => set({ notice: undefined }),

    gather: (resourceId) =>
      runAction((state, registry) => {
        gatherByHand(state, registry, buildModifierIndexForState(state, registry), resourceId)
        return undefined
      }),

    build: (buildingId, count = 1) =>
      runAction((state, registry) => {
        const modifiers = buildModifierIndexForState(state, registry)
        const refusalBefore = checkConstructionRefusal(state, registry, modifiers, buildingId)
        if (refusalBefore) {
          return describeConstructionRefusal(refusalBefore)
        }
        queueBuildings(state, registry, modifiers, buildingId, count)
        return undefined
      }),

    demolish: (buildingId) =>
      runAction((state, registry) => {
        const modifiers = buildModifierIndexForState(state, registry)
        const refusal = demolishBuilding(state, registry, modifiers, buildingId)
        return refusal ? describeDemolitionRefusal(refusal) : undefined
      }),

    fillWorkers: (buildingId) =>
      runAction((state, registry) => {
        fillWorkerSlots(state, registry, buildingId)
        return undefined
      }),

    clearWorkers: (buildingId) =>
      runAction((state) => {
        clearWorkers(state, buildingId)
        return undefined
      }),

    assign: (buildingId, count) =>
      runAction((state, registry) => {
        assignWorkers(state, registry, buildingId, count)
        return undefined
      }),

    unassign: (buildingId, count) =>
      runAction((state) => {
        unassignWorkers(state, buildingId, count)
        return undefined
      }),

    recruitSoldiers: (count) =>
      runAction((state, registry) => {
        recruitSoldiers(state, registry, buildModifierIndexForState(state, registry), count)
        return undefined
      }),

    dismissSoldiers: (count) =>
      runAction((state) => {
        dismissSoldiers(state, count)
        return undefined
      }),

    recruitThieves: (count) =>
      runAction((state, registry) => {
        recruitThieves(state, registry, buildModifierIndexForState(state, registry), count)
        return undefined
      }),

    dismissThieves: (count) =>
      runAction((state) => {
        dismissThieves(state, count)
        return undefined
      }),

    cast: (spellId) =>
      runAction((state, registry) => {
        const refusal = castSpell(state, registry, spellId, createRandomNumberGenerator(state))
        return refusal ? describeCastRefusal(refusal) : undefined
      }),

    attack: (targetId, soldiers) =>
      runAction((state, registry) => {
        const refusal = launchExpedition(state, registry, targetId, soldiers)
        return refusal ? describeExpeditionRefusal(refusal) : undefined
      }),

    steal: (targetId) =>
      runAction((state, registry) => {
        const refusal = launchHeist(state, registry, targetId)
        return refusal ? describeHeistRefusal(refusal) : undefined
      }),

    buyUpgrade: (upgradeId) =>
      runAction((state, registry) => {
        const refusal = purchaseUpgrade(state, registry, upgradeId)
        return refusal ? describeUpgradeRefusal(refusal) : undefined
      }),

    advanceAscension: () =>
      runAction((state, registry) => {
        const refusal = buildAscensionStage(state, registry)
        return refusal ? describeAscensionRefusal(refusal) : undefined
      }),

    exportSave: () => {
      const { state } = get()
      return state ? exportSaveToText(state) : undefined
    },

    importSave: (encoded) => {
      const { registry } = get()
      const loaded = importSaveFromText(encoded, registry)
      if (!loaded) {
        set({ notice: 'That save could not be read.' })
        return false
      }
      writeSave(loaded.state)
      set({ state: loaded.state, phase: 'playing', notice: 'Save loaded.' })
      return true
    },
  }
})
