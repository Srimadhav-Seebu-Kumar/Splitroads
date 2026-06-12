/**
 * Stat display: headline number + label + optional delta.
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
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className="num text-2xl font-semibold text-ink">{value}</p>
      {delta !== undefined && (
        <p className={cn('num text-xs', deltaPositive ? 'text-gain' : 'text-cost')}>
          {delta}
        </p>
      )}
      {subtext && <p className="text-xs text-faint">{subtext}</p>}
    </div>
  )
}
