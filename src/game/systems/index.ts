import type { GameSystem } from '../model/tick'
import { advanceConstruction } from './construction'
import { consumeFood } from './food'
import { advanceMagic } from './magic'
import { growPopulation } from './population'
import { produceResources } from './production'
import { advanceHeists } from './thievery'
import { advanceExpeditions } from './warfare'
import { revealUpgrades } from './upgrades'
import { reconcileWorkforce } from './workforce'

/**
 * Order matters: produced before eaten, the dead counted before anyone is born, and
 * roles reconciled last so a tick never ends with more jobs filled than citizens.
 */
export const SYSTEM_TICK_ORDER: readonly GameSystem[] = [
  produceResources,
  consumeFood,
  growPopulation,
  advanceMagic,
  advanceConstruction,
  advanceExpeditions,
  advanceHeists,
  revealUpgrades,
  reconcileWorkforce,
]
