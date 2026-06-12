'use client'
/**
 * Phantom Ledger: phantoms grouped by pattern cell (type × instrument),
 * never a raw chronological feed (Law 1 by structure).
 * Cells below the evidence gate show accumulation progress, no numbers.
 * Expanding a cell discloses member phantoms inline: no modals.
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { Band, EvidenceChip } from '@/components/ui/Band'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { type Phantom, PHANTOM_TYPE_LABELS } from '@/lib/normalize'
import { formatR, formatDate, cn } from '@/lib/utils'

const EVIDENCE_GATE = 20

export type PatternCell = {
  key: string
  type: string
  symbol: string
  members: Phantom[]
  resolved: Phantom[]
  agg: { p05: number; p50: number; p95: number } | null
}

export function groupIntoCells(phantoms: Phantom[]): PatternCell[] {
  const map = new Map<string, Phantom[]>()
  for (const p of phantoms) {
    const key = `${p.phantomType}::${p.instrumentSymbol}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  const cells: PatternCell[] = []
  for (const [key, members] of map) {
    const [type, symbol] = key.split('::') as [string, string]
    const resolved = members.filter((m) => m.status === 'resolved' && m.p50 !== null)
    const agg = resolved.length
      ? {
          p05: avg(resolved.map((m) => m.p05 ?? 0)),
          p50: avg(resolved.map((m) => m.p50 ?? 0)),
          p95: avg(resolved.map((m) => m.p95 ?? 0)),
        }
      : null
    cells.push({ key, type, symbol, members, resolved, agg })
  }
  // Largest evidence first
  return cells.sort((a, b) => b.members.length - a.members.length)
}

function avg(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / Math.max(xs.length, 1)
}

export function LedgerCell({ cell, onCorrect }: {
  cell: PatternCell
  onCorrect?: ((id: string, verdict: 'confirmed_intent' | 'denied_intent') => void) | undefined
}) {
  const [open, setOpen] = useState(false)
  const gated = cell.resolved.length < EVIDENCE_GATE
  const label = PHANTOM_TYPE_LABELS[cell.type] ?? cell.type

  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-6 px-1 py-4 text-left transition-colors hover:bg-raised/50 md:grid-cols-[220px_1fr_150px]"
      >
        <div className="flex items-center gap-2.5">
          <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-faint transition-transform duration-200', open && 'rotate-90')} strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-ink">{label}</p>
            <p className="font-mono text-[11px] text-faint">{cell.symbol} · {cell.members.length} phantom{cell.members.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="hidden md:block">
          {gated ? (
            <AccumulationMeter have={cell.resolved.length} need={EVIDENCE_GATE} />
          ) : (
            <Band p05={cell.agg!.p05} p50={cell.agg!.p50} p95={cell.agg!.p95} size="compact" />
          )}
        </div>

        <div className="text-right">
          {gated ? (
            <span className="text-xs text-faint">accumulating</span>
          ) : (
            <>
              <span className={cn('num text-sm font-semibold', cell.agg!.p50 >= 0 ? 'text-cost' : 'text-gain')}>
                {formatR(cell.agg!.p50)}
              </span>
              <span className="block text-[10px] text-faint">median per phantom</span>
            </>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-1 pb-5 pl-7">
              {gated && (
                <p className="pb-2 text-xs text-faint">
                  {cell.resolved.length} of {EVIDENCE_GATE} resolved phantoms collected. Judgment is withheld until the pattern earns it.
                </p>
              )}
              {cell.members.map((p) => (
                <PhantomRow key={p.phantomId} phantom={p} onCorrect={onCorrect} />
              ))}
              <p className="pt-3 text-[11px] text-faint">
                Each row is one counterfactual: 256 simulated paths, conservative fills. One phantom is a sample, not a finding.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AccumulationMeter({ have, need }: { have: number; need: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1 w-full max-w-64 overflow-hidden rounded-full bg-overlay">
        <div
          className="h-full rounded-full bg-line-strong transition-[width] duration-700"
          style={{ width: `${Math.min(100, (have / need) * 100)}%` }}
        />
      </div>
      <span className="num shrink-0 text-[11px] text-faint">{have} of {need}</span>
    </div>
  )
}

function PhantomRow({ phantom, onCorrect }: {
  phantom: Phantom
  onCorrect?: ((id: string, verdict: 'confirmed_intent' | 'denied_intent') => void) | undefined
}) {
  const needsAnswer = phantom.phantomType === 'ABANDONED_ENTRY' && phantom.status === 'active' && onCorrect
  const hasOutcome = phantom.p50 !== null

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-6 rounded-lg px-3 py-2.5 transition-colors hover:bg-raised/60 md:grid-cols-[190px_1fr_auto]">
      <div>
        <p className="num text-xs text-dim">
          {phantom.direction === 'long' ? '↑' : '↓'} {formatDate(phantom.spawnedAt, 'MMM d, HH:mm')}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <Badge variant={phantom.status === 'resolved' ? 'resolved' : phantom.status === 'active' ? 'active' : 'expired'}>
            {phantom.status}
          </Badge>
          {phantom.spawnIntentScore !== null && (
            <span className="font-mono text-[10px] text-faint">{Math.round(phantom.spawnIntentScore * 100)}% intent</span>
          )}
        </div>
      </div>

      <div className="hidden md:block">
        {hasOutcome ? (
          <Band p05={phantom.p05 ?? 0} p50={phantom.p50 ?? 0} p95={phantom.p95 ?? 0} size="compact" />
        ) : (
          <span className="text-xs text-faint">simulating · resolves at expiry or target</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {hasOutcome && (
          <span className="num text-xs text-dim">
            {formatR(phantom.p50)} <span className="text-faint">[{formatR(phantom.p05, 1)}, {formatR(phantom.p95, 1)}]</span>
          </span>
        )}
        {needsAnswer && (
          <span className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => onCorrect!(phantom.phantomId, 'confirmed_intent')}>
              Mine
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onCorrect!(phantom.phantomId, 'denied_intent')}>
              Not mine
            </Button>
          </span>
        )}
        <span className="hidden items-center gap-1 lg:flex">
          <EvidenceChip>entry: {phantom.paramProvenance['entry'] ?? 'observed'}</EvidenceChip>
          <EvidenceChip>stop: {phantom.paramProvenance['stop'] ?? (phantom.cfStop !== null ? 'observed' : 'none')}</EvidenceChip>
        </span>
      </div>
    </div>
  )
}
