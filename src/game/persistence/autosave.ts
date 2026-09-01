import { BALANCE } from '../content/balance'
import type { GameState } from '../model/state'
import { writeSave } from './storage'

export interface AutosaveHandle {
  stop: () => void
  saveNow: () => void
}

export function startAutosave(readState: () => GameState | undefined): AutosaveHandle {
  const saveNow = (): void => {
    const state = readState()
    if (state) {
      writeSave(state)
    }
  }

  const intervalId = window.setInterval(saveNow, BALANCE.autosaveIntervalSeconds * 1000)
  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      saveNow()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', saveNow)

  return {
    saveNow,
    stop: () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', saveNow)
    },
  }
}
