import { describe, expect, it } from 'vitest'
import { formatDuration, formatNumber, formatPerHour, formatRate, formatStockpile } from './format'

describe('a stockpile on screen', () => {
  it('shows whole units, whatever fraction has accrued', () => {
    expect(formatStockpile(8.6)).toBe('8')
    expect(formatStockpile(50.4)).toBe('50')
    expect(formatStockpile(0.9)).toBe('0')
  })

  it('never claims more than the player can actually spend', () => {
    expect(formatStockpile(9.99)).toBe('9')
  })

  it('still reads compactly once the piles are large', () => {
    expect(formatStockpile(12_500.7)).toBe('12.5k')
    expect(formatStockpile(3_400_000)).toBe('3.40M')
  })

  it('does not overstate a loss reported for time away', () => {
    expect(formatStockpile(-140_000.9)).toBe('-140k')
  })
})

describe('a rate on screen', () => {
  it('keeps the decimals that make a slow trickle legible', () => {
    expect(formatRate(0.28)).toBe('+0.3/s')
    expect(formatRate(-0.1)).toBe('-0.1/s')
  })

  it('marks a positive rate with a sign so it reads as income', () => {
    expect(formatRate(12)).toBe('+12/s')
  })
})

describe('formatting numbers', () => {
  it('keeps small fractions visible, since they matter for rates', () => {
    expect(formatNumber(2.5)).toBe('2.5')
  })

  it('drops decimals once the number is large enough not to need them', () => {
    expect(formatNumber(420)).toBe('420')
    expect(formatNumber(1_000)).toBe('1.00k')
  })
})

describe('formatting a duration', () => {
  it('reads in the largest useful unit', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(90)).toBe('1m 30s')
    expect(formatDuration(3_700)).toBe('1h 1m')
    expect(formatDuration(90_000)).toBe('1d 1h')
  })

  it('says never rather than showing infinity to a player', () => {
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('never')
  })
})

describe('durations that land on a round unit', () => {
  it('leaves off a component that is zero', () => {
    expect(formatDuration(120)).toBe('2m')
    expect(formatDuration(7_200)).toBe('2h')
    expect(formatDuration(172_800)).toBe('2d')
  })

  it('still shows the remainder when there is one', () => {
    expect(formatDuration(5_400)).toBe('1h 30m')
    expect(formatDuration(125)).toBe('2m 5s')
  })
})

describe('a slow rate', () => {
  it('reads per hour, where per second would round away to nothing', () => {
    expect(formatPerHour(0.02)).toBe('72/h')
    expect(formatRate(0.02)).toBe('+0.0/s')
  })
})

describe('numbers past the named magnitudes', () => {
  /** The suffix list used to run out and print nonsense like 4984927Qi. */
  it('switches to exponential rather than piling digits onto the last suffix', () => {
    expect(formatNumber(4.98e24)).toBe('4.98e24')
    expect(formatNumber(1e30)).toBe('1.00e30')
  })

  it('still uses a suffix while one is familiar', () => {
    expect(formatNumber(4.98e9)).toBe('4.98B')
    expect(formatNumber(2.5e12)).toBe('2.50T')
    expect(formatNumber(2.5e15)).toBe('2.50e15')
  })

  it('keeps the sign on an enormous negative', () => {
    expect(formatNumber(-4.98e24)).toBe('-4.98e24')
  })
})
