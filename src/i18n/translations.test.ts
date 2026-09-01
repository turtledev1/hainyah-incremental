import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { i18n } from './index'

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return sourceFilesUnder(path)
    }
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : []
  })
}

/** Every `chronicle.*` string the game records, gathered from the source itself. */
function chronicleKeysUsedByTheGame(): string[] {
  const keys = new Set<string>()
  for (const file of sourceFilesUnder('src/game')) {
    for (const match of readFileSync(file, 'utf8').matchAll(/'(chronicle\.[A-Za-z]+)'/g)) {
      keys.add(match[1]!)
    }
  }
  return [...keys].sort()
}

describe('translations', () => {
  it('has a message for every chronicle key the game records', () => {
    const missing = chronicleKeysUsedByTheGame().filter((key) => {
      const singular = i18n.t(key, { count: 1 })
      const plural = i18n.t(key, { count: 2 })
      return singular === key || plural === key
    })

    expect(missing).toEqual([])
  })

  it('finds at least the messages we know the systems emit', () => {
    const used = chronicleKeysUsedByTheGame()

    expect(used).toContain('chronicle.famine')
    expect(used).toContain('chronicle.victoryWithLosses')
    expect(used).toContain('chronicle.buildingFinished')
    expect(used.length).toBeGreaterThan(25)
  })

  it('chooses the singular form for one and the plural form for many', () => {
    expect(i18n.t('chronicle.famine', { count: 1 })).toBe('Famine takes 1 citizen.')
    expect(i18n.t('chronicle.famine', { count: 4 })).toBe('Famine takes 4 citizens.')
  })

  it('conjugates the verb as well as the noun', () => {
    expect(i18n.t('chronicle.soldiersDeserted', { count: 1 })).toContain('soldier drifts away')
    expect(i18n.t('chronicle.soldiersDeserted', { count: 9 })).toContain('soldiers drift away')
    expect(i18n.t('chronicle.thievesDeserted', { count: 1 })).toContain('thief leaves')
    expect(i18n.t('chronicle.thievesDeserted', { count: 3 })).toContain('thieves leave')
  })

  it('interpolates content names that stay in the content files', () => {
    expect(i18n.t('chronicle.buildingFinished', { buildingName: 'Lumber Camp' })).toBe(
      'Lumber Camp finished.',
    )
  })

  it('formats a duration through the shared formatter rather than in a system', () => {
    expect(
      i18n.t('chronicle.marchBegan', { count: 12, targetName: 'Walled Town', arrivalSeconds: 90 }),
    ).toBe('12 soldiers march on Walled Town, arriving in 1m 30s.')
  })

  it('formats large numbers compactly inside a message', () => {
    expect(i18n.t('chronicle.tideYields', { amount: 12_500 })).toBe(
      'Tide of Plenty yields 12.5k food.',
    )
  })
})
