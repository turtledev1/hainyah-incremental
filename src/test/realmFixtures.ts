import { CONTENT_REGISTRY } from '../game/content'
import { createInitialGameState } from '../game/engine/initialState'
import type { BuildingId, MagicCircleId, RaceId } from '../game/model/ids'
import type { GameState } from '../game/model/state'

const FIXED_SEED_FOR_REPRODUCIBLE_TESTS = 12_345

export const testRegistry = CONTENT_REGISTRY

interface RealmFixtureOptions {
  readonly raceId?: RaceId
  readonly circleIds?: readonly MagicCircleId[]
  readonly acres?: number
  readonly population?: number
  readonly resources?: Partial<GameState['resources']>
  readonly buildings?: Partial<Record<BuildingId, number>>
  readonly workers?: Partial<Record<BuildingId, number>>
  readonly soldiersAtHome?: number
  readonly thievesAtHome?: number
}

/** Fixed seed, so every random outcome an assertion depends on is reproducible. */
export function createRealm(options: RealmFixtureOptions = {}): GameState {
  const state = createInitialGameState({
    raceId: options.raceId ?? 'human',
    chosenMagicCircleIds: options.circleIds ?? ['fire'],
    startedAtEpochMs: 0,
    rngSeed: FIXED_SEED_FOR_REPRODUCIBLE_TESTS,
  })

  if (options.acres !== undefined) {
    state.acres = options.acres
  }
  if (options.population !== undefined) {
    state.population = options.population
  }
  Object.assign(state.resources, options.resources ?? {})
  Object.assign(state.buildings, options.buildings ?? {})
  Object.assign(state.workerAssignments, options.workers ?? {})
  state.soldiersAtHome = options.soldiersAtHome ?? 0
  state.thievesAtHome = options.thievesAtHome ?? 0

  return state
}
