'use client'
import { useState, useRef } from 'react'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Stat } from '@/components/ui/Stat'
import { formatR, formatPnl, rColor, formatDate, cn } from '@/lib/utils'
import { Upload, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

export default function JournalPage() {
  const { token } = useAuth()
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: analytics } = useApi((t) => api.trades.analytics(t, 90))
  const { data: tradesData, refetch } = useApi((t) => api.trades.list(t, { per_page: '50' }))

  const a = analytics as any
  const trades = (tradesData as any)?.items ?? []

  // CSV import handler
  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setImporting(true)
    setImportMsg(null)
    try {
      const csv = await file.text()
      const PLACEHOLDER_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001'
      const result = await api.trades.importCSV(token, PLACEHOLDER_ACCOUNT_ID, csv)
      setImportMsg(`Imported ${result.inserted} trades, ${result.skipped} skipped`)
      refetch()
    } catch (err: any) {
      setImportMsg(`Error: ${err.message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Journal</h1>
          <p className="mt-1 text-sm text-zinc-500">Last 90 days</p>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          <Button variant="secondary" size="sm" loading={importing} onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Import CSV
          </Button>
        </div>
      </div>

      {importMsg && (
        <p className={cn('text-sm', importMsg.startsWith('Error') ? 'text-amber-400' : 'text-teal-400')}>
          {importMsg}
        </p>
      )}

      {/* R-analytics summary */}
      {a && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card><Stat label="Trades" value={a.totalTrades ?? 0} /></Card>
          <Card>
            <Stat
              label="Win rate"
              value={a.totalTrades ? `${Math.round((a.winRate ?? 0) * 100)}%` : '—'}
            />
          </Card>
          <Card>
            <Stat
              label="Expectancy"
              value={a.expectancy !== undefined ? formatR(a.expectancy) : '—'}
              className={rColor(a.expectancy)}
            />
          </Card>
          <Card>
            <Stat
              label="Profit factor"
              value={a.profitFactor ? a.profitFactor.toFixed(2) : '—'}
              delta={a.profitFactor >= 1.5 ? '≥ 1.5 ✓' : a.profitFactor > 0 ? 'Below 1.5' : undefined}
              deltaPositive={a.profitFactor >= 1.5}
            />
          </Card>
        </div>
      )}

      {/* Trade table */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-400 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Trade log
        </h2>

        {trades.length === 0 ? (
          <Card className="py-16 text-center">
            <Upload className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">No trades yet. Import a CSV or connect a broker.</p>
            <Button className="mt-4 mx-auto" variant="secondary" onClick={() => fileRef.current?.click()}>
              Import CSV
            </Button>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  {['Symbol', 'Dir', 'Opened', 'Entry', 'Exit', 'Size', 'R', 'P&L', 'Tags'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {trades.map((t: any) => (
                  <tr key={t.tradeId} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-100">{t.instrumentSymbol}</td>
                    <td className="px-4 py-3">
                      {t.direction === 'long'
                        ? <span className="flex items-center gap-1 text-teal-400"><TrendingUp className="h-3 w-3" />L</span>
                        : <span className="flex items-center gap-1 text-amber-400"><TrendingDown className="h-3 w-3" />S</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{formatDate(t.openedAt, 'MMM d')}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-300">{parseFloat(t.avgEntry).toFixed(4)}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-300">
                      {t.avgExit ? parseFloat(t.avgExit).toFixed(4) : <span className="text-teal-600">open</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-400">{parseFloat(t.quantity).toFixed(2)}</td>
                    <td className={cn('px-4 py-3 tabular-nums font-medium', rColor(t.rMultiple))}>
                      {t.rMultiple ? formatR(t.rMultiple) : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-400">
                      {t.realizedPnl ? formatPnl(t.realizedPnl) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(t.setupTags ?? []).map((tag: string) => (
                          <Badge key={tag} variant="neutral">{tag}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
