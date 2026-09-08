import { contentKeys } from '../../i18n/contentKeys'
import type { SpellDefinition, SpellEffectContext } from '../model/content'
import type { ResourceAmounts, ResourceId } from '../model/ids'
import { RESOURCE_IDS } from '../model/ids'
import { capacityOf } from '../systems/capacity'
import { grantAcres } from '../systems/land'
import { computeProductionPerSecond } from '../systems/production'
import {
  addResource,
  addResources,
  canAfford,
  payCosts,
  removeCitizens,
} from '../systems/stateHelpers'
import { BALANCE } from './balance'

function manaCostForTier(tier: number): number {
  const byTier = BALANCE.magic.manaCostByTier
  return byTier[tier - 1] ?? byTier[byTier.length - 1]!
}

/** Deliberately the price of two sustained buffs of the same tier. */
function burstManaCostForTier(tier: number): number {
  return manaCostForTier(tier) * BALANCE.magic.burstManaCostMultiplier
}

function circleTiersUnlocked(context: SpellEffectContext, circleId: 'dark'): number {
  const experience = context.state.magic.experience[circleId]
  return BALANCE.magic.tierExperienceThresholds.filter((threshold) => experience >= threshold).length
}

function mostAbundantResource(context: SpellEffectContext): ResourceId {
  return RESOURCE_IDS.reduce((best, candidate) =>
    context.state.resources[candidate] > context.state.resources[best] ? candidate : best,
  )
}

const FIRE_SPELLS: readonly SpellDefinition[] = [
  {
    id: 'fire.sunlight',
    circleId: 'fire',
    tier: 1,
    manaCost: manaCostForTier(1),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 1.6 }],
    },
  },
  {
    id: 'fire.forgeFire',
    circleId: 'fire',
    tier: 2,
    manaCost: manaCostForTier(2),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [{ target: 'buildingOutput.mine', operation: 'multiply', value: 1.7 }],
    },
  },
  {
    id: 'fire.immolate',
    circleId: 'fire',
    tier: 3,
    manaCost: burstManaCostForTier(3),
    cooldownSeconds: BALANCE.magic.burstCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'burst',
      durationSeconds: BALANCE.magic.burstDurationSeconds,
      modifiers: [{ target: 'warfare.attackPower', operation: 'multiply', value: 3 }],
    },
  },
  {
    id: 'fire.wildfire',
    circleId: 'fire',
    tier: 4,
    manaCost: manaCostForTier(4),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'pendingBoost',
      consumeOn: 'expedition',
      modifiers: [{ target: 'warfare.targetDefense', operation: 'multiply', value: 0.6 }],
    },
  },
  {
    id: 'fire.solarZenith',
    circleId: 'fire',
    tier: 5,
    manaCost: manaCostForTier(5),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [
        { target: 'buildingOutput.farm', operation: 'multiply', value: 2.2 },
        { target: 'buildingOutput.mine', operation: 'multiply', value: 2.2 },
      ],
    },
  },
  {
    id: 'fire.phoenixPyre',
    circleId: 'fire',
    tier: 6,
    manaCost: manaCostForTier(6),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const recoverable = Math.floor(context.state.lastBattleSoldiersLost / 2)
        if (recoverable <= 0) {
          context.emit('magic', 'chronicle.phoenixPyreCold')
          return
        }
        context.state.population += recoverable
        context.state.soldiersAtHome += recoverable
        context.state.lastBattleSoldiersLost -= recoverable
        context.emit('magic', 'chronicle.phoenixPyreReturns', { count: recoverable })
      },
    },
  },
]

const AIR_SPELLS: readonly SpellDefinition[] = [
  {
    id: 'air.windmill',
    circleId: 'air',
    tier: 1,
    manaCost: manaCostForTier(1),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 1.6 }],
    },
  },
  {
    id: 'air.tailwind',
    circleId: 'air',
    tier: 2,
    manaCost: manaCostForTier(2),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [
        { target: 'warfare.travelSpeed', operation: 'multiply', value: 1.8 },
        { target: 'thievery.speed', operation: 'multiply', value: 1.8 },
      ],
    },
  },
  {
    id: 'air.haste',
    circleId: 'air',
    tier: 3,
    manaCost: manaCostForTier(3),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: RESOURCE_IDS.map((resourceId) => ({
        target: `production.${resourceId}` as const,
        operation: 'multiply' as const,
        value: 1.5,
      })),
    },
  },
  {
    id: 'air.whisperingWinds',
    circleId: 'air',
    tier: 4,
    manaCost: manaCostForTier(4),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'pendingBoost',
      consumeOn: 'heist',
      modifiers: [{ target: 'thievery.successChance', operation: 'multiply', value: 2 }],
    },
  },
  {
    id: 'air.stormFront',
    circleId: 'air',
    tier: 5,
    manaCost: manaCostForTier(5),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'pendingBoost',
      consumeOn: 'expedition',
      modifiers: [
        { target: 'warfare.travelSpeed', operation: 'multiply', value: 2 },
        { target: 'warfare.targetDefense', operation: 'multiply', value: 0.75 },
      ],
    },
  },
  {
    id: 'air.timelessGale',
    circleId: 'air',
    tier: 6,
    manaCost: manaCostForTier(6),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: RESOURCE_IDS.map((resourceId) => ({
        target: `production.${resourceId}` as const,
        operation: 'multiply' as const,
        value: 2,
      })),
    },
  },
]

const WATER_SPELLS: readonly SpellDefinition[] = [
  {
    id: 'water.irrigation',
    circleId: 'water',
    tier: 1,
    manaCost: manaCostForTier(1),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 1.7 }],
    },
  },
  {
    id: 'water.cleansingRain',
    circleId: 'water',
    tier: 2,
    manaCost: manaCostForTier(2),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const populationCapacity = capacityOf(
          context.state,
          context.registry,
          context.modifiers,
          'population',
        )
        const roomAvailable = Math.max(0, populationCapacity - Math.floor(context.state.population))
        const arrivals = Math.min(roomAvailable, Math.max(3, Math.ceil(populationCapacity * 0.25)))
        if (arrivals <= 0) {
          context.emit('magic', 'chronicle.cleansingRainNoRoom')
          return
        }
        context.state.population += arrivals
        context.emit('magic', 'chronicle.cleansingRainArrivals', { count: arrivals })
      },
    },
  },
  {
    id: 'water.deepWell',
    circleId: 'water',
    tier: 3,
    manaCost: manaCostForTier(3),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [
        { target: 'production.food', operation: 'multiply', value: 1.45 },
        { target: 'capacity.population', operation: 'multiply', value: 1.25 },
      ],
    },
  },
  {
    id: 'water.tideOfPlenty',
    circleId: 'water',
    tier: 4,
    manaCost: manaCostForTier(4),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const maximumGain = 2_000 + context.state.population * 200
        const gain = Math.min(context.state.resources.food, maximumGain)
        if (gain <= 0) {
          context.emit('magic', 'chronicle.tideOnEmptyGranary')
          return
        }
        addResource(context.state, 'food', gain)
        context.emit('magic', 'chronicle.tideYields', { amount: Math.floor(gain) })
      },
    },
  },
  {
    id: 'water.mistVeil',
    circleId: 'water',
    tier: 5,
    manaCost: manaCostForTier(5),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'pendingBoost',
      consumeOn: 'heist',
      modifiers: [{ target: 'thievery.casualtyRate', operation: 'multiply', value: 0.15 }],
    },
  },
  {
    id: 'water.wellspring',
    circleId: 'water',
    tier: 6,
    manaCost: manaCostForTier(6),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [{ target: 'buildingOutput.farm', operation: 'multiply', value: 2 }],
    },
  },
]

const EARTH_SPELLS: readonly SpellDefinition[] = [
  {
    id: 'earth.stoneshaping',
    circleId: 'earth',
    tier: 1,
    manaCost: manaCostForTier(1),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [{ target: 'buildingOutput.quarry', operation: 'multiply', value: 1.7 }],
    },
  },
  {
    id: 'earth.veinsOfOre',
    circleId: 'earth',
    tier: 2,
    manaCost: manaCostForTier(2),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [{ target: 'buildingOutput.mine', operation: 'multiply', value: 1.7 }],
    },
  },
  {
    id: 'earth.bulwark',
    circleId: 'earth',
    tier: 3,
    manaCost: burstManaCostForTier(3),
    cooldownSeconds: BALANCE.magic.burstCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'burst',
      durationSeconds: BALANCE.magic.burstDurationSeconds,
      modifiers: [{ target: 'warfare.casualtyRate', operation: 'multiply', value: 0.05 }],
    },
  },
  {
    id: 'earth.terraform',
    circleId: 'earth',
    tier: 4,
    manaCost: manaCostForTier(4),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const escalatingCosts = {
          stone: Math.round(200 * context.state.acres),
          wood: Math.round(120 * context.state.acres),
        }
        if (!canAfford(context.state, escalatingCosts)) {
          context.emit('magic', 'chronicle.terraformNeeds', {
            stone: escalatingCosts.stone,
            wood: escalatingCosts.wood,
          })
          return
        }
        payCosts(context.state, escalatingCosts)
        grantAcres(context.state, 1)
        context.emit('magic', 'chronicle.terraformLifts')
      },
    },
  },
  {
    id: 'earth.livingStone',
    circleId: 'earth',
    tier: 5,
    manaCost: burstManaCostForTier(5),
    cooldownSeconds: BALANCE.magic.burstCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'burst',
      durationSeconds: BALANCE.magic.burstDurationSeconds,
      modifiers: [{ target: 'constructionSpeed', operation: 'multiply', value: 6 }],
    },
  },
  {
    id: 'earth.mountainsHeart',
    circleId: 'earth',
    tier: 6,
    manaCost: manaCostForTier(6),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [
        { target: 'buildingOutput.quarry', operation: 'multiply', value: 2.2 },
        { target: 'buildingOutput.mine', operation: 'multiply', value: 2.2 },
      ],
    },
  },
]

const DARK_SPELLS: readonly SpellDefinition[] = [
  {
    id: 'dark.blight',
    circleId: 'dark',
    tier: 1,
    manaCost: manaCostForTier(1),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'pendingBoost',
      consumeOn: 'expedition',
      modifiers: [{ target: 'warfare.targetDefense', operation: 'multiply', value: 0.65 }],
    },
  },
  {
    id: 'dark.transmute',
    circleId: 'dark',
    tier: 2,
    manaCost: manaCostForTier(2),
    cooldownSeconds: BALANCE.magic.transmuteCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const source = mostAbundantResource(context)
        const amountTaken =
          context.state.resources[source] * BALANCE.magic.transmuteShareOfLargestStore
        if (amountTaken <= 0) {
          context.emit('magic', 'chronicle.ledgerEmpty')
          return
        }
        const efficiency = 0.5 + 0.1 * circleTiersUnlocked(context, 'dark')
        const destinations = RESOURCE_IDS.filter((resourceId) => resourceId !== source)
        const gainedEach = (amountTaken * efficiency) / destinations.length

        addResource(context.state, source, -amountTaken)
        for (const destination of destinations) {
          addResource(context.state, destination, gainedEach)
        }
        context.state.magic.transmutationsPerformed += 1
        context.emit('magic', 'chronicle.transmuted', {
          taken: Math.floor(amountTaken),
          source: contentKeys.resourceName(source),
          gained: Math.floor(gainedEach),
        })
      },
    },
  },
  {
    id: 'dark.sacrifice',
    circleId: 'dark',
    tier: 3,
    manaCost: manaCostForTier(3),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'instant',
      /** Paid from output, so a people who farm nothing are owed no food. */
      apply: (context) => {
        const citizensBefore = Math.max(1, Math.floor(context.state.population))
        const offered = Math.max(
          1,
          Math.floor(context.state.population * BALANCE.magic.sacrificeShareOfPopulation),
        )
        const sacrificed = removeCitizens(context.state, offered)
        if (sacrificed <= 0) {
          context.emit('magic', 'chronicle.sacrificeRefused')
          return
        }

        const production = computeProductionPerSecond(
          context.state,
          context.registry,
          context.modifiers,
        )
        const shareGivenUp = sacrificed / citizensBefore
        const minimumPerHead: ResourceAmounts = BALANCE.magic.sacrificeMinimumPerHead
        const paid: ResourceAmounts = {}
        for (const resourceId of RESOURCE_IDS) {
          const fromOutput =
            production[resourceId] * BALANCE.magic.sacrificeSecondsOfOutput * shareGivenUp
          const floor = (minimumPerHead[resourceId] ?? 0) * sacrificed
          paid[resourceId] = Math.max(fromOutput, floor)
        }

        addResources(context.state, paid)
        context.emit('magic', 'chronicle.sacrificed', { count: sacrificed })
      },
    },
  },
  {
    id: 'dark.barrowLegion',
    circleId: 'dark',
    tier: 4,
    manaCost: burstManaCostForTier(4),
    cooldownSeconds: BALANCE.magic.burstCooldownSeconds,
    /** Soldiers over capacity desert once it fades, and desertion spares an army marching. */
    effect: {
      kind: 'buff',
      shape: 'burst',
      durationSeconds: BALANCE.magic.burstDurationSeconds,
      modifiers: [
        {
          target: 'capacity.army',
          operation: 'multiply',
          value: BALANCE.magic.barrowLegionArmyCapacityMultiplier,
        },
      ],
    },
  },
  {
    id: 'dark.soulHarvest',
    circleId: 'dark',
    tier: 5,
    manaCost: burstManaCostForTier(5),
    cooldownSeconds: BALANCE.magic.burstCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'burst',
      durationSeconds: BALANCE.magic.burstDurationSeconds,
      modifiers: [{ target: 'warfare.plunder', operation: 'multiply', value: 6 }],
    },
  },
  {
    id: 'dark.pactOfHaiAndYah',
    circleId: 'dark',
    tier: 6,
    manaCost: manaCostForTier(6),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    /** The mana price lands harder on a one-circle people: the pool scales with circles studied. */
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [
        { target: 'magic.manaRegen', operation: 'multiply', value: 0 },
        ...RESOURCE_IDS.map((resourceId) => ({
          target: `production.${resourceId}` as const,
          operation: 'multiply' as const,
          value: 2,
        })),
        { target: 'warfare.attackPower', operation: 'multiply', value: 2 },
      ],
    },
  },
]

export const SPELL_DEFINITIONS: readonly SpellDefinition[] = [
  ...FIRE_SPELLS,
  ...AIR_SPELLS,
  ...WATER_SPELLS,
  ...EARTH_SPELLS,
  ...DARK_SPELLS,
]
