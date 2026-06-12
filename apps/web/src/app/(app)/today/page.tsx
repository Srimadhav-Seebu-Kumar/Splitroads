'use client'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { Badge } from '@/components/ui/Badge'
import { formatR, formatPnl, rColor, timeAgo, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Ghost, Zap, Eye, AlertCircle } from 'lucide-react'

export default function TodayPage() {
  const { data, loading } = useApi((token) => api.dashboard.today(token))

  if (loading) return <PageSkeleton />

  const phantomStats = data?.phantom_stats as any
  const topInsight = data?.top_insight as any
  const todayTrades = (data?.today_trades ?? []) as any[]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Today</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <Stat
            label="Open trades"
            value={data?.open_trades ?? 0}
            subtext="currently in market"
          />
        </Card>
        <Card>
          <Stat
            label="Trades today"
            value={todayTrades.length}
            subtext="logged automatically"
          />
        </Card>
        <Card>
          <Stat
            label="Intent sessions"
            value={data?.intent_sessions_today ?? 0}
            subtext="captured today"
          />
        </Card>
        <Card>
          <Stat
            label="Pending reviews"
            value={data?.pending_corrections ?? 0}
            delta={data?.pending_corrections ? 'Needs your input' : undefined}
            deltaPositive={false}
          />
        </Card>
      </div>

      {/* Phantom headline numbers */}
      {phantomStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ghost className="h-3.5 w-3.5" /> Exit Quality
              </CardTitle>
              {phantomStats.prematureExits > 0 && (
                <Badge variant="cost">{phantomStats.prematureExits} phantoms</Badge>
              )}
            </CardHeader>
            {phantomStats.avgPrematureExitCostR !== null ? (
              <div>
                <p className="text-2xl font-semibold tabular-nums text-amber-400">
                  {formatR(phantomStats.avgPrematureExitCostR)} / trade
                </p>
                <p className="mt-1 text-xs text-zinc-600">median R left on table · uncertainty bands in Phantoms</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Accumulating — {phantomStats.prematureExits ?? 0} of 20 needed</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" /> Hesitation Cost
              </CardTitle>
              {phantomStats.abandonedEntries > 0 && (
                <Badge variant="cost">{phantomStats.abandonedEntries} phantoms</Badge>
              )}
            </CardHeader>
            {phantomStats.hesitationCostR !== null ? (
              <div>
                <p className="text-2xl font-semibold tabular-nums text-amber-400">
                  {formatR(phantomStats.hesitationCostR)} / trade
                </p>
                <p className="mt-1 text-xs text-zinc-600">avg winning phantom R · trades you walked away from</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Install the extension to capture intent</p>
            )}
          </Card>
        </div>
      )}

      {/* Top insight */}
      {topInsight && (
        <Card className="border-zinc-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" /> Latest Insight
            </CardTitle>
            <Badge variant={topInsight.severity === 'cost' ? 'cost' : 'improvement'}>
              {topInsight.severity}
            </Badge>
          </CardHeader>
          <p className="text-sm text-zinc-300">{topInsight.claim?.description ?? topInsight.kind}</p>
          {topInsight.action && (
            <div className="mt-3 rounded-lg bg-zinc-800 px-3 py-2">
              <p className="text-xs font-medium text-zinc-400">Suggested action</p>
              <p className="mt-0.5 text-sm text-zinc-200">{topInsight.action.label}</p>
            </div>
          )}
        </Card>
      )}

      {/* Today's trades */}
      {todayTrades.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Today&apos;s trades</h2>
          <div className="space-y-2">
            {todayTrades.map((t: any) => (
              <Card key={t.tradeId} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {t.direction === 'long'
                    ? <TrendingUp className="h-4 w-4 text-teal-500" />
                    : <TrendingDown className="h-4 w-4 text-amber-500" />
                  }
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{t.instrumentSymbol}</p>
                    <p className="text-xs text-zinc-600">{timeAgo(t.openedAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-semibold tabular-nums', rColor(t.rMultiple))}>
                    {t.rMultiple ? formatR(t.rMultiple) : (t.closedAt ? '—' : 'open')}
                  </p>
                  <p className="text-xs text-zinc-600">{t.closedAt ? formatPnl(t.realizedPnl) : 'in market'}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Calm close — anti-engagement signature */}
      {todayTrades.length === 0 && !loading && (
        <p className="text-center text-sm text-zinc-700 py-8">
          No trades logged today. That&apos;s fine — come back after market hours.
        </p>
      )}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-32 rounded bg-zinc-800" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-900" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => <div key={i} className="h-32 rounded-xl bg-zinc-900" />)}
      </div>
    </div>
  )
}
