'use client'
/**
 * Today: the daily glance. The River carries the story;
 * below it, exactly one insight, the open loop, and a quiet close.
 * Designed to end the session, not extend it.
 */
import { useMemo, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { River } from '@/components/river/River'
import type { RiverFork } from '@/components/river/layout'
import { EvidenceChip } from '@/components/ui/Band'
import { Button } from '@/components/ui/Button'
import { normalizeTrade, normalizePhantom, PHANTOM_TYPE_LABELS } from '@/lib/normalize'
import { formatR, timeAgo, cn } from '@/lib/utils'
import { Mark } from '@/components/brand/Mark'

export default function TodayPage() {
  const { token } = useAuth()
  const { data: dash } = useApi((t) => api.dashboard.today(t))
  const { data: tradesData, loading: tradesLoading } = useApi((t) => api.trades.list(t, { per_page: '100' }))
  const { data: phantomsData, loading: phantomsLoading, refetch: refetchPhantoms } = useApi((t) => api.phantoms.list(t))

  const trades = useMemo(() => ((tradesData as { items?: unknown[] })?.items ?? []).map(normalizeTrade), [tradesData])
  const phantoms = useMemo(() => ((phantomsData as unknown[]) ?? []).map(normalizePhantom), [phantomsData])

  const forks = useMemo<RiverFork[]>(() => [
    ...trades.map((t): RiverFork => ({
      id: t.tradeId, kind: 'trade', at: new Date(t.openedAt).getTime(),
      symbol: t.instrumentSymbol, direction: t.direction, r: t.rMultiple,
    })),
    ...phantoms.map((p): RiverFork => ({
      id: p.phantomId, kind: 'phantom', at: new Date(p.spawnedAt).getTime(),
      symbol: p.instrumentSymbol, direction: p.direction, r: null,
      p05: p.p05, p50: p.p50, p95: p.p95,
      phantomType: p.phantomType, status: p.status,
    })),
  ], [trades, phantoms])

  const loading = tradesLoading || phantomsLoading
  const topInsight = (dash as { top_insight?: TopInsight | null })?.top_insight ?? null
  const openLoop = phantoms.find(
    (p) => p.phantomType === 'ABANDONED_ENTRY' && p.status === 'active'
      && p.spawnIntentScore !== null && p.spawnIntentScore >= 0.5 && p.spawnIntentScore < 0.75
  )

  const todayTrades = trades.filter((t) => isToday(t.openedAt))

  return (
    <div className="flex min-h-full flex-col">
      {/* The centerpiece */}
      {!loading && <River forks={forks} className="h-[52vh] min-h-[340px] shrink-0" />}
      {loading && <div className="h-[52vh] min-h-[340px] shrink-0 animate-pulse bg-raised/40" />}

      {/* The calm column */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16 pt-10">
        {/* One insight, exactly one */}
        <section className="rise-in-1" aria-label="Today's insight">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">One thing worth knowing</h2>
          {topInsight ? (
            <div className="mt-3">
              <p className="text-[17px] leading-relaxed text-ink">
                {claimText(topInsight)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <EvidenceChip>{evidenceText(topInsight)}</EvidenceChip>
                {topInsight.action && (
                  <span className="text-xs text-dim">{topInsight.action.label}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-faint">
              The engine is watching. Insights publish once a pattern clears the evidence gate (n≥20); no number arrives before it&apos;s earned.
            </p>
          )}
        </section>

        {/* Open loop: the one thing awaiting the user */}
        {openLoop && token && (
          <section className="rise-in-2 mt-10" aria-label="Awaiting your confirmation">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Awaiting you</h2>
            <OpenLoopCard
              symbol={openLoop.instrumentSymbol}
              direction={openLoop.direction}
              spawnedAt={openLoop.spawnedAt}
              score={openLoop.spawnIntentScore ?? 0}
              onAnswer={async (verdict) => {
                await api.phantoms.correct(token, openLoop.phantomId, verdict)
                refetchPhantoms()
              }}
            />
          </section>
        )}

        {/* Today's trades: a quiet strip, not a table */}
        {todayTrades.length > 0 && (
          <section className="rise-in-3 mt-10" aria-label="Today's trades">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Today, on the road</h2>
            <ul className="mt-3 divide-y divide-line">
              {todayTrades.slice(0, 6).map((t) => (
                <li key={t.tradeId} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-dim">
                    <span className="text-ink">{t.direction === 'long' ? '↑' : '↓'} {t.instrumentSymbol}</span>
                    <span className="ml-2 text-xs text-faint">{timeAgo(t.openedAt)}</span>
                  </span>
                  <span className={cn('num text-sm', rTone(t.rMultiple, !!t.closedAt))}>
                    {t.closedAt ? formatR(t.rMultiple) : 'open'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Quiet close: the anti-engagement signature */}
        <div className="rise-in-4 mt-16 flex flex-col items-center gap-3 text-center">
          <Mark size={20} className="text-faint" />
          <p className="text-sm text-faint">Nothing else needs you today.</p>
        </div>
      </div>
    </div>
  )
}

type TopInsight = {
  kind?: string
  severity?: string
  claim?: { description?: string; metric?: string; sample_n?: number; ci?: string }
  action?: { label?: string } | null
}

function claimText(i: TopInsight): string {
  return i.claim?.description ?? i.kind?.replaceAll('_', ' ') ?? 'New pattern published.'
}

function evidenceText(i: TopInsight): string {
  const parts: string[] = []
  if (i.claim?.sample_n) parts.push(`n=${i.claim.sample_n}`)
  if (i.claim?.ci) parts.push(`CI ${i.claim.ci}`)
  return parts.length ? parts.join(' · ') : 'evidence attached'
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function rTone(r: number | null, closed: boolean): string {
  if (!closed || r === null) return 'text-faint'
  return r >= 0 ? 'text-gain' : 'text-cost'
}

function OpenLoopCard({ symbol, direction, spawnedAt, score, onAnswer }: {
  symbol: string
  direction: 'long' | 'short'
  spawnedAt: string
  score: number
  onAnswer: (verdict: 'confirmed_intent' | 'denied_intent') => Promise<void>
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')

  if (state === 'done') {
    return (
      <p className="mt-3 text-sm text-dim">
        Noted. Every answer makes the intent engine more yours.
      </p>
    )
  }

  return (
    <div className="mt-3 rounded-[10px] border border-line bg-raised p-4">
      <p className="text-sm text-ink">
        Were you planning this {direction} on <span className="font-semibold">{symbol}</span> {timeAgo(spawnedAt)}?
      </p>
      <p className="mt-1 text-xs text-faint">
        The engine read {Math.round(score * 100)}% intent and wants your correction, not its own assumption.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm" variant="secondary" disabled={state === 'busy'}
          onClick={async () => { setState('busy'); await onAnswer('confirmed_intent'); setState('done') }}
        >
          Yes, I was
        </Button>
        <Button
          size="sm" variant="ghost" disabled={state === 'busy'}
          onClick={async () => { setState('busy'); await onAnswer('denied_intent'); setState('done') }}
        >
          No
        </Button>
      </div>
    </div>
  )
}
