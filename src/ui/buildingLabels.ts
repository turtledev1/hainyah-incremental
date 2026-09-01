import type { TFunction } from 'i18next'
import { contentKeys } from '../i18n/contentKeys'
import type { BuildingDefinition, ContentRegistry } from '../game/model/content'
import { formatRate } from './format'

/** Room per worker and room per building read differently, and players conflate them. */
export function describeWorkerContribution(
  building: BuildingDefinition,
  registry: ContentRegistry,
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
      case 'grantCapacity':
        if (effect.amountPerWorker) {
          described.push(
            translate(`buildings.roomPerWorker.${effect.capacityId}`, {
              count: effect.amountPerWorker,
              role: workerRoleSingular(building, translate),
            }),
          )
        }
        if (effect.amountPerBuilding) {
          described.push(
            translate(`buildings.roomPerBuilding.${effect.capacityId}`, {
              count: effect.amountPerBuilding,
            }),
          )
        }
        break
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
