import { useMemo } from 'react'
import type { GameState } from '../../game/model/state'
import { deriveRealmView, type RealmView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'

/** Rebuilt once per tick; cheap because every collection in the game is small. */
export function useRealmView(state: GameState): RealmView {
  const registry = useGameStore((store) => store.registry)
  return useMemo(() => deriveRealmView(state, registry), [state, registry])
}
