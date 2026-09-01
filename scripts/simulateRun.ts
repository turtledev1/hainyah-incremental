/**
 * Plays Hainyah headlessly with a deliberately mediocre strategy and reports how long
 * a run takes. This is how the numbers in `src/game/content/balance.ts` get set.
 *
 * Usage: npm run simulate -- [raceId] [maxDays]
 *
 * SIMULATE_EXPORT_AT_HOURS=48 prints a save from that point, ready to paste into the
 * game's Settings tab — a repeatable way to get a realm of any size for testing.
 */
import { CONTENT_REGISTRY } from '../src/game/content'
import { BALANCE } from '../src/game/content/balance'
import { createInitialGameState } from '../src/game/engine/initialState'
import { exportSaveToText } from '../src/game/persistence/storage'
import { createRandomNumberGenerator } from '../src/game/engine/rng'
import { advanceGameInPlace } from '../src/game/engine/tick'
import type { BuildingId, MagicCircleId, RaceId, ResourceId } from '../src/game/model/ids'
import { RESOURCE_IDS } from '../src/game/model/ids'
import type { GameState } from '../src/game/model/state'
import { buildAscensionStage, checkAscensionRefusal } from '../src/game/systems/ascension'
import { demolishBuilding, queueBuilding } from '../src/game/systems/construction'
import { computeFoodConsumptionPerSecond } from '../src/game/systems/food'
import { freeAcres } from '../src/game/systems/land'
import { castSpell, checkCastRefusal } from '../src/game/systems/magic'
import { gatherByHand } from '../src/game/systems/manualGathering'
import { buildModifierIndexForState } from '../src/game/systems/modifiers'
import { computeProductionPerSecond } from '../src/game/systems/production'
import { capacityOf, workerSlotsTotal } from '../src/game/systems/capacity'
import { totalSoldiers, totalThieves } from '../src/game/systems/stateHelpers'
import { checkHeistRefusal, launchHeist } from '../src/game/systems/thievery'
import { checkUpgradeRefusal, purchaseUpgrade, upgradeCost } from '../src/game/systems/upgrades'
import {
  checkExpeditionRefusal,
  computeAttackPowerEstimate,
  computeTargetDefenseEstimate,
  launchExpedition,
} from '../src/game/systems/warfare'
import { assignWorkers, recruitSoldiers, recruitThieves } from '../src/game/systems/workforce'

const registry = CONTENT_REGISTRY

const DECISION_INTERVAL_SECONDS = 10
/** Snapshot cadence, in minutes; shorten it to inspect the opening. */
const SNAPSHOT_MINUTES = Number(process.env.SIMULATE_SNAPSHOT_MINUTES ?? 24 * 60)
const SIMULATION_STEP_SECONDS = 1
const CLICKS_PER_DECISION_WHILE_TINY = 20
const REQUIRED_POWER_MARGIN = 1.15

/** Tools, then housing, then the barracks that make the first conquest possible. */
const OPENING_BUILD_ORDER: readonly BuildingId[] = [
  'lumberCamp',
  'quarry',
  'house',
  'farm',
  'mine',
  'house',
  'barracks',
  'temple',
  'house',
  'thievesGuild',
]

/** How the strategy wants its acres divided once the opening is done. */
const TARGET_BUILDING_SHARE: Record<BuildingId, number> = {
  house: 0.22,
  farm: 0.13,
  lumberCamp: 0.15,
  quarry: 0.16,
  mine: 0.18,
  barracks: 0.07,
  thievesGuild: 0.03,
  temple: 0.06,
}

function totalBuildings(state: GameState): number {
  return Object.values(state.buildings).reduce((runningTotal, count) => runningTotal + count, 0)
}

/** Building types ordered by how far each is below its intended share of the realm. */
function buildingsByNeed(state: GameState): readonly BuildingId[] {
  const built = Math.max(1, totalBuildings(state))
  return (Object.entries(TARGET_BUILDING_SHARE) as [BuildingId, number][])
    .map(([buildingId, share]) => ({
      buildingId,
      deficit: share - state.buildings[buildingId] / built,
    }))
    .sort((left, right) => right.deficit - left.deficit)
    .map((entry) => entry.buildingId)
}

function gatherByHandForOpening(state: GameState): void {
  const modifiers = buildModifierIndexForState(state, registry)
  for (let click = 0; click < CLICKS_PER_DECISION_WHILE_TINY; click += 1) {
    gatherByHand(state, registry, modifiers, 'wood')
    gatherByHand(state, registry, modifiers, 'stone')
    gatherByHand(state, registry, modifiers, 'food')
  }
}

/** Share of the non-military workforce each kind of work should get once fed. */
const TARGET_WORKER_SHARE: readonly (readonly [BuildingId, number])[] = [
  ['mine', 0.22],
  ['quarry', 0.24],
  ['lumberCamp', 0.24],
  ['temple', 0.14],
  ['barracks', 0.11],
  ['thievesGuild', 0.05],
]

/** Fraction of the workforce held back each pass so the army can be recruited. */
const WORKFORCE_RESERVED_FOR_RECRUITMENT = 0.3

function foodPerFarmWorkerPerSecond(state: GameState): number {
  const modifiers = buildModifierIndexForState(state, registry)
  const probe = { ...state, workerAssignments: { ...state.workerAssignments, farm: 1 }, buildings: { ...state.buildings, farm: Math.max(1, state.buildings.farm) } }
  return computeProductionPerSecond(probe, registry, modifiers).food
}

/** Places everyone again from scratch, as a player would by hand every few minutes. */
function rebalanceWorkers(state: GameState): void {
  for (const building of registry.buildings) {
    state.workerAssignments[building.id] = 0
  }

  // Capacity is zero until the barracks is staffed, so this keys off the building.
  const hasSomewhereToPutRecruits = state.buildings.barracks > 0 || state.buildings.thievesGuild > 0

  const citizens = Math.floor(state.population)
  const workforce = Math.max(0, citizens - totalSoldiers(state) - totalThieves(state))
  // Reserving for an army that cannot yet be raised would leave the mines empty.
  const placeable = hasSomewhereToPutRecruits
    ? Math.max(0, workforce - Math.floor(workforce * WORKFORCE_RESERVED_FOR_RECRUITMENT))
    : workforce
  if (placeable <= 0) {
    return
  }

  const consumptionPerSecond = computeFoodConsumptionPerSecond(
    state,
    buildModifierIndexForState(state, registry),
  )
  const perFarmer = foodPerFarmWorkerPerSecond(state)
  const farmersWanted =
    consumptionPerSecond > 0 && perFarmer > 0
      ? Math.min(placeable, Math.ceil((consumptionPerSecond / perFarmer) * 1.3))
      : 0
  const farmersPlaced = assignWorkers(state, registry, 'farm', farmersWanted)

  let remaining = placeable - farmersPlaced

  // One hand each first, so a tiny realm still has someone down every mine.
  for (const [buildingId] of TARGET_WORKER_SHARE) {
    if (remaining <= 0) {
      return
    }
    remaining -= assignWorkers(state, registry, buildingId, 1)
  }

  for (const [buildingId, share] of TARGET_WORKER_SHARE) {
    if (remaining <= 0) {
      return
    }
    remaining -= assignWorkers(state, registry, buildingId, Math.ceil(placeable * share))
  }

  for (const building of registry.buildings) {
    if (remaining <= 0) {
      return
    }
    remaining -= assignWorkers(state, registry, building.id, remaining)
  }
}

function fillArmyAndGuild(state: GameState): void {
  const modifiers = buildModifierIndexForState(state, registry)
  const armyRoom = capacityOf(state, registry, modifiers, 'army') - totalSoldiers(state)
  if (armyRoom > 0) {
    recruitSoldiers(state, registry, modifiers, armyRoom)
  }
  const guildRoom = capacityOf(state, registry, modifiers, 'thieves') - totalThieves(state)
  if (guildRoom > 0) {
    recruitThieves(state, registry, modifiers, guildRoom)
  }
}

function buyWhateverIsAffordable(state: GameState): void {
  const affordable = registry.upgrades
    .filter((upgrade) => checkUpgradeRefusal(state, registry, upgrade.id) === undefined)
    .sort((left, right) => cheapestFirst(state, left, right))

  for (const upgrade of affordable) {
    if (checkUpgradeRefusal(state, registry, upgrade.id) === undefined) {
      purchaseUpgrade(state, registry, upgrade.id)
    }
  }
}

function totalCost(state: GameState, upgrade: Parameters<typeof upgradeCost>[1]): number {
  const cost = upgradeCost(state, upgrade)
  return RESOURCE_IDS.reduce((runningTotal, resourceId) => runningTotal + (cost[resourceId] ?? 0), 0)
}

function cheapestFirst(
  state: GameState,
  left: Parameters<typeof upgradeCost>[1],
  right: Parameters<typeof upgradeCost>[1],
): number {
  return totalCost(state, left) - totalCost(state, right)
}

/** Feeding your own citizens to Yah on a timer is not what a careful player does. */
const SPELLS_THE_STRATEGY_WILL_NOT_CAST: readonly string[] = ['dark.sacrifice']

/** Transmute trades at a loss below the deepest tiers, so it waits for a real shortage. */
function isWorthCasting(state: GameState, spellId: string): boolean {
  if (spellId !== 'dark.transmute') {
    return true
  }
  const stores = RESOURCE_IDS.map((resourceId) => state.resources[resourceId])
  return Math.min(...stores) < Math.max(...stores) * 0.2
}

function castWhateverHelps(state: GameState): void {
  const random = createRandomNumberGenerator(state)
  for (const spell of registry.spells) {
    if (SPELLS_THE_STRATEGY_WILL_NOT_CAST.includes(spell.id)) {
      continue
    }
    if (
      isWorthCasting(state, spell.id) &&
      checkCastRefusal(state, registry, spell.id) === undefined
    ) {
      castSpell(state, registry, spell.id, random)
    }
  }
}

/** Sends everything at home against the largest place it can comfortably beat. */
function attackWhatCanBeBeaten(state: GameState): void {
  const byDescendingTier = [...registry.conquestTargets].sort((left, right) => right.tier - left.tier)
  const soldiers = state.soldiersAtHome

  for (const target of byDescendingTier) {
    if (checkExpeditionRefusal(state, registry, target.id, soldiers) !== undefined) {
      continue
    }
    const power = computeAttackPowerEstimate(state, registry, soldiers, true)
    const defense = computeTargetDefenseEstimate(state, registry, target.id, true)
    if (power >= defense * REQUIRED_POWER_MARGIN) {
      launchExpedition(state, registry, target.id, soldiers)
      return
    }
  }
}

function runHeists(state: GameState): void {
  const byDescendingTier = [...registry.thieveryTargets].sort((left, right) => right.tier - left.tier)
  for (const target of byDescendingTier) {
    while (checkHeistRefusal(state, registry, target.id) === undefined) {
      launchHeist(state, registry, target.id)
    }
  }
}

function pourIntoTheTemple(state: GameState): void {
  while (checkAscensionRefusal(state, registry) === undefined) {
    buildAscensionStage(state, registry)
  }
}

/** Most-needed first: taking whatever is cheapest fills every acre with houses. */
function buildSomething(state: GameState): void {
  const modifiers = buildModifierIndexForState(state, registry)
  const built = totalBuildings(state)

  if (freeAcres(state, registry) <= 0) {
    escapeAnAcreDeadlock(state, modifiers)
    return
  }

  // Counting what is already ordered as well as what stands, or the same step is
  // queued over and over and the plan never advances.
  const openingStep = OPENING_BUILD_ORDER[built + state.constructionQueue.length]
  if (openingStep !== undefined) {
    queueBuilding(state, registry, modifiers, openingStep)
    return
  }

  for (const buildingId of buildingsByNeed(state)) {
    if (queueBuilding(state, registry, modifiers, buildingId) === undefined) {
      return
    }
  }
}

/** Every acre full and no barracks is the one case where razing is the only way out. */
function escapeAnAcreDeadlock(
  state: GameState,
  modifiers: ReturnType<typeof buildModifierIndexForState>,
): void {
  if (state.buildings.barracks > 0) {
    return
  }
  const mostOverbuilt = [...buildingsByNeed(state)]
    .reverse()
    .find((buildingId) => state.buildings[buildingId] > 1)
  if (mostOverbuilt !== undefined) {
    demolishBuilding(state, registry, modifiers, mostOverbuilt)
  }
}

interface DailySnapshot {
  readonly day: number
  readonly acres: number
  readonly population: number
  readonly soldiers: number
  readonly stagesComplete: number
  readonly resources: Record<ResourceId, number>
  readonly buildings: Record<BuildingId, number>
}

function simulate(
  raceId: RaceId,
  circleIds: readonly MagicCircleId[],
  maximumDays: number,
  exportAtHours = 0,
) {
  const state = createInitialGameState({
    raceId,
    chosenMagicCircleIds: circleIds,
    startedAtEpochMs: 0,
    rngSeed: 987_654_321,
  })

  let exportedSave: string | undefined
  const stageCompletionSeconds: number[] = []
  const dailySnapshots: DailySnapshot[] = []
  const maximumSeconds = maximumDays * 24 * 60 * 60
  let nextDecisionAtSeconds = 0
  let nextSnapshotAtSeconds = SNAPSHOT_MINUTES * 60
  let stagesRecorded = 0

  while (state.elapsedSeconds < maximumSeconds && !state.hasAscended) {
    advanceGameInPlace(state, SIMULATION_STEP_SECONDS, registry)

    if (state.elapsedSeconds >= nextDecisionAtSeconds) {
      nextDecisionAtSeconds = state.elapsedSeconds + DECISION_INTERVAL_SECONDS

      if (state.resources.wood < 400 || state.resources.stone < 400) {
        gatherByHandForOpening(state)
      }
      buildSomething(state)
      rebalanceWorkers(state)
      fillArmyAndGuild(state)
      buyWhateverIsAffordable(state)
      castWhateverHelps(state)
      attackWhatCanBeBeaten(state)
      runHeists(state)
      pourIntoTheTemple(state)
    }

    while (state.completedAscensionStages > stagesRecorded) {
      stageCompletionSeconds.push(state.elapsedSeconds)
      stagesRecorded += 1
    }

    if (exportAtHours > 0 && exportedSave === undefined && state.elapsedSeconds >= exportAtHours * 3600) {
      exportedSave = exportSaveToText(state)
    }

    if (state.elapsedSeconds >= nextSnapshotAtSeconds) {
      nextSnapshotAtSeconds += SNAPSHOT_MINUTES * 60
      dailySnapshots.push({
        day: Math.round((state.elapsedSeconds / (SNAPSHOT_MINUTES * 60)) * 10) / 10,
        acres: state.acres,
        population: Math.floor(state.population),
        soldiers: totalSoldiers(state),
        stagesComplete: state.completedAscensionStages,
        resources: { ...state.resources },
        buildings: { ...state.buildings },
      })
    }
  }

  return { state, stageCompletionSeconds, dailySnapshots, exportedSave: exportedSave ?? exportSaveToText(state) }
}

function formatHours(seconds: number): string {
  return `${(seconds / 3600).toFixed(1)}h`
}

function formatCompact(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`
  return value.toFixed(0)
}

const raceArgument = (process.argv[2] as RaceId | undefined) ?? 'human'
const maximumDays = Number(process.argv[3] ?? 6)
const circleAccess = registry.racesById.get(raceArgument)!.magicCircleAccess
const chosenCircles = [
  ...circleAccess.grantedCircleIds,
  ...circleAccess.choosableCircleIds.slice(0, circleAccess.chosenCircleCount),
]

console.log(`Simulating ${raceArgument} with ${chosenCircles.join(', ')} for up to ${maximumDays} days.`)
console.log(`Offline credit cap: ${formatHours(BALANCE.offline.maximumCreditedSeconds)} (not used here — this is continuous play).`)

const exportAtHours = Number(process.env.SIMULATE_EXPORT_AT_HOURS ?? 0)

const { state, stageCompletionSeconds, dailySnapshots, exportedSave } = simulate(
  raceArgument,
  chosenCircles,
  maximumDays,
  exportAtHours,
)

console.log('\nDay-by-day')
console.log('day  acres  citizens  army   stages  food     wood     stone    gold     buildings')
for (const snapshot of dailySnapshots) {
  console.log(
    [
      String(snapshot.day).padEnd(4),
      String(snapshot.acres).padEnd(6),
      String(snapshot.population).padEnd(9),
      String(snapshot.soldiers).padEnd(6),
      String(snapshot.stagesComplete).padEnd(7),
      formatCompact(snapshot.resources.food).padEnd(8),
      formatCompact(snapshot.resources.wood).padEnd(8),
      formatCompact(snapshot.resources.stone).padEnd(8),
      formatCompact(snapshot.resources.gold).padEnd(8),
      Object.entries(snapshot.buildings)
        .filter(([, count]) => count > 0)
        .map(([buildingId, count]) => `${buildingId}:${count}`)
        .join(' '),
    ].join(' '),
  )
}

console.log('\nAscension stages')
registry.ascensionStages.forEach((stage, index) => {
  const completedAt = stageCompletionSeconds[index]
  console.log(
    `  ${stage.index}. ${stage.name.padEnd(18)} ${
      completedAt === undefined ? 'not reached' : formatHours(completedAt)
    }`,
  )
})

console.log('')
if (state.hasAscended) {
  console.log(`ASCENDED after ${formatHours(state.elapsedSeconds)} of continuous play.`)
} else {
  console.log(
    `Not ascended within ${maximumDays} days: reached stage ${state.completedAscensionStages}/8 at ${formatHours(state.elapsedSeconds)}.`,
  )
}
console.log(
  `Final: ${state.acres} acres, ${Math.floor(state.population)} citizens, ${state.statistics.battlesWon} battles won, ${state.statistics.heistsSucceeded} heists.`,
)

const finalProduction = computeProductionPerSecond(
  state,
  registry,
  buildModifierIndexForState(state, registry),
)
console.log(
  `Final production per hour: ${RESOURCE_IDS.map(
    (resourceId) => `${resourceId} ${formatCompact(finalProduction[resourceId] * 3600)}`,
  ).join(', ')}`,
)

if (exportAtHours > 0) {
  console.log(`\nSave from ${formatHours(exportAtHours * 3600)} in, for pasting into Settings:\n`)
  console.log(exportedSave)
}
