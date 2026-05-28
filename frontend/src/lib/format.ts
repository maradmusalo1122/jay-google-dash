/**
 * Lightweight date formatting helpers — no date library yet at this scale.
 * Switch to date-fns later if logic grows.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatMonthYear(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const future = diffMs < 0
  const abs = Math.abs(diffMs)
  const mins = Math.round(abs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${future ? 'in ' : ''}${mins}m${future ? '' : ' ago'}`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${future ? 'in ' : ''}${hours}h${future ? '' : ' ago'}`
  const days = Math.round(hours / 24)
  if (days < 7) return `${future ? 'in ' : ''}${days}d${future ? '' : ' ago'}`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${future ? 'in ' : ''}${weeks}w${future ? '' : ' ago'}`
  return formatShortDate(iso)
}

/** Days between now and `iso` (positive = future, negative = past). */
export function daysFromNow(iso: string, now: Date = new Date()): number {
  const then = new Date(iso)
  return Math.ceil((then.getTime() - now.getTime()) / 86_400_000)
}

export function countdownLabel(iso: string, now: Date = new Date()): string {
  const days = daysFromNow(iso, now)
  if (days < 0) return 'event passed'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 14) return `in ${days} days`
  if (days < 60) return `in ${Math.round(days / 7)} weeks`
  return formatShortDate(iso)
}

/**
 * Human name list with smart grammar.
 *   1 → "Aditya"
 *   2 → "Aditya & Tina"
 *   3 → "Aditya, Tina & Jasmine"
 *   4+ → "Aditya, Tina, Jasmine +N"   (where N = total - 3)
 */
export function formatNameList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} & ${names[1]}`
  if (names.length === 3) return `${names[0]}, ${names[1]} & ${names[2]}`
  return `${names.slice(0, 3).join(', ')} +${names.length - 3}`
}
