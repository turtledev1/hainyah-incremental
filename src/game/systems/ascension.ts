import { contentKeys } from '../../i18n/contentKeys'
import type { AscensionStageDefinition, ContentRegistry } from '../model/content'
import type { GameState } from '../model/state'
import { canAfford, emitEvent, payCosts } from './stateHelpers'

export function nextAscensionStage(
  state: GameState,
  registry: ContentRegistry,
): AscensionStageDefinition | undefined {
  return registry.ascensionStages[state.completedAscensionStages]
}

export const ASCENSION_REFUSALS = [
  'alreadyAscended',
  'cannotAffordCost',
] as const

export type AscensionRefusal = (typeof ASCENSION_REFUSALS)[number]

export function checkAscensionRefusal(
  state: GameState,
  registry: ContentRegistry,
): AscensionRefusal | undefined {
  const stage = nextAscensionStage(state, registry)
  if (!stage) {
    return 'alreadyAscended'
  }
  if (!canAfford(state, stage.costs)) {
    return 'cannotAffordCost'
  }
  return undefined
}

export function buildAscensionStage(
  state: GameState,
  registry: ContentRegistry,
): AscensionRefusal | undefined {
  const refusal = checkAscensionRefusal(state, registry)
  if (refusal) {
    return refusal
  }
  const stage = nextAscensionStage(state, registry)!

  payCosts(state, stage.costs)
  state.completedAscensionStages += 1
  emitEvent(state, 'ascension', 'chronicle.stageComplete', {
    stageKey: contentKeys.ascensionStageName(stage.index),
  })

  if (state.completedAscensionStages >= registry.ascensionStages.length) {
    state.hasAscended = true
    emitEvent(state, 'ascension', 'chronicle.wonderComplete')
  }
  return undefined
}
