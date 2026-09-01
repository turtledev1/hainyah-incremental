import type { TFunction } from 'i18next'
import { contentKeys } from '../i18n/contentKeys'
import type { ResourceAmounts, ResourceId } from '../game/model/ids'

/** Stops at trillions: past that a made-up suffix is less legible than an exponent. */
const MAGNITUDE_SUFFIXES = ['', 'k', 'M', 'B', 'T'] as const

/** Idle games reach absurd numbers quickly; four significant characters is plenty. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '∞'
  }
  const sign = value < 0 ? '-' : ''
  const magnitudeValue = Math.abs(value)

  if (magnitudeValue < 1000) {
    const decimals = magnitudeValue < 10 && !Number.isInteger(magnitudeValue) ? 1 : 0
    return `${sign}${magnitudeValue.toFixed(decimals)}`
  }

  const suffixIndex = Math.floor(Math.log10(magnitudeValue) / 3)
  if (suffixIndex >= MAGNITUDE_SUFFIXES.length) {
    // Past the named magnitudes, a suffix stops meaning anything: 4984927Qi is noise.
    return `${sign}${magnitudeValue.toExponential(2).replace('e+', 'e')}`
  }

  const scaled = magnitudeValue / Math.pow(1000, suffixIndex)
  const decimals = scaled < 10 ? 2 : scaled < 100 ? 1 : 0
  return `${sign}${scaled.toFixed(decimals)}${MAGNITUDE_SUFFIXES[suffixIndex]}`
}

/** Truncates: 9.7 stone must not read as 10 while a 10-stone building is refused. */
export function formatStockpile(value: number): string {
  return formatNumber(Math.trunc(value))
}

export function formatRate(perSecond: number): string {
  const sign = perSecond > 0 ? '+' : ''
  return `${sign}${formatNumber(perSecond)}/s`
}

/** A rate slow enough that a per-second figure rounds to nothing reads better per hour. */
export function formatPerHour(perSecond: number): string {
  return `${formatNumber(perSecond * 3600)}/h`
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) {
    return 'never'
  }
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return seconds % 60 === 0 ? `${minutes}m` : `${minutes}m ${seconds % 60}s`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return minutes % 60 === 0 ? `${hours}h` : `${hours}h ${minutes % 60}m`
  }
  const days = Math.floor(hours / 24)
  return hours % 24 === 0 ? `${days}d` : `${days}d ${hours % 24}h`
}

export function formatPercentage(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

export function amountEntries(amounts: ResourceAmounts): readonly [ResourceId, number][] {
  return Object.entries(amounts)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([resourceId, amount]) => [resourceId as ResourceId, amount ?? 0])
}

export function formatAmounts(amounts: ResourceAmounts, translate: TFunction): string {
  return amountEntries(amounts)
    .map(
      ([resourceId, amount]) =>
        `${formatNumber(amount)} ${translate(contentKeys.resourceName(resourceId))}`,
    )
    .join(', ')
}
