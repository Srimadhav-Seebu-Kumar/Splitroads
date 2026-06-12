/**
 * Shared UI utilities — one import for all component helpers.
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format R-multiple for display */
export function formatR(r: number | string | null, precision = 2): string {
  if (r === null || r === undefined) return '—'
  const n = typeof r === 'string' ? parseFloat(r) : r
  if (isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(precision)}R`
}

/** Format PnL with currency sign */
export function formatPnl(pnl: number | string | null, currency = 'USD'): string {
  if (pnl === null || pnl === undefined) return '—'
  const n = typeof pnl === 'string' ? parseFloat(pnl) : pnl
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, signDisplay: 'always' }).format(n)
}

/** Format a date consistently */
export function formatDate(d: Date | string, fmt = 'MMM d, yyyy'): string {
  return format(new Date(d), fmt)
}

/** "3 hours ago" */
export function timeAgo(d: Date | string): string {
  return formatDistanceToNow(new Date(d), { addSuffix: true })
}

/** R-multiple color class */
export function rColor(r: number | string | null): string {
  if (r === null) return 'text-zinc-400'
  const n = typeof r === 'string' ? parseFloat(r) : r
  if (isNaN(n)) return 'text-zinc-400'
  if (n > 0) return 'text-teal-400'
  if (n < 0) return 'text-amber-400'
  return 'text-zinc-400'
}

/** Phantom R confidence band label */
export function phantomBand(p05: number | null, p95: number | null): string {
  if (p05 === null || p95 === null) return '—'
  return `${formatR(p05)} to ${formatR(p95)}`
}
