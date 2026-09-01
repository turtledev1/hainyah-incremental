import type { ContentRegistry } from '../model/content'
import type { GameState } from '../model/state'
import { migrateSave } from './migrations'
import type { PersistedSave } from './saveSchema'
import { fromPersistedSave, toPersistedSave } from './saveSchema'

export const SAVE_STORAGE_KEY = 'hainyah:save:v1'

export interface LoadedSave {
  readonly state: GameState
  readonly savedAtEpochMs: number
}

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function writeSave(state: GameState, savedAtEpochMs: number = Date.now()): void {
  const target = storage()
  if (!target) {
    return
  }
  try {
    target.setItem(SAVE_STORAGE_KEY, JSON.stringify(toPersistedSave(state, savedAtEpochMs)))
  } catch (error) {
    console.warn('Hainyah could not write its save.', error)
  }
}

export function readSave(registry: ContentRegistry): LoadedSave | undefined {
  const target = storage()
  const serialized = target?.getItem(SAVE_STORAGE_KEY)
  if (!serialized) {
    return undefined
  }

  try {
    const migrated = migrateSave(JSON.parse(serialized) as Record<string, unknown>)
    return {
      state: fromPersistedSave(migrated, registry),
      savedAtEpochMs: migrated.savedAtEpochMs,
    }
  } catch (error) {
    console.warn('Hainyah could not read its save and will start fresh.', error)
    return undefined
  }
}

export function clearSave(): void {
  storage()?.removeItem(SAVE_STORAGE_KEY)
}

function encodeUtf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function decodeBase64ToUtf8(encoded: string): string {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function exportSaveToText(state: GameState): string {
  return encodeUtf8ToBase64(JSON.stringify(toPersistedSave(state, Date.now())))
}

export function importSaveFromText(
  encoded: string,
  registry: ContentRegistry,
): LoadedSave | undefined {
  try {
    const decoded = decodeBase64ToUtf8(encoded.trim())
    const migrated = migrateSave(JSON.parse(decoded) as Record<string, unknown>)
    return {
      state: fromPersistedSave(migrated, registry),
      savedAtEpochMs: (migrated as PersistedSave).savedAtEpochMs,
    }
  } catch (error) {
    console.warn('That does not look like a Hainyah save.', error)
    return undefined
  }
}
