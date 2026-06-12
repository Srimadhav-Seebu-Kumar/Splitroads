/**
 * Stat display — headline number + label + optional delta.
 * Used across the Today dashboard and phantom stats.
 * Every number earns its pixels (design principle).
 */
import { cn } from '@/lib/utils'

type StatProps = {
  label: string
  value: string | number
  delta?: string | undefined
  deltaPositive?: boolean | undefined
  subtext?: string | undefined
  className?: string | undefined
}

export function Stat({ label, value, delta, deltaPositive, subtext, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-zinc-100">{value}</p>
      {delta !== undefined && (
        <p className={cn('text-xs tabular-nums', deltaPositive ? 'text-teal-400' : 'text-amber-400')}>
          {delta}
        </p>
      )}
      {subtext && <p className="text-xs text-zinc-600">{subtext}</p>}
    </div>
  )
}
