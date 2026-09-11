import type { TFunction } from 'i18next'
import { contentKeys } from '../i18n/contentKeys'
import type { BuildingDefinition, ContentRegistry } from '../game/model/content'
import type { ModifierIndex } from '../game/model/modifiers'
import { resolveMultiplier } from '../game/systems/modifiers'
import { formatNumber, formatRate } from './format'

/** Room per worker and room per building read differently, and players conflate them. */
export function describeWorkerContribution(
  building: BuildingDefinition,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
  outputPerWorkerPerSecond: number,
  translate: TFunction,
): readonly string[] {
  const described: string[] = []

  for (const effect of building.effects) {
    switch (effect.kind) {
      case 'produceResource':
        described.push(
          translate('buildings.producesPerWorker', {
            rate: formatRate(outputPerWorkerPerSecond),
            resourceName: translate(contentKeys.resourceName(effect.resourceId)),
            role: workerRole(building, translate),
          }),
        )
        break
      case 'grantCapacity': {
        // Race and upgrades scale the capacity total, so the definition amount alone misleads.
        const capacityMultiplier = resolveMultiplier(modifiers, `capacity.${effect.capacityId}`)
        if (effect.amountPerWorker) {
          const roomPerWorker = effect.amountPerWorker * capacityMultiplier
          described.push(
            translate(`buildings.roomPerWorker.${effect.capacityId}`, {
              count: roomPerWorker,
              amount: formatNumber(roomPerWorker),
              role: workerRoleSingular(building, translate),
            }),
          )
        }
        if (effect.amountPerBuilding) {
          const roomPerBuilding = effect.amountPerBuilding * capacityMultiplier
          described.push(
            translate(`buildings.roomPerBuilding.${effect.capacityId}`, {
              count: roomPerBuilding,
              amount: formatNumber(roomPerBuilding),
            }),
          )
        }
        break
      }
      case 'generateMagicExperience':
        described.push(translate('buildings.teachesMagic', { role: workerRole(building, translate) }))
        break
    }
  }

  return described
}

export function workerRole(building: BuildingDefinition, translate: TFunction): string {
  return translate(contentKeys.buildingWorkerRole(building.id), {
    defaultValue: translate('buildings.genericWorkers'),
  })
}

function workerRoleSingular(building: BuildingDefinition, translate: TFunction): string {
  return translate(contentKeys.buildingWorkerRoleSingular(building.id), {
    defaultValue: translate('buildings.genericWorker'),
  })
}
