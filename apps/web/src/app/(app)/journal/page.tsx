'use client'
/**
 * Journal: the familiar surface. Trades, R-analytics, CSV import.
 * Quiet instrument styling; behavior lives elsewhere.
 */
import { useState, useRef, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatR, formatPnl, formatDate, cn } from '@/lib/utils'
import { Upload } from 'lucide-react'

export default function JournalPage() {
  const { token } = useAuth()
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: analytics, refetch: refetchAnalytics } = useApi((t) => api.trades.analytics(t, 90))
  const { data: tradesData, refetch } = useApi((t) => api.trades.list(t, { per_page: '50' }))

  const a = analytics as {
    totalTrades?: number; winRate?: number; expectancy?: number; profitFactor?: number
  } | null
  const trades = useMemo(() => ((tradesData as { items?: unknown[] })?.items ?? []) as TradeRow[], [tradesData])

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
      refetchAnalytics()
    } catch (err) {
      setImportMsg(`Error: ${(err as Error).message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      {/* Header */}
      <header className="rise-in flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Journal</h1>
          <p className="mt-1 text-sm text-dim">Last 90 days of roads taken.</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          <Button variant="secondary" size="sm" loading={importing} onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Import CSV
          </Button>
        </div>
      </header>

      {importMsg && (
        <p className={cn('mt-4 text-sm', importMsg.startsWith('Error') ? 'text-cost' : 'text-gain')}>
          {importMsg}
        </p>
      )}

      {/* Analytics strip */}
      {a && (
        <div className="rise-in-1 mt-8 flex flex-wrap items-baseline gap-x-10 gap-y-3 border-y border-line py-4">
          <Figure label="trades" value={String(a.totalTrades ?? 0)} />
          <Figure label="win rate" value={a.totalTrades ? `${Math.round((a.winRate ?? 0) * 100)}%` : '—'} />
          <Figure
            label="expectancy"
            value={a.expectancy !== undefined ? formatR(a.expectancy) : '—'}
            tone={a.expectancy !== undefined ? (a.expectancy >= 0 ? 'gain' : 'cost') : undefined}
          />
          <Figure label="profit factor" value={a.profitFactor ? a.profitFactor.toFixed(2) : '—'} />
        </div>
      )}

      {/* Trade log */}
      <section className="rise-in-2 mt-8" aria-label="Trade log">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Upload className="h-7 w-7 text-faint" strokeWidth={1.25} />
            <p className="text-sm text-dim">No trades yet.</p>
            <p className="max-w-sm text-xs text-faint">
              Import a CSV to populate the river. Plans with stops unlock early-exit phantoms.
            </p>
            <Button className="mt-2" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Import CSV
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {['Symbol', 'Dir', 'Opened', 'Entry', 'Exit', 'Size', 'R', 'P&L', 'Tags'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {trades.map((t) => (
                <tr key={t.tradeId} className="transition-colors hover:bg-raised/50">
                  <td className="px-3 py-3 font-medium text-ink">{t.instrumentSymbol}</td>
                  <td className="px-3 py-3 text-dim">{t.direction === 'long' ? '↑ L' : '↓ S'}</td>
                  <td className="px-3 py-3 text-dim">{formatDate(t.openedAt, 'MMM d')}</td>
                  <td className="num px-3 py-3 text-dim">{parseFloat(t.avgEntry).toFixed(4)}</td>
                  <td className="num px-3 py-3 text-dim">
                    {t.avgExit ? parseFloat(t.avgExit).toFixed(4) : <span className="text-faint">open</span>}
                  </td>
                  <td className="num px-3 py-3 text-faint">{parseFloat(t.quantity).toFixed(2)}</td>
                  <td className={cn('num px-3 py-3 font-medium', rTone(t.rMultiple))}>
                    {t.rMultiple ? formatR(t.rMultiple) : '—'}
                  </td>
                  <td className="num px-3 py-3 text-dim">{t.realizedPnl ? formatPnl(t.realizedPnl) : '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(t.setupTags ?? []).map((tag) => (
                        <Badge key={tag} variant="neutral">{tag}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

type TradeRow = {
  tradeId: string
  instrumentSymbol: string
  direction: 'long' | 'short'
  openedAt: string
  avgEntry: string
  avgExit: string | null
  quantity: string
  rMultiple: string | null
  realizedPnl: string | null
  setupTags?: string[]
}

function rTone(r: string | null): string {
  if (r === null) return 'text-faint'
  const n = parseFloat(r)
  if (!Number.isFinite(n)) return 'text-faint'
  return n >= 0 ? 'text-gain' : 'text-cost'
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: 'cost' | 'gain' | undefined }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`num text-lg font-semibold ${tone === 'cost' ? 'text-cost' : tone === 'gain' ? 'text-gain' : 'text-ink'}`}>
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-[0.1em] text-faint">{label}</span>
    </div>
  )
}
