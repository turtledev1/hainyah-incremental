import type { ContentRegistry } from '../model/content'
import type { GameState } from '../model/state'
import type { TickContext } from '../model/tick'
import { buildModifierIndexForState } from '../systems/modifiers'
import { SYSTEM_TICK_ORDER } from '../systems'
import { cloneGameState } from './initialState'
import { createRandomNumberGenerator } from './rng'

/** The browser loop and the offline catch-up share this, so both produce the same numbers. */
export function advanceGame(
  state: GameState,
  deltaSeconds: number,
  registry: ContentRegistry,
): GameState {
  if (deltaSeconds <= 0) {
    return state
  }

  const draft = cloneGameState(state)
  draft.elapsedSeconds += deltaSeconds

  const context: TickContext = {
    state: draft,
    registry,
    modifiers: buildModifierIndexForState(draft, registry),
    deltaSeconds,
    random: createRandomNumberGenerator(draft),
  }

  for (const runSystem of SYSTEM_TICK_ORDER) {
    runSystem(context)
  }

  return draft
}

/** For callers that already own a private draft and run tens of thousands of steps. */
export function advanceGameInPlace(
  draft: GameState,
  deltaSeconds: number,
  registry: ContentRegistry,
): void {
  if (deltaSeconds <= 0) {
    return
  }
  draft.elapsedSeconds += deltaSeconds

  const context: TickContext = {
    state: draft,
    registry,
    modifiers: buildModifierIndexForState(draft, registry),
    deltaSeconds,
    random: createRandomNumberGenerator(draft),
  }

  for (const runSystem of SYSTEM_TICK_ORDER) {
    runSystem(context)
  }
}
