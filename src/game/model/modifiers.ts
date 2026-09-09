import type { BuildingId, CapacityId, ResourceId } from './ids'

export type ModifierTarget =
  | `production.${ResourceId}`
  | `consumption.${ResourceId}`
  | `capacity.${CapacityId}`
  | `buildingOutput.${BuildingId}`
  | 'manualGatherYield'
  | 'constructionSpeed'
  | 'buildingCost'
  | 'populationGrowthRate'
  | 'magic.experienceGain'
  | 'magic.manaPool'
  | 'magic.manaRegen'
  | 'thievery.successChance'
  | 'thievery.loot'
  | 'thievery.casualtyRate'
  | 'thievery.speed'
  | 'warfare.attackPower'
  | 'warfare.casualtyRate'
  | 'warfare.travelSpeed'
  | 'warfare.targetDefense'
  | 'warfare.plunder'
  | 'warfare.campaignSlots'

export type ModifierOperation = 'add' | 'multiply'

export interface Modifier {
  readonly target: ModifierTarget
  readonly operation: ModifierOperation
  readonly value: number
}

/** Modifiers grouped with a human-readable origin, so the UI can explain a number. */
export interface ModifierSource {
  readonly label: string
  readonly modifiers: readonly Modifier[]
}

export interface ResolvedModifier {
  readonly additive: number
  readonly multiplicative: number
}

export const NEUTRAL_RESOLVED_MODIFIER: ResolvedModifier = { additive: 0, multiplicative: 1 }

export type ModifierIndex = ReadonlyMap<ModifierTarget, ResolvedModifier>

export function describeModifier(modifier: Modifier): string {
  if (modifier.operation === 'multiply') {
    const percentageChange = Math.round((modifier.value - 1) * 100)
    const sign = percentageChange >= 0 ? '+' : ''
    return `${sign}${percentageChange}%`
  }
  const sign = modifier.value >= 0 ? '+' : ''
  return `${sign}${modifier.value}`
}
