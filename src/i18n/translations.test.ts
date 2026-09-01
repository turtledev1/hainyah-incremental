import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ASCENSION_REFUSALS } from '../game/systems/ascension'
import { CONSTRUCTION_REFUSALS, DEMOLITION_REFUSALS } from '../game/systems/construction'
import { CAST_REFUSALS } from '../game/systems/magic'
import { HEIST_REFUSALS } from '../game/systems/thievery'
import { UPGRADE_REFUSALS } from '../game/systems/upgrades'
import { EXPEDITION_REFUSALS } from '../game/systems/warfare'
import { availableTranslations, FALLBACK_LANGUAGE, i18n } from './index'
import { contentKeys } from './contentKeys'
import { CONTENT_REGISTRY } from '../game/content'

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

  it('resolves the content name an event carries as a key', () => {
    expect(
      i18n.t('chronicle.buildingFinished', { buildingKey: contentKeys.buildingName('lumberCamp') }),
    ).toBe('Lumber Camp finished.')
  })

  it('formats a duration through the shared formatter rather than in a system', () => {
    expect(
      i18n.t('chronicle.marchBegan', {
        count: 12,
        targetKey: contentKeys.conquestTargetName('town'),
        arrivalSeconds: 90,
      }),
    ).toBe('12 soldiers march on Walled Town, arriving in 1m 30s.')
  })

  it('re-reads an event already in the log when the language changes', async () => {
    i18n.addResourceBundle('cy', 'translation', {
      chronicle: { buildingFinished: '$t({{buildingKey}}) wedi ei orffen.' },
      content: { buildings: { lumberCamp: { name: 'Gwersyll Coed' } } },
    })
    const storedValues = { buildingKey: contentKeys.buildingName('lumberCamp') }

    await i18n.changeLanguage('cy')
    expect(i18n.t('chronicle.buildingFinished', storedValues)).toBe('Gwersyll Coed wedi ei orffen.')

    await i18n.changeLanguage('en')
    expect(i18n.t('chronicle.buildingFinished', storedValues)).toBe('Lumber Camp finished.')
  })

  it('formats large numbers compactly inside a message', () => {
    expect(i18n.t('chronicle.tideYields', { amount: 12_500 })).toBe(
      'Tide of Plenty yields 12.5k food.',
    )
  })
})

describe('every language', () => {
  /** Keys like `fire.sunlight` hold their own dots, so a path is a list, not a string. */
  const leafPaths = (value: unknown, prefix: readonly string[] = []): readonly string[][] => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return [[...prefix]]
    }
    return Object.entries(value).flatMap(([key, nested]) => leafPaths(nested, [...prefix, key]))
  }

  const readAt = (bundle: object, path: readonly string[]): unknown =>
    path.reduce<unknown>((value, key) => (value as Record<string, unknown>)?.[key], bundle)

  const english = leafPaths(availableTranslations.en.translation)
  const asText = (path: readonly string[]): string => path.join(' › ')

  for (const [language, bundle] of Object.entries(availableTranslations)) {
    if (language === FALLBACK_LANGUAGE) {
      continue
    }

    it(`says everything English says, in ${language}`, () => {
      const missing = english
        .filter((path) => readAt(bundle.translation, path) === undefined)
        .map(asText)

      expect(missing).toEqual([])
    })

    it(`says nothing English does not, in ${language}`, () => {
      const extra = leafPaths(bundle.translation)
        .filter((path) => readAt(availableTranslations.en.translation, path) === undefined)
        .map(asText)

      expect(extra).toEqual([])
    })

    it(`leaves no English sentence sitting in ${language}`, () => {
      /** A word or two can be the same in both languages; a sentence cannot. */
      const isSentence = (source: string): boolean =>
        source
          .replace(/\{\{[^}]*\}\}|\$t\([^)]*\)/g, ' ')
          .split(/[^\p{L}’-]+/u)
          .filter((word) => word.length > 0).length >= 3

      const untranslated = english
        .filter((path) => {
          const source = readAt(availableTranslations.en.translation, path)
          return (
            typeof source === 'string' &&
            isSentence(source) &&
            readAt(bundle.translation, path) === source
          )
        })
        .map(asText)

      expect(untranslated).toEqual([])
    })
  }
})

describe('content prose', () => {
  const resolves = (key: string): boolean => i18n.t(key) !== key

  it('has a name and a flavour for everything the registry defines', () => {
    const missing: string[] = []
    const check = (...keys: string[]) => missing.push(...keys.filter((key) => !resolves(key)))

    for (const resource of CONTENT_REGISTRY.resources) {
      check(contentKeys.resourceName(resource.id), contentKeys.resourceFlavor(resource.id))
      if (resource.manualGather) {
        check(contentKeys.gatherAction(resource.id))
      }
    }
    for (const race of CONTENT_REGISTRY.races) {
      check(
        contentKeys.raceName(race.id),
        contentKeys.raceTagline(race.id),
        contentKeys.raceAdvantages(race.id),
        contentKeys.raceDisadvantages(race.id),
      )
    }
    for (const building of CONTENT_REGISTRY.buildings) {
      check(contentKeys.buildingName(building.id), contentKeys.buildingFlavor(building.id))
    }
    for (const circle of CONTENT_REGISTRY.magicCircles) {
      check(contentKeys.circleName(circle.id), contentKeys.circleFlavor(circle.id))
    }
    for (const spell of CONTENT_REGISTRY.spells) {
      check(contentKeys.spellName(spell.id), contentKeys.spellDescription(spell.id))
    }
    for (const line of CONTENT_REGISTRY.upgradeLines) {
      check(contentKeys.upgradeLineName(line.id), contentKeys.upgradeLineFlavor(line.id))
    }
    for (const upgrade of CONTENT_REGISTRY.upgrades) {
      check(contentKeys.upgradeName(upgrade.id), contentKeys.upgradeFlavor(upgrade.id))
    }
    for (const target of CONTENT_REGISTRY.conquestTargets) {
      check(
        contentKeys.conquestTargetName(target.id),
        contentKeys.conquestTargetFlavor(target.id),
      )
    }
    for (const target of CONTENT_REGISTRY.thieveryTargets) {
      check(
        contentKeys.thieveryTargetName(target.id),
        contentKeys.thieveryTargetFlavor(target.id),
      )
    }
    for (const stage of CONTENT_REGISTRY.ascensionStages) {
      check(
        contentKeys.ascensionStageName(stage.index),
        contentKeys.ascensionStageFlavor(stage.index),
      )
    }

    expect(missing).toEqual([])
  })

  it('gives a worker role both numbers wherever it gives one', () => {
    for (const building of CONTENT_REGISTRY.buildings) {
      const plural = resolves(contentKeys.buildingWorkerRole(building.id))
      const singular = resolves(contentKeys.buildingWorkerRoleSingular(building.id))

      expect(singular).toBe(plural)
    }
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
