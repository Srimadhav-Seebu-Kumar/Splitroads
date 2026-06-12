'use client'
import { useAuth } from '@/lib/auth-context'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { PhantomCard } from '@/components/phantoms/PhantomCard'
import { Card } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { formatR } from '@/lib/utils'
import { Ghost } from 'lucide-react'

export default function PhantomsPage() {
  const { token } = useAuth()
  const { data: stats } = useApi((t) => api.phantoms.stats(t))
  const { data: phantoms, refetch } = useApi((t) => api.phantoms.list(t))

  const list = (phantoms ?? []) as any[]

  async function handleCorrect(id: string, verdict: 'confirmed_intent' | 'denied_intent') {
    if (!token) return
    await api.phantoms.correct(token, id, verdict)
    refetch()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Ghost className="h-5 w-5 text-teal-400" /> Phantom Ledger
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          The roads not taken — every outcome is a distribution, not a taunt.
        </p>
      </div>

      {/* Headline stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card><Stat label="Total phantoms" value={stats.totalPhantoms} /></Card>
          <Card>
            <Stat
              label="Early exits"
              value={stats.prematureExits}
              delta={stats.avgPrematureExitCostR !== null ? `${formatR(stats.avgPrematureExitCostR)} median cost` : undefined}
              deltaPositive={false}
            />
          </Card>
          <Card>
            <Stat
              label="Abandoned entries"
              value={stats.abandonedEntries}
              delta={stats.hesitationCostR !== null ? `${formatR(stats.hesitationCostR)} avg win phantom` : undefined}
              deltaPositive={false}
            />
          </Card>
          <Card>
            <Stat
              label="Law 1 gate"
              value="n ≥ 20"
              subtext="min sample for published insights"
            />
          </Card>
        </div>
      )}

      {/* Evidence gate reminder — always visible */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-600">
        <strong className="text-zinc-500">How to read this:</strong> Each phantom is one counterfactual path.
        Insights are only surfaced after 20+ resolved phantoms in a pattern.
        Individual phantom outcomes are distributions (p05–p95 bands), not promises.
      </div>

      {/* Phantom grid */}
      {list.length === 0 ? (
        <Card className="py-16 text-center">
          <Ghost className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No phantoms yet.</p>
          <p className="mt-1 text-xs text-zinc-700">
            Import trades with plans to generate Early Exit phantoms, or install the extension for Abandoned Entry phantoms.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p: any) => (
            <PhantomCard
              key={p.phantomId}
              phantom={p}
              onCorrect={p.phantomType === 'ABANDONED_ENTRY' ? handleCorrect : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
