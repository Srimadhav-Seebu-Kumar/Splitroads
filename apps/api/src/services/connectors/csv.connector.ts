/**
 * CSV import connector — the universal fallback.
 * Supports generic OHLC trade CSV (TraderSync/Tradervue/Tradezella export format)
 * and a custom Split-Roads template.
 *
 * Column map (case-insensitive, trims whitespace):
 *   symbol, venue?, asset_class?, direction/side, opened_at/entry_time/open_time,
 *   closed_at/exit_time/close_time, entry_price/avg_entry, exit_price/avg_exit,
 *   quantity/size/qty/contracts, fees/commission?, currency?
 */
import { parse } from 'csv-parse/sync'
import type { NormalisedTrade } from '@splitroads/contracts'
import { newId } from '../../lib/id'
import { Errors } from '../../lib/errors'

const COLUMN_ALIASES: Record<string, string> = {
  // direction
  side: 'direction', type: 'direction',
  // times
  entry_time: 'opened_at', open_time: 'opened_at', 'open date': 'opened_at',
  exit_time: 'closed_at', close_time: 'closed_at', 'close date': 'closed_at',
  // prices
  entry_price: 'avg_entry', avg_entry_price: 'avg_entry', 'avg entry': 'avg_entry',
  exit_price: 'avg_exit', avg_exit_price: 'avg_exit', 'avg exit': 'avg_exit',
  // quantity
  size: 'quantity', qty: 'quantity', contracts: 'quantity', shares: 'quantity',
  // fees
  commission: 'fees',
}

function normaliseHeader(h: string): string {
  const lower = h.toLowerCase().trim().replace(/[\s-]+/g, '_')
  return COLUMN_ALIASES[lower] ?? lower
}

function normaliseDirection(raw: string): 'long' | 'short' {
  const v = raw.toLowerCase().trim()
  if (['long', 'buy', 'b', 'l'].includes(v)) return 'long'
  if (['short', 'sell', 's'].includes(v)) return 'short'
  throw new Error(`Unknown direction: "${raw}"`)
}

function toDecimalString(raw: string | undefined): string {
  if (!raw) return '0'
  return parseFloat(raw.replace(/[,$]/g, '')).toString()
}

function toISOUtc(raw: string | undefined): string | null {
  if (!raw || raw.trim() === '') return null
  const d = new Date(raw.trim())
  if (isNaN(d.getTime())) return null
  return d.toISOString().replace('Z', '+00:00').slice(0, 19) + '+00:00'
}

export function parseCSV(
  csvText: string,
  userId: string,
  accountId: string
): NormalisedTrade[] {
  let records: Record<string, string>[]
  try {
    records = parse(csvText, {
      columns: (headers: string[]) => headers.map(normaliseHeader),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[]
  } catch (err) {
    throw Errors.SCHEMA_ERROR(`CSV parse failed: ${(err as Error).message}`)
  }

  const trades: NormalisedTrade[] = []
  for (let i = 0; i < records.length; i++) {
    const row = records[i]!
    if (!row['symbol']) continue   // skip blank rows

    try {
      const openedAt = toISOUtc(row['opened_at'])
      if (!openedAt) continue   // skip rows without a valid entry time

      trades.push({
        external_id: row['id'] ?? `csv-${userId}-${i}-${row['symbol']}`,
        user_id: userId,
        account_id: accountId,
        instrument: {
          symbol: (row['symbol'] ?? '').toUpperCase(),
          venue: (row['venue'] ?? 'UNKNOWN').toUpperCase(),
          asset_class: (row['asset_class'] ?? 'equity') as NormalisedTrade['instrument']['asset_class'],
        },
        direction: normaliseDirection(row['direction'] ?? ''),
        opened_at: openedAt,
        closed_at: toISOUtc(row['closed_at']),
        avg_entry: toDecimalString(row['avg_entry']),
        avg_exit: row['avg_exit'] ? toDecimalString(row['avg_exit']) : null,
        quantity: toDecimalString(row['quantity'] ?? '1'),
        fees: toDecimalString(row['fees']),
        currency: (row['currency'] ?? 'USD').toUpperCase(),
        source: 'broker.csv_import',
      })
    } catch {
      // Skip malformed rows silently; log row index for debugging
      console.warn(`CSV row ${i + 1} skipped — ${row['symbol'] ?? 'unknown'}`)
    }
  }

  return trades
}
