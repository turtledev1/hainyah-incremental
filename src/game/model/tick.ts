import type { ContentRegistry } from './content'
import type { ModifierIndex } from './modifiers'
import type { GameState } from './state'

/** The state is a draft `advanceGame` already cloned, so systems may write to it freely. */
export interface TickContext {
  readonly state: GameState
  readonly registry: ContentRegistry
  readonly modifiers: ModifierIndex
  readonly deltaSeconds: number
  readonly random: () => number
}

export type GameSystem = (context: TickContext) => void
