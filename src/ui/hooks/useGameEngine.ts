import { useEffect } from 'react'
import { startGameLoop } from '../../game/engine/gameLoop'
import { startAutosave } from '../../game/persistence/autosave'
import { useGameStore } from '../../game/store/gameStore'

export function useGameEngine(): void {
  useEffect(() => {
    useGameStore.getState().loadFromStorage()

    const loop = startGameLoop({
      onFixedStep: (deltaSeconds) => useGameStore.getState().advance(deltaSeconds),
      onTimeSkip: (skippedSeconds) => useGameStore.getState().creditTimeAway(skippedSeconds),
    })
    const autosave = startAutosave(() => useGameStore.getState().state)

    return () => {
      autosave.saveNow()
      autosave.stop()
      loop.stop()
    }
  }, [])
}
