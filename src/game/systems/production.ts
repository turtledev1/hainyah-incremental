import type { ContentRegistry } from '../model/content'
import type { ResourceId } from '../model/ids'
import { RESOURCE_IDS } from '../model/ids'
import type { ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import type { TickContext } from '../model/tick'
import { resolveBuildingOutputMultiplier, resolveMultiplier } from './modifiers'
import { addResource } from './stateHelpers'

function effectiveWorkers(
  state: GameState,
  registry: ContentRegistry,
  buildingId: ContentRegistry['buildings'][number]['id'],
): number {
  const building = registry.buildingsById.get(buildingId)
  if (!building) {
    return 0
  }
  const slots = state.buildings[buildingId] * building.workerSlotsPerBuilding
  return Math.min(state.workerAssignments[buildingId], slots)
}

export function computeProductionPerSecond(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
): Record<ResourceId, number> {
  const perSecond = { food: 0, wood: 0, stone: 0, gold: 0 } satisfies Record<ResourceId, number>

  for (const building of registry.buildings) {
    const workers = effectiveWorkers(state, registry, building.id)
    if (workers <= 0) {
      continue
    }
    const buildingMultiplier = resolveBuildingOutputMultiplier(modifiers, building.id)

    for (const effect of building.effects) {
      if (effect.kind !== 'produceResource') {
        continue
      }
      perSecond[effect.resourceId] += workers * effect.amountPerWorkerPerSecond * buildingMultiplier
    }
  }

  for (const resourceId of RESOURCE_IDS) {
    perSecond[resourceId] *= resolveMultiplier(modifiers, `production.${resourceId}`)
  }

  return perSecond
}

export function computeMagicExperiencePerSecond(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
): number {
  let perSecond = 0

  for (const building of registry.buildings) {
    const workers = effectiveWorkers(state, registry, building.id)
    if (workers <= 0) {
      continue
    }
    const buildingMultiplier = resolveBuildingOutputMultiplier(modifiers, building.id)
    for (const effect of building.effects) {
      if (effect.kind === 'generateMagicExperience') {
        perSecond += workers * effect.experiencePerWorkerPerSecond * buildingMultiplier
      }
    }
  }

  return perSecond * resolveMultiplier(modifiers, 'magic.experienceGain')
}

export const produceResources = ({ state, registry, modifiers, deltaSeconds }: TickContext): void => {
  const perSecond = computeProductionPerSecond(state, registry, modifiers)
  for (const resourceId of RESOURCE_IDS) {
    if (perSecond[resourceId] !== 0) {
      addResource(state, resourceId, perSecond[resourceId] * deltaSeconds)
    }
  }
}
