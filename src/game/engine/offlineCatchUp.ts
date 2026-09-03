import { BALANCE, FIXED_TICK_SECONDS } from '../content/balance'
import type { ContentRegistry } from '../model/content'
import type { ResourceId } from '../model/ids'
import { RESOURCE_IDS } from '../model/ids'
import type { GameState } from '../model/state'
import { cloneGameState } from './initialState'
import { advanceGameInPlace } from './tick'

export interface OfflineProgressSummary {
  readonly awaySeconds: number
  readonly creditedSeconds: number
  readonly wasCapped: boolean
  readonly resourceGains: Record<ResourceId, number>
  readonly populationChange: number
  readonly acresGained: number
  readonly battlesResolved: number
  readonly heistsResolved: number
  readonly buildingsCompleted: number
}

/** Coarse buckets after the first few minutes, so half a day resolves inside a frame. */
export function applyOfflineProgress(
  state: GameState,
  registry: ContentRegistry,
  awaySeconds: number,
): { state: GameState; summary: OfflineProgressSummary } {
  const creditedSeconds = Math.max(
    0,
    Math.min(awaySeconds, BALANCE.offline.maximumCreditedSeconds),
  )
  const draft = cloneGameState(state)

  const resourcesBefore = { ...draft.resources }
  const populationBefore = draft.population
  const acresBefore = draft.acres
  const battlesBefore = draft.statistics.battlesWon + draft.statistics.battlesLost
  const heistsBefore = draft.statistics.heistsSucceeded + draft.statistics.heistsFailed
  const buildingsBefore = draft.statistics.buildingsConstructed

  let remainingSeconds = creditedSeconds
  const tickAccurateSteps = Math.floor(
    Math.min(remainingSeconds, BALANCE.offline.tickAccurateSeconds) / FIXED_TICK_SECONDS,
  )
  for (let step = 0; step < tickAccurateSteps; step += 1) {
    advanceGameInPlace(draft, FIXED_TICK_SECONDS, registry)
  }
  remainingSeconds -= tickAccurateSteps * FIXED_TICK_SECONDS

  const fineGrainedSecondsLeft =
    BALANCE.offline.fineGrainedSeconds - BALANCE.offline.tickAccurateSeconds
  const fineGrainedBudget = Math.floor(Math.min(remainingSeconds, fineGrainedSecondsLeft))
  for (let elapsed = 0; elapsed < fineGrainedBudget; elapsed += 1) {
    advanceGameInPlace(draft, 1, registry)
  }
  remainingSeconds -= fineGrainedBudget

  while (remainingSeconds > 0) {
    const step = Math.min(remainingSeconds, BALANCE.offline.coarseBucketSeconds)
    advanceGameInPlace(draft, step, registry)
    remainingSeconds -= step
  }

  const resourceGains = Object.fromEntries(
    RESOURCE_IDS.map((resourceId) => [
      resourceId,
      draft.resources[resourceId] - resourcesBefore[resourceId],
    ]),
  ) as Record<ResourceId, number>

  return {
    state: draft,
    summary: {
      awaySeconds,
      creditedSeconds,
      wasCapped: awaySeconds > BALANCE.offline.maximumCreditedSeconds,
      resourceGains,
      populationChange: draft.population - populationBefore,
      acresGained: draft.acres - acresBefore,
      battlesResolved: draft.statistics.battlesWon + draft.statistics.battlesLost - battlesBefore,
      heistsResolved:
        draft.statistics.heistsSucceeded + draft.statistics.heistsFailed - heistsBefore,
      buildingsCompleted: draft.statistics.buildingsConstructed - buildingsBefore,
    },
  }
}
