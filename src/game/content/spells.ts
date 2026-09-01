import type { SpellDefinition, SpellEffectContext } from '../model/content'
import type { ResourceId } from '../model/ids'
import { RESOURCE_IDS } from '../model/ids'
import { capacityOf } from '../systems/capacity'
import { grantAcres } from '../systems/land'
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

function scarcestResource(context: SpellEffectContext): ResourceId {
  return RESOURCE_IDS.reduce((worst, candidate) =>
    context.state.resources[candidate] < context.state.resources[worst] ? candidate : worst,
  )
}

const FIRE_SPELLS: readonly SpellDefinition[] = [
  {
    id: 'fire.sunlight',
    circleId: 'fire',
    tier: 1,
    name: 'Sunlight',
    description:
      'Hai leans closer, and the farms yield 60% more.',
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
    name: 'Forge Fire',
    description:
      'Smelters run white-hot, and the mines yield 70% more.',
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
    name: 'Immolate',
    description:
      'Your soldiers go in burning. Attack power trebles while it lasts — send them now.',
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
    name: 'Wildfire',
    description:
      'Sets the next target’s fields alight before you arrive: its defence −40%.',
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
    name: 'Solar Zenith',
    description:
      'A noon that will not end. Farms and mines both yield 120% more.',
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
    name: 'Phoenix Pyre',
    description: 'Half of those who fell in your last battle walk out of the ashes.',
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
    name: 'Windmill',
    description:
      'A steady wind on the sails, and the farms yield 60% more.',
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
    name: 'Tailwind',
    description:
      'Armies and thieves move 80% faster.',
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
    name: 'Haste',
    description:
      'Every hand moves quicker: all production +50%.',
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
    name: 'Whispering Winds',
    description:
      'The wind tells your thieves where the guards are: the next heist is twice as likely to succeed.',
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
    name: 'Storm Front',
    description:
      'One army rides the storm: double march speed and −25% enemy defence.',
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
    name: 'Timeless Gale',
    description:
      'The wind holds its breath: all production doubled.',
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
    name: 'Irrigation',
    description:
      'Channels run full, and the farms yield 70% more.',
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
    name: 'Cleansing Rain',
    description: 'Sickness washes out of the streets and the empty houses fill.',
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
    name: 'Deep Well',
    description:
      'Food +45%, and the houses hold a quarter more.',
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
    name: 'Tide of Plenty',
    description: 'The granary floods with fish: stored food doubles, up to a limit.',
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
    name: 'Mist Veil',
    description:
      'Your next heist runs under fog: casualties −85%.',
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
    name: 'Wellspring',
    description:
      'A spring that does not fail: farms doubled.',
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
    name: 'Stoneshaping',
    description:
      'The face splits where you ask it to: quarries +70%.',
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
    name: 'Veins of Ore',
    description:
      'Gold shows itself in the rock: mines +70%.',
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
    name: 'Bulwark',
    description:
      'Stone closes over your ranks: they lose almost nobody. March while it holds.',
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
    name: 'Terraform',
    description:
      'Raises one new acre out of the sea, paid for in stone and wood that rise with every acre you already hold.',
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
    name: 'Living Stone',
    description:
      'The walls raise themselves — six times the pace, for ten minutes.',
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
    name: "Mountain's Heart",
    description:
      'Quarries and mines both yield 120% more.',
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
    name: 'Blight',
    description:
      'Rot in their stores before the first spear is thrown: the next target’s defence −35%.',
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
    name: 'Transmute',
    description:
      'Yah keeps a ledger: a tenth of your largest store becomes the resource you have least of. A deeper circle loses less in the trade, and at the deepest it gains.',
    manaCost: manaCostForTier(2),
    cooldownSeconds: BALANCE.magic.transmuteCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const source = mostAbundantResource(context)
        const destination = scarcestResource(context)
        if (source === destination) {
          context.emit('magic', 'chronicle.ledgerBalanced')
          return
        }
        const amountTaken = context.state.resources[source] * 0.1
        if (amountTaken <= 0) {
          context.emit('magic', 'chronicle.ledgerEmpty')
          return
        }
        const efficiency = 0.5 + 0.1 * circleTiersUnlocked(context, 'dark')
        addResource(context.state, source, -amountTaken)
        addResource(context.state, destination, amountTaken * efficiency)
        context.state.magic.transmutationsPerformed += 1
        context.emit('magic', 'chronicle.transmuted', {
          taken: Math.floor(amountTaken),
          source: context.registry.resourcesById.get(source)?.name ?? source,
          gained: Math.floor(amountTaken * efficiency),
          destination: context.registry.resourcesById.get(destination)?.name ?? destination,
        })
      },
    },
  },
  {
    id: 'dark.sacrifice',
    circleId: 'dark',
    tier: 3,
    name: 'Sacrifice',
    description:
      'A tenth of your people are given to Yah, and what they were worth comes back as goods.',
    manaCost: manaCostForTier(3),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const offered = Math.max(1, Math.floor(context.state.population * 0.1))
        const sacrificed = removeCitizens(context.state, offered)
        if (sacrificed <= 0) {
          context.emit('magic', 'chronicle.sacrificeRefused')
          return
        }
        addResources(context.state, {
          food: sacrificed * 120,
          wood: sacrificed * 90,
          stone: sacrificed * 90,
          gold: sacrificed * 45,
        })
        context.emit('magic', 'chronicle.sacrificed', { count: sacrificed })
      },
    },
  },
  {
    id: 'dark.raiseThrall',
    circleId: 'dark',
    tier: 4,
    name: 'Raise Thrall',
    description: 'Your last battle’s dead stand up again as soldiers, and they need no house.',
    manaCost: manaCostForTier(4),
    cooldownSeconds: BALANCE.magic.instantCooldownSeconds,
    effect: {
      kind: 'instant',
      apply: (context) => {
        const armyCapacity = capacityOf(context.state, context.registry, context.modifiers, 'army')
        const currentSoldiers =
          context.state.soldiersAtHome +
          context.state.expeditions.reduce((total, expedition) => total + expedition.soldiers, 0)
        const room = Math.max(0, armyCapacity - currentSoldiers)
        const raised = Math.min(room, context.state.lastBattleSoldiersLost)
        if (raised <= 0) {
          context.emit('magic', 'chronicle.raiseThrallSilent')
          return
        }
        context.state.population += raised
        context.state.soldiersAtHome += raised
        context.state.lastBattleSoldiersLost -= raised
        context.emit('magic', 'chronicle.raiseThrallCalls', { count: raised })
      },
    },
  },
  {
    id: 'dark.soulHarvest',
    circleId: 'dark',
    tier: 5,
    name: 'Soul Harvest',
    description:
      'Every enemy who falls pays for it: plunder is worth six times as much.',
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
    name: 'Pact of Hai and Yah',
    description:
      'Both gods march with every army you send: attack +80%, and three losses in four are spared.',
    manaCost: manaCostForTier(6),
    cooldownSeconds: BALANCE.magic.sustainedCooldownSeconds,
    effect: {
      kind: 'buff',
      shape: 'sustained',
      durationSeconds: BALANCE.magic.sustainedDurationSeconds,
      modifiers: [
        { target: 'warfare.attackPower', operation: 'multiply', value: 1.8 },
        { target: 'warfare.casualtyRate', operation: 'multiply', value: 0.25 },
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
