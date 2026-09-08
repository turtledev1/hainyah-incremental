import { contentKeys } from '../../i18n/contentKeys'
import { BALANCE } from '../content/balance'
import type { ContentRegistry, SpellDefinition } from '../model/content'
import type { MagicCircleId, SpellId } from '../model/ids'
import type { Modifier, ModifierIndex } from '../model/modifiers'
import type { GameState } from '../model/state'
import type { TickContext } from '../model/tick'
import { buildModifierIndexForState, resolveValue } from './modifiers'
import { computeMagicExperiencePerSecond } from './production'
import { emitEvent } from './stateHelpers'

export function tiersUnlockedInCircle(
  state: GameState,
  registry: ContentRegistry,
  circleId: MagicCircleId,
): number {
  const circle = registry.magicCirclesById.get(circleId)
  if (!circle) {
    return 0
  }
  const experience = state.magic.experience[circleId]
  return circle.tierExperienceThresholds.filter((threshold) => experience >= threshold).length
}

export function experienceRequiredForNextTier(
  state: GameState,
  registry: ContentRegistry,
  circleId: MagicCircleId,
): number | undefined {
  const circle = registry.magicCirclesById.get(circleId)
  if (!circle) {
    return undefined
  }
  return circle.tierExperienceThresholds[tiersUnlockedInCircle(state, registry, circleId)]
}

export function highestTierUnlockedInAnyCircle(
  state: GameState,
  registry: ContentRegistry,
): number {
  return state.chosenMagicCircleIds.reduce(
    (highest, circleId) => Math.max(highest, tiersUnlockedInCircle(state, registry, circleId)),
    0,
  )
}

export function spellsAvailableToRealm(
  state: GameState,
  registry: ContentRegistry,
): readonly SpellDefinition[] {
  return registry.spells.filter((spell) => state.chosenMagicCircleIds.includes(spell.circleId))
}

export function isSpellUnlocked(
  state: GameState,
  registry: ContentRegistry,
  spell: SpellDefinition,
): boolean {
  return (
    state.chosenMagicCircleIds.includes(spell.circleId) &&
    tiersUnlockedInCircle(state, registry, spell.circleId) >= spell.tier
  )
}

export const CAST_REFUSALS = [
  'unknownSpell',
  'circleNotStudied',
  'tierLocked',
  'onCooldown',
  'notEnoughMana',
  'boostAlreadyWaiting',
] as const

export type CastRefusal = (typeof CAST_REFUSALS)[number]

export function checkCastRefusal(
  state: GameState,
  registry: ContentRegistry,
  spellId: SpellId,
): CastRefusal | undefined {
  const spell = registry.spellsById.get(spellId)
  if (!spell) {
    return 'unknownSpell'
  }
  if (!state.chosenMagicCircleIds.includes(spell.circleId)) {
    return 'circleNotStudied'
  }
  if (tiersUnlockedInCircle(state, registry, spell.circleId) < spell.tier) {
    return 'tierLocked'
  }
  if ((state.magic.spellCooldowns[spellId] ?? 0) > 0) {
    return 'onCooldown'
  }
  if (state.magic.mana < spell.manaCost) {
    return 'notEnoughMana'
  }
  /** A waiting boost has no duration, so there is nothing for a second cast to refresh. */
  if (
    spell.effect.kind === 'pendingBoost' &&
    state.magic.pendingBoosts.some((boost) => boost.spellId === spellId)
  ) {
    return 'boostAlreadyWaiting'
  }
  return undefined
}

export function castSpell(
  state: GameState,
  registry: ContentRegistry,
  spellId: SpellId,
  random: () => number,
): CastRefusal | undefined {
  const refusal = checkCastRefusal(state, registry, spellId)
  if (refusal) {
    return refusal
  }
  const spell = registry.spellsById.get(spellId)!

  state.magic.mana -= spell.manaCost
  state.magic.spellCooldowns[spellId] = spell.cooldownSeconds
  state.statistics.spellsCast += 1

  switch (spell.effect.kind) {
    case 'buff': {
      const existing = state.magic.activeBuffs.find((buff) => buff.spellId === spellId)
      if (existing) {
        existing.remainingSeconds = spell.effect.durationSeconds
      } else {
        state.magic.activeBuffs.push({
          spellId,
          remainingSeconds: spell.effect.durationSeconds,
          modifiers: spell.effect.modifiers,
        })
      }
      emitEvent(state, 'magic', 'chronicle.spellTakesHold', {
        spellKey: contentKeys.spellName(spellId),
      })
      break
    }
    case 'pendingBoost': {
      state.magic.pendingBoosts.push({
        spellId,
        consumeOn: spell.effect.consumeOn,
        modifiers: spell.effect.modifiers,
      })
      emitEvent(
        state,
        'magic',
        spell.effect.consumeOn === 'expedition'
          ? 'chronicle.boostAwaitsAttack'
          : 'chronicle.boostAwaitsHeist',
        { spellKey: contentKeys.spellName(spellId) },
      )
      break
    }
    case 'instant': {
      spell.effect.apply({
        state,
        registry,
        modifiers: buildModifierIndexForState(state, registry),
        random,
        emit: (kind, messageKey, values) => emitEvent(state, kind, messageKey, values),
      })
      break
    }
  }

  return undefined
}

/** Spends the boosts a launching expedition or heist is entitled to. */
export function consumePendingBoosts(
  state: GameState,
  consumeOn: 'expedition' | 'heist',
): readonly SpellId[] {
  const consumed = state.magic.pendingBoosts.filter((boost) => boost.consumeOn === consumeOn)
  state.magic.pendingBoosts = state.magic.pendingBoosts.filter(
    (boost) => boost.consumeOn !== consumeOn,
  )
  return consumed.map((boost) => boost.spellId)
}

/** Turns stored boost spell ids back into modifiers at the moment they matter. */
export function modifiersFromSpellIds(
  registry: ContentRegistry,
  spellIds: readonly SpellId[],
): readonly Modifier[] {
  return spellIds.flatMap((spellId) => {
    const effect = registry.spellsById.get(spellId)?.effect
    return effect && effect.kind !== 'instant' ? [...effect.modifiers] : []
  })
}

/** Tiers reached across every circle the realm studies. */
export function totalTiersUnlocked(state: GameState, registry: ContentRegistry): number {
  return state.chosenMagicCircleIds.reduce(
    (runningTotal, circleId) => runningTotal + tiersUnlockedInCircle(state, registry, circleId),
    0,
  )
}

/** A mage carries what they have learned, so temples teach but do not hold mana. */
export function currentManaCapacity(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
): number {
  const fromLearning =
    BALANCE.magic.baseManaCapacity +
    totalTiersUnlocked(state, registry) * BALANCE.magic.manaCapacityPerCircleTier
  return resolveValue(modifiers, 'magic.manaPool', fromLearning)
}

export function currentManaRegenerationPerSecond(
  state: GameState,
  registry: ContentRegistry,
  modifiers: ModifierIndex,
): number {
  const fromLearning =
    BALANCE.magic.baseManaRegenPerSecond +
    totalTiersUnlocked(state, registry) * BALANCE.magic.manaRegenPerCircleTierPerSecond
  return resolveValue(modifiers, 'magic.manaRegen', fromLearning)
}

export const advanceMagic = ({
  state,
  registry,
  modifiers,
  deltaSeconds,
}: TickContext): void => {
  const experienceGained =
    computeMagicExperiencePerSecond(state, registry, modifiers) * deltaSeconds
  if (experienceGained > 0 && state.chosenMagicCircleIds.length > 0) {
    const sharePerCircle = experienceGained / state.chosenMagicCircleIds.length
    for (const circleId of state.chosenMagicCircleIds) {
      state.magic.experience[circleId] += sharePerCircle
    }
  }

  const manaCapacity = currentManaCapacity(state, registry, modifiers)
  const regenerated = currentManaRegenerationPerSecond(state, registry, modifiers) * deltaSeconds
  state.magic.mana = Math.min(manaCapacity, state.magic.mana + regenerated)

  for (const buff of state.magic.activeBuffs) {
    buff.remainingSeconds -= deltaSeconds
  }
  const expired = state.magic.activeBuffs.filter((buff) => buff.remainingSeconds <= 0)
  if (expired.length > 0) {
    state.magic.activeBuffs = state.magic.activeBuffs.filter((buff) => buff.remainingSeconds > 0)
    for (const buff of expired) {
      emitEvent(state, 'magic', 'chronicle.spellFades', {
        spellKey: contentKeys.spellName(buff.spellId),
      })
    }
  }

  for (const [spellId, remaining] of Object.entries(state.magic.spellCooldowns)) {
    if (remaining <= 0) {
      continue
    }
    state.magic.spellCooldowns[spellId] = Math.max(0, remaining - deltaSeconds)
  }
}
