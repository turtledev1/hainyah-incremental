import type { TFunction } from 'i18next'
import { contentKeys } from '../i18n/contentKeys'
import type { ContentRegistry } from '../game/model/content'
import type { BuildingId, CapacityId, ResourceId } from '../game/model/ids'
import type { Modifier, ModifierTarget } from '../game/model/modifiers'
import { describeModifier } from '../game/model/modifiers'

export function describeModifierTarget(
  target: ModifierTarget,
  registry: ContentRegistry,
  translate: TFunction,
): string {
  const [group, subject] = target.split('.') as [string, string | undefined]

  if (subject !== undefined) {
    if (group === 'production') {
      return translate('modifiers.allProduction', {
        resourceName: translate(contentKeys.resourceName(subject as ResourceId)),
      })
    }
    if (group === 'consumption') {
      return translate('modifiers.consumption', {
        resourceName: translate(contentKeys.resourceName(subject as ResourceId)),
      })
    }
    if (group === 'buildingOutput') {
      return translate('modifiers.buildingOutput', {
        buildingName: translate(contentKeys.buildingName(subject as BuildingId)),
      })
    }
    if (group === 'capacity') {
      return translate(`modifiers.capacity.${subject as CapacityId}`)
    }
  }

  return translate(`modifiers.${target}`)
}

/**
 * What a repeatable upgrade comes to after so many purchases, so nobody has to raise
 * 0.96 to the twenty-fifth power in their head.
 */
export function stackModifiers(
  modifiers: readonly Modifier[],
  purchases: number,
): readonly Modifier[] {
  return modifiers.map((modifier) =>
    modifier.operation === 'multiply'
      ? { ...modifier, value: modifier.value ** purchases }
      : { ...modifier, value: modifier.value * purchases },
  )
}

export function describeModifierEffect(
  modifier: Modifier,
  registry: ContentRegistry,
  translate: TFunction,
): string {
  return `${describeModifierTarget(modifier.target, registry, translate)} ${describeModifier(modifier)}`
}

/** A modifier hitting all four resources collapses into one line. */
export function summariseModifiers(
  modifiers: readonly Modifier[],
  registry: ContentRegistry,
  translate: TFunction,
): readonly string[] {
  const everyProductionTarget = (['food', 'wood', 'stone', 'gold'] as const).map(
    (resourceId) => `production.${resourceId}` as ModifierTarget,
  )
  const productionModifiers = modifiers.filter((modifier) =>
    everyProductionTarget.includes(modifier.target),
  )
  const touchesEveryResource =
    productionModifiers.length === everyProductionTarget.length &&
    new Set(productionModifiers.map((modifier) => modifier.value)).size === 1

  const described: string[] = []
  if (touchesEveryResource) {
    described.push(
      `${translate('modifiers.everyProduction')} ${describeModifier(productionModifiers[0]!)}`,
    )
  }

  for (const modifier of modifiers) {
    if (touchesEveryResource && productionModifiers.includes(modifier)) {
      continue
    }
    described.push(describeModifierEffect(modifier, registry, translate))
  }
  return described
}
