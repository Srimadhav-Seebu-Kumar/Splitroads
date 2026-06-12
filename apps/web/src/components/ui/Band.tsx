'use client'
/**
 * Band: the signature distribution primitive.
 * Renders p05-p95 as a translucent ribbon, p50 as a solid tick,
 * on a fixed R-domain axis with a zero line. Uncertainty is rendered,
 * never footnoted (design principle 2).
 */
import { useId } from 'react'
import { cn } from '@/lib/utils'

type BandProps = {
  p05: number
  p50: number
  p95: number
  /** Domain in R units; defaults to symmetric fit around the band */
  domain?: [number, number]
  className?: string
  /** Compact = 20px tall strip for rows; full = 36px with axis labels */
  size?: 'compact' | 'full'
}

export function Band({ p05, p50, p95, domain, className, size = 'full' }: BandProps) {
  const gradId = useId()
  const [lo, hi] = domain ?? symmetricDomain(p05, p95)
  const W = 100
  const x = (v: number) => Math.max(0, Math.min(W, ((v - lo) / (hi - lo)) * W))

  const isGain = p50 >= 0
  const color = isGain ? 'var(--gain)' : 'var(--cost)'
  const h = size === 'compact' ? 20 : 36
  const bandY = size === 'compact' ? 4 : 8
  const bandH = h - bandY * 2

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" className="block w-full" style={{ height: h }} aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.06" />
            <stop offset="50%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.06" />
          </linearGradient>
        </defs>
        {/* zero line */}
        <line x1={x(0)} y1={0} x2={x(0)} y2={h} stroke="var(--line-strong)" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        {/* p05-p95 ribbon */}
        <rect x={x(p05)} y={bandY} width={Math.max(0.5, x(p95) - x(p05))} height={bandH} rx={2} fill={`url(#${gradId})`} />
        <rect x={x(p05)} y={bandY} width={Math.max(0.5, x(p95) - x(p05))} height={bandH} rx={2} fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {/* median tick */}
        <line x1={x(p50)} y1={bandY - 2} x2={x(p50)} y2={bandY + bandH + 2} stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {size === 'full' && (
        <div className="num mt-1 flex justify-between text-[10px] text-faint" aria-hidden>
          <span>{fmt(lo)}</span>
          <span>0</span>
          <span>{fmt(hi)}</span>
        </div>
      )}
      <span className="sr-only">
        Distribution: 5th percentile {fmt(p05)}, median {fmt(p50)}, 95th percentile {fmt(p95)}
      </span>
    </div>
  )
}

function symmetricDomain(p05: number, p95: number): [number, number] {
  const m = Math.max(Math.abs(p05), Math.abs(p95), 1) * 1.25
  return [-m, m]
}

function fmt(v: number) {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}R`
}

/** Evidence chip: mono microtype attached to every claim (DESIGN.md) */
export function EvidenceChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px] tracking-tight text-faint',
      className
    )}>
      {children}
    </span>
  )
}
