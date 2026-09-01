import { FIXED_TICK_SECONDS } from '../content/balance'

/** Beyond this a tab was asleep, not slow, and the gap goes to the catch-up simulation. */
const TIME_SKIP_THRESHOLD_SECONDS = 2

export interface GameLoopHandle {
  stop: () => void
}

export interface GameLoopCallbacks {
  readonly onFixedStep: (deltaSeconds: number) => void
  readonly onTimeSkip: (skippedSeconds: number) => void
}

/** Fixed timestep, so an outcome never depends on frame rate. */
export function startGameLoop({ onFixedStep, onTimeSkip }: GameLoopCallbacks): GameLoopHandle {
  let animationFrameId = 0
  let lastFrameAtMs = performance.now()
  let accumulatedSeconds = 0
  let isRunning = true

  const runFrame = (nowMs: number): void => {
    if (!isRunning) {
      return
    }
    const frameSeconds = (nowMs - lastFrameAtMs) / 1000
    lastFrameAtMs = nowMs

    if (frameSeconds > TIME_SKIP_THRESHOLD_SECONDS) {
      onTimeSkip(frameSeconds)
    } else {
      accumulatedSeconds += frameSeconds
      while (accumulatedSeconds >= FIXED_TICK_SECONDS) {
        onFixedStep(FIXED_TICK_SECONDS)
        accumulatedSeconds -= FIXED_TICK_SECONDS
      }
    }

    animationFrameId = requestAnimationFrame(runFrame)
  }

  animationFrameId = requestAnimationFrame(runFrame)

  return {
    stop: () => {
      isRunning = false
      cancelAnimationFrame(animationFrameId)
    },
  }
}
