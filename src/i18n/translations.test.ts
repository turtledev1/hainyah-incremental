import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ASCENSION_REFUSALS } from '../game/systems/ascension'
import { CONSTRUCTION_REFUSALS, DEMOLITION_REFUSALS } from '../game/systems/construction'
import { CAST_REFUSALS } from '../game/systems/magic'
import { HEIST_REFUSALS } from '../game/systems/thievery'
import { UPGRADE_REFUSALS } from '../game/systems/upgrades'
import { EXPEDITION_REFUSALS } from '../game/systems/warfare'
import { i18n } from './index'

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return sourceFilesUnder(path)
    }
    const isSource = /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
    return isSource ? [path] : []
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

describe('refusals', () => {
  const everyRefusal = [
    ['construction', CONSTRUCTION_REFUSALS],
    ['demolition', DEMOLITION_REFUSALS],
    ['upgrade', UPGRADE_REFUSALS],
    ['cast', CAST_REFUSALS],
    ['expedition', EXPEDITION_REFUSALS],
    ['heist', HEIST_REFUSALS],
    ['ascension', ASCENSION_REFUSALS],
  ] as const

  /** The systems return a reason code; the interface has to have words for all of them. */
  it('has a message for every reason a system can refuse', () => {
    const missing = everyRefusal.flatMap(([domain, refusals]) =>
      refusals
        .map((refusal) => `refusals.${domain}.${refusal}`)
        .filter((key) => i18n.t(key) === key),
    )

    expect(missing).toEqual([])
  })

  it('covers every domain that can refuse the player', () => {
    expect(everyRefusal.flatMap(([, refusals]) => refusals).length).toBeGreaterThan(20)
  })
})

describe('the interface copy', () => {
  const usedKeys = () => {
    const keys = new Set<string>()
    for (const file of sourceFilesUnder('src/ui')) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([a-z][A-Za-z.]+)'/g)) {
        keys.add(match[1]!)
      }
    }
    return [...keys].sort()
  }

  it('has a translation for every key the interface asks for', () => {
    const missing = usedKeys().filter((key) => {
      const singular = i18n.t(key, { count: 1 })
      const plural = i18n.t(key, { count: 2 })
      return singular === key || plural === key
    })

    expect(missing).toEqual([])
  })

  it('is asking for a substantial number of them, so the scan is meaningful', () => {
    expect(usedKeys().length).toBeGreaterThan(60)
  })
})
