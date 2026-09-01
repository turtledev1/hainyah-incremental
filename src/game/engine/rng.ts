import type { GameState } from '../model/state'

/** The cursor lives in the save, so catch-up and tests replay the same rolls. */
export function nextRandomNumber(state: GameState): number {
  state.rngCursor = (state.rngCursor + 0x6d2b79f5) | 0
  let mixed = state.rngCursor
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
}

export function createRandomNumberGenerator(state: GameState): () => number {
  return () => nextRandomNumber(state)
}

export function randomBetween(random: () => number, minimum: number, maximum: number): number {
  return minimum + random() * (maximum - minimum)
}

export function createRandomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) | 0
}
