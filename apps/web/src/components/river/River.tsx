'use client'
/**
 * The River of Forks: the centerpiece surface.
 * Composes trades (roads taken) and phantoms (roads not taken) into
 * one flowing visualization. Hover a fork to read it; click to travel.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatR, formatDate } from '@/lib/utils'
import { RiverFallback } from './RiverFallback'
import type { RiverFork } from './layout'

const PHANTOM_LABELS: Record<string, string> = {
  ABANDONED_ENTRY: 'Abandoned entry',
  PREMATURE_EXIT: 'Early exit',
  DELAYED_ENTRY: 'Delayed entry',
  CONVICTION: 'Conviction gap',
  POSITION_SIZE: 'Size phantom',
  STOP_PLACEMENT: 'Stop phantom',
}

type Hover = { fork: RiverFork; x: number; y: number } | null

/** Decorative pre-data river: deterministic synthetic forks, no numbers shown. */
export function placeholderForks(): RiverFork[] {
  const now = Date.now()
  const out: RiverFork[] = []
  for (let i = 0; i < 14; i++) {
    const seed = Math.sin(i * 12.989) * 43758.545
    const f = seed - Math.floor(seed)
    out.push({
      id: `placeholder-${i}`,
      kind: f > 0.45 ? 'phantom' : 'trade',
      at: now - (14 - i) * 43200000 + f * 9000000,
      symbol: '',
      direction: f > 0.5 ? 'long' : 'short',
      r: f * 3 - 1.4,
      p05: f * 2 - 1.8,
      p50: f * 2.6 - 1.2,
      p95: f * 3.4 - 0.4,
    })
  }
  return out
}

export function River({ forks, className }: { forks: RiverFork[]; className?: string }) {
  const router = useRouter()
  const [hover, setHover] = useState<Hover>(null)
  const empty = forks.length === 0
  const data = empty ? placeholderForks() : forks

  const phantomCount = forks.filter((f) => f.kind === 'phantom').length
  const tradeCount = forks.length - phantomCount

  return (
    <section className={`relative overflow-hidden ${className ?? ''}`} aria-label="Decision river">
      {/* Deep field behind the river */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 60%, oklch(0.17 0.012 75) 0%, oklch(0.13 0.008 75) 100%)' }}
        aria-hidden
      />

      <RiverFallback
        forks={data}
        dimmed={empty}
        onHover={(fork, pt) => setHover(fork && pt && !empty ? { fork, x: pt.x, y: pt.y } : null)}
        onSelect={(fork) => {
          if (empty) return
          router.push((fork.kind === 'phantom' ? '/phantoms' : '/journal') as never)
        }}
      />

      {/* Header overlay */}
      <div className="pointer-events-none absolute left-6 top-5">
        <h1 className="text-lg font-semibold tracking-tight text-ink">The river</h1>
        <p className="mt-0.5 text-xs text-faint">
          {empty
            ? 'Your decision history, once it begins'
            : `${tradeCount} roads taken · ${phantomCount} not taken`}
        </p>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-4 left-6 flex items-center gap-4 text-[11px] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full bg-ink/80" aria-hidden /> taken
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-sm bg-cost/40" aria-hidden /> would have paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-sm bg-gain/40" aria-hidden /> right to walk away
        </span>
      </div>

      {/* Empty-state promise */}
      {empty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-line bg-bg/80 px-6 py-4 text-center backdrop-blur-sm">
            <p className="text-sm text-dim">The river begins with your first import.</p>
            <p className="mt-1 text-xs text-faint">Import trades in the Journal; phantoms appear as the engine watches.</p>
          </div>
        </div>
      )}

      {/* Hover card */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 w-52 rounded-lg border border-line-strong bg-overlay/95 px-3 py-2.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
          style={{
            left: Math.min(Math.max(hover.x - 104, 8), 9999),
            top: Math.max(hover.y - 110, 8),
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
            {hover.fork.kind === 'trade' ? 'Road taken' : PHANTOM_LABELS[hover.fork.phantomType ?? ''] ?? 'Road not taken'}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {hover.fork.direction === 'long' ? '↑' : '↓'} {hover.fork.symbol}
          </p>
          {hover.fork.kind === 'trade' ? (
            <p className="num mt-0.5 text-xs text-dim">
              {hover.fork.r !== null ? `${formatR(hover.fork.r)} realized` : 'still open'}
            </p>
          ) : (
            <p className="num mt-0.5 text-xs text-dim">
              {hover.fork.p50 != null
                ? `${formatR(hover.fork.p50)} median · ${formatR(hover.fork.p05 ?? null, 1)} to ${formatR(hover.fork.p95 ?? null, 1)}`
                : 'simulating'}
            </p>
          )}
          <p className="mt-1 text-[10px] text-faint">{formatDate(new Date(hover.fork.at), 'MMM d, HH:mm')}</p>
        </div>
      )}

      {/* Screen-reader alternative */}
      <div className="sr-only">
        <h2>Decision river contents</h2>
        <ul>
          {forks.map((f) => (
            <li key={f.id}>
              {f.kind === 'trade'
                ? `Trade: ${f.symbol} ${f.direction}, ${f.r !== null ? `${formatR(f.r)} realized` : 'open'}`
                : `Phantom (${PHANTOM_LABELS[f.phantomType ?? ''] ?? f.phantomType}): ${f.symbol} ${f.direction}, median ${formatR(f.p50 ?? null)}, band ${formatR(f.p05 ?? null)} to ${formatR(f.p95 ?? null)}`}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
