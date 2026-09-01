import type { ContentRegistry } from '../model/content'
import { ASCENSION_STAGE_DEFINITIONS } from './ascension'
import { BUILDING_DEFINITIONS } from './buildings'
import { CONQUEST_TARGET_DEFINITIONS } from './conquestTargets'
import { MAGIC_CIRCLE_DEFINITIONS } from './magicCircles'
import { RACE_DEFINITIONS } from './races'
import { RESOURCE_DEFINITIONS } from './resources'
import { SPELL_DEFINITIONS } from './spells'
import { THIEVERY_TARGET_DEFINITIONS } from './thieveryTargets'
import { UPGRADE_DEFINITIONS, UPGRADE_LINE_DEFINITIONS } from './upgrades'

function indexById<TId, TDefinition extends { id: TId }>(
  definitions: readonly TDefinition[],
  collectionName: string,
): ReadonlyMap<TId, TDefinition> {
  const index = new Map<TId, TDefinition>()
  for (const definition of definitions) {
    if (index.has(definition.id)) {
      throw new Error(`Duplicate ${collectionName} id: ${String(definition.id)}`)
    }
    index.set(definition.id, definition)
  }
  return index
}

/** Fails loudly at start-up instead of silently disabling a spell or an upgrade. */
function assertRegistryIsConsistent(registry: ContentRegistry): void {
  const knownUpgradeLineIds = new Set(registry.upgradeLines.map((line) => line.id))

  for (const upgrade of registry.upgrades) {
    if (!knownUpgradeLineIds.has(upgrade.lineId)) {
      throw new Error(`Upgrade ${upgrade.id} belongs to unknown line ${upgrade.lineId}`)
    }
    for (const prerequisiteId of upgrade.requires.upgradeIds ?? []) {
      if (!registry.upgradesById.has(prerequisiteId)) {
        throw new Error(`Upgrade ${upgrade.id} requires unknown upgrade ${prerequisiteId}`)
      }
    }
    for (const buildingId of Object.keys(upgrade.requires.buildingCounts ?? {})) {
      if (!registry.buildingsById.has(buildingId as never)) {
        throw new Error(`Upgrade ${upgrade.id} requires unknown building ${buildingId}`)
      }
    }
    if (Object.keys(upgrade.costs).length === 0) {
      throw new Error(`Upgrade ${upgrade.id} is free, which is almost certainly a mistake`)
    }
  }

  for (const spell of registry.spells) {
    if (!registry.magicCirclesById.has(spell.circleId)) {
      throw new Error(`Spell ${spell.id} belongs to unknown circle ${spell.circleId}`)
    }
    const circle = registry.magicCirclesById.get(spell.circleId)!
    if (spell.tier < 1 || spell.tier > circle.tierExperienceThresholds.length) {
      throw new Error(`Spell ${spell.id} has tier ${spell.tier} outside its circle's tiers`)
    }
  }

  for (const race of registry.races) {
    const { grantedCircleIds, chosenCircleCount, choosableCircleIds } = race.magicCircleAccess
    if (grantedCircleIds.length + chosenCircleCount < 1) {
      throw new Error(`Race ${race.id} would have no magic at all`)
    }
    if (chosenCircleCount > choosableCircleIds.length) {
      throw new Error(
        `Race ${race.id} must pick ${chosenCircleCount} of only ${choosableCircleIds.length} circles`,
      )
    }
    for (const circleId of [...grantedCircleIds, ...choosableCircleIds]) {
      if (!registry.magicCirclesById.has(circleId)) {
        throw new Error(`Race ${race.id} may use unknown circle ${circleId}`)
      }
      if (grantedCircleIds.includes(circleId) && choosableCircleIds.includes(circleId)) {
        throw new Error(`Race ${race.id} both grants and offers circle ${circleId}`)
      }
    }
  }

  registry.ascensionStages.forEach((stage, position) => {
    if (stage.index !== position + 1) {
      throw new Error(`Ascension stage ${stage.name} is out of order at position ${position + 1}`)
    }
  })
}

function createContentRegistry(): ContentRegistry {
  const registry: ContentRegistry = {
    resources: RESOURCE_DEFINITIONS,
    resourcesById: indexById(RESOURCE_DEFINITIONS, 'resource'),
    races: RACE_DEFINITIONS,
    racesById: indexById(RACE_DEFINITIONS, 'race'),
    buildings: BUILDING_DEFINITIONS,
    buildingsById: indexById(BUILDING_DEFINITIONS, 'building'),
    magicCircles: MAGIC_CIRCLE_DEFINITIONS,
    magicCirclesById: indexById(MAGIC_CIRCLE_DEFINITIONS, 'magic circle'),
    spells: SPELL_DEFINITIONS,
    spellsById: indexById(SPELL_DEFINITIONS, 'spell'),
    upgradeLines: UPGRADE_LINE_DEFINITIONS,
    upgrades: UPGRADE_DEFINITIONS,
    upgradesById: indexById(UPGRADE_DEFINITIONS, 'upgrade'),
    conquestTargets: CONQUEST_TARGET_DEFINITIONS,
    conquestTargetsById: indexById(CONQUEST_TARGET_DEFINITIONS, 'conquest target'),
    thieveryTargets: THIEVERY_TARGET_DEFINITIONS,
    thieveryTargetsById: indexById(THIEVERY_TARGET_DEFINITIONS, 'thievery target'),
    ascensionStages: ASCENSION_STAGE_DEFINITIONS,
  }

  assertRegistryIsConsistent(registry)
  return registry
}

export const CONTENT_REGISTRY: ContentRegistry = createContentRegistry()
