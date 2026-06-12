'use client'
/**
 * PhantomCard — shows a single phantom with its uncertainty band.
 * ALWAYS shows p05–p95 band. Never leads with a single P&L number (Law 1).
 * Colour uses amber/teal behavioral palette, never red/green (profit framing).
 */
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatR, phantomBand, formatDate, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'

type Phantom = {
  phantomId: string
  phantomType: string
  status: string
  instrumentSymbol: string
  direction: 'long' | 'short'
  outcomRp05?: number | null
  outcomeRp50?: number | null
  outcomeRp95?: number | null
  spawnIntentScore?: number | null
  spawnedAt: string
  cfEntry: number
  cfStop?: number | null
  cfTarget?: number | null
}

type Props = { phantom: Phantom; onCorrect?: ((id: string, verdict: 'confirmed_intent' | 'denied_intent') => void) | undefined }

const TYPE_LABELS: Record<string, string> = {
  ABANDONED_ENTRY: 'Abandoned Entry',
  PREMATURE_EXIT:  'Early Exit',
  DELAYED_ENTRY:   'Delayed Entry',
  CONVICTION:      'Conviction Gap',
  POSITION_SIZE:   'Size Phantom',
  STOP_PLACEMENT:  'Stop Phantom',
}

export function PhantomCard({ phantom, onCorrect }: Props) {
  const p50 = phantom.outcomeRp50 ?? null
  const isPositive = p50 !== null && p50 > 0
  const typeLabel = TYPE_LABELS[phantom.phantomType] ?? phantom.phantomType

  const statusVariant = phantom.status === 'resolved' ? 'resolved'
    : phantom.status === 'active' ? 'active' : 'expired'

  return (
    <Card className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{typeLabel}</p>
          <p className="mt-0.5 text-base font-semibold text-zinc-100">
            {phantom.direction === 'long' ? '↑' : '↓'} {phantom.instrumentSymbol}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{phantom.status}</Badge>
          {phantom.phantomType === 'ABANDONED_ENTRY' && phantom.spawnIntentScore && (
            <Badge variant="neutral">{Math.round(phantom.spawnIntentScore * 100)}% intent</Badge>
          )}
        </div>
      </div>

      {/* The split-road metric — ALWAYS a band, never a point */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <p className="mb-1 text-xs text-zinc-600">If held to plan · uncertainty band</p>
        {phantom.outcomeRp50 !== null && phantom.outcomeRp50 !== undefined ? (
          <div className="flex items-baseline gap-3">
            <span className={cn('text-xl font-semibold tabular-nums', isPositive ? 'text-teal-400' : 'text-amber-400')}>
              {formatR(p50)} median
            </span>
            <span className="text-sm text-zinc-500">
              {phantomBand(phantom.outcomRp05 ?? null, phantom.outcomeRp95 ?? null)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-zinc-600">
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm">Accumulating — not enough data yet</span>
          </div>
        )}

        {/* Uncertainty reminder — permanent furniture (PHANTOM_ENGINE.md §4.4) */}
        <p className="mt-2 text-[10px] text-zinc-700">
          Distribution over 256 simulated paths · conservative fills · one sample of many decisions
        </p>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          { label: 'Entry', value: phantom.cfEntry?.toFixed(4) },
          { label: 'Stop',  value: phantom.cfStop?.toFixed(4)  ?? '—' },
          { label: 'Target',value: phantom.cfTarget?.toFixed(4) ?? '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-zinc-600">{label}</p>
            <p className="tabular-nums text-zinc-300">{value}</p>
          </div>
        ))}
      </div>

      {/* Correction controls for ABANDONED_ENTRY in review band */}
      {phantom.phantomType === 'ABANDONED_ENTRY' && onCorrect && phantom.status === 'active' && (
        <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
          <p className="flex-1 text-xs text-zinc-500">Were you planning this trade?</p>
          <Button size="sm" variant="secondary" onClick={() => onCorrect(phantom.phantomId, 'confirmed_intent')}>
            Yes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onCorrect(phantom.phantomId, 'denied_intent')}>
            No
          </Button>
        </div>
      )}

      <p className="text-xs text-zinc-700">{formatDate(phantom.spawnedAt)}</p>
    </Card>
  )
}
