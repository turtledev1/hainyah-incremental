import type { ContentRegistry } from '../model/content'
import type { BuildingId } from '../model/ids'
import type { Modifier, ModifierIndex, ModifierTarget } from '../model/modifiers'
import { NEUTRAL_RESOLVED_MODIFIER } from '../model/modifiers'
import type { GameState } from '../model/state'

/** The race, purchased upgrades and active buffs. Nothing else may change a number. */
export function collectActiveModifiers(
  state: GameState,
  registry: ContentRegistry,
): readonly Modifier[] {
  const collected: Modifier[] = []

  const race = registry.racesById.get(state.raceId)
  if (race) {
    collected.push(...race.modifiers)
  }

  for (const [upgradeId, purchaseCount] of Object.entries(state.purchasedUpgrades)) {
    const upgrade = registry.upgradesById.get(upgradeId)
    if (!upgrade || purchaseCount <= 0) {
      continue
    }
    for (let purchase = 0; purchase < purchaseCount; purchase += 1) {
      collected.push(...upgrade.modifiers)
    }
  }

  for (const activeBuff of state.magic.activeBuffs) {
    collected.push(...activeBuff.modifiers)
  }

  return collected
}

export function buildModifierIndex(modifiers: readonly Modifier[]): ModifierIndex {
  const index = new Map<ModifierTarget, { additive: number; multiplicative: number }>()

  for (const modifier of modifiers) {
    const existing = index.get(modifier.target) ?? { additive: 0, multiplicative: 1 }
    if (modifier.operation === 'add') {
      existing.additive += modifier.value
    } else {
      existing.multiplicative *= modifier.value
    }
    index.set(modifier.target, existing)
  }

  return index
}

export function buildModifierIndexForState(
  state: GameState,
  registry: ContentRegistry,
): ModifierIndex {
  return buildModifierIndex(collectActiveModifiers(state, registry))
}

/** Adds land first, then multipliers — so a `multiply: 0` cannot be undone by an add. */
export function resolveValue(
  index: ModifierIndex,
  target: ModifierTarget,
  baseValue: number,
): number {
  const resolved = index.get(target) ?? NEUTRAL_RESOLVED_MODIFIER
  return (baseValue + resolved.additive) * resolved.multiplicative
}

/** Convenience for targets whose base value is a neutral multiplier of 1. */
export function resolveMultiplier(index: ModifierIndex, target: ModifierTarget): number {
  return resolveValue(index, target, 1)
}

export function resolveBuildingOutputMultiplier(
  index: ModifierIndex,
  buildingId: BuildingId,
): number {
  return resolveMultiplier(index, `buildingOutput.${buildingId}`)
}

/** A resolved rate may legitimately be zero, so divisions by one come through here. */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return numerator === 0 ? 0 : Number.POSITIVE_INFINITY
  }
  return numerator / denominator
}
