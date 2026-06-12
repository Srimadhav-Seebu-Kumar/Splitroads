'use client'
/**
 * Phantom Explorer: the ledger of roads not taken.
 * Pattern cells first (Law 1 by structure), members on demand.
 */
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { groupIntoCells, LedgerCell } from '@/components/phantoms/Ledger'
import { normalizePhantom } from '@/lib/normalize'
import { formatR } from '@/lib/utils'
import { Ghost } from 'lucide-react'

export default function PhantomsPage() {
  const { token } = useAuth()
  const { data: stats } = useApi((t) => api.phantoms.stats(t))
  const { data: phantomsData, loading, refetch } = useApi((t) => api.phantoms.list(t))

  const phantoms = useMemo(() => ((phantomsData as unknown[]) ?? []).map(normalizePhantom), [phantomsData])
  const cells = useMemo(() => groupIntoCells(phantoms), [phantoms])

  async function handleCorrect(id: string, verdict: 'confirmed_intent' | 'denied_intent') {
    if (!token) return
    await api.phantoms.correct(token, id, verdict)
    refetch()
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      {/* Header */}
      <header className="rise-in">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Phantoms</h1>
        <p className="mt-1 max-w-xl text-sm text-dim">
          The roads not taken, simulated honestly. Patterns speak only after twenty resolved phantoms; until then they accumulate in silence.
        </p>
      </header>

      {/* Counts strip: quiet mono figures, not stat cards */}
      {stats && (
        <div className="rise-in-1 mt-8 flex flex-wrap items-baseline gap-x-10 gap-y-3 border-y border-line py-4">
          <Figure label="phantoms" value={String(stats.totalPhantoms)} />
          <Figure label="early exits" value={String(stats.prematureExits)} />
          <Figure label="abandoned entries" value={String(stats.abandonedEntries)} />
          {stats.avgPrematureExitCostR !== null && (
            <Figure label="median R left on table" value={formatR(stats.avgPrematureExitCostR)} tone="cost" />
          )}
          {stats.hesitationCostR !== null && (
            <Figure label="avg winning phantom" value={formatR(stats.hesitationCostR)} tone="cost" />
          )}
        </div>
      )}

      {/* The ledger */}
      <section className="rise-in-2 mt-4" aria-label="Pattern ledger">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-raised/50" />)}
          </div>
        ) : cells.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Ghost className="h-7 w-7 text-faint" strokeWidth={1.25} />
            <p className="text-sm text-dim">No phantoms yet.</p>
            <p className="max-w-sm text-xs text-faint">
              Import trades with plans in the Journal to spawn early-exit phantoms. Abandoned-entry phantoms arrive once intent capture is on.
            </p>
          </div>
        ) : (
          <div>
            {cells.map((cell) => (
              <LedgerCell key={cell.key} cell={cell} onCorrect={handleCorrect} />
            ))}
          </div>
        )}
      </section>

      {/* Permanent furniture */}
      <p className="rise-in-3 mt-8 text-[11px] leading-relaxed text-faint">
        How to read this: every estimate is a distribution (p05 to p95 band, median tick), never a promise.
        Simulations use conservative fills and label every assumed parameter.
        Outcomes wear amber when the road would have paid and teal when walking away was right; money colors have no place here.
      </p>
    </div>
  )
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: 'cost' | 'gain' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`num text-lg font-semibold ${tone === 'cost' ? 'text-cost' : tone === 'gain' ? 'text-gain' : 'text-ink'}`}>
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-[0.1em] text-faint">{label}</span>
    </div>
  )
}
