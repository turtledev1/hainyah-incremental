import type { PersistedSave } from './saveSchema'
import { CURRENT_SAVE_FORMAT_VERSION } from './saveSchema'

/** One entry per format bump. `fromVersion` is the version the step upgrades away from. */
interface SaveMigration {
  readonly fromVersion: number
  readonly describe: string
  readonly apply: (save: Record<string, unknown>) => Record<string, unknown>
}

export const SAVE_MIGRATIONS: readonly SaveMigration[] = []

export function migrateSave(rawSave: Record<string, unknown>): PersistedSave {
  let working = rawSave
  let version = typeof working.formatVersion === 'number' ? working.formatVersion : 0

  while (version < CURRENT_SAVE_FORMAT_VERSION) {
    const migration = SAVE_MIGRATIONS.find((candidate) => candidate.fromVersion === version)
    if (!migration) {
      throw new Error(`No migration from save format ${version}; the save cannot be loaded.`)
    }
    working = migration.apply(working)
    version += 1
    working.formatVersion = version
  }

  return working as unknown as PersistedSave
}
