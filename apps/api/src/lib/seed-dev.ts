/**
 * Dev-only seed: one demo user with six weeks of trades, intent sessions,
 * and phantoms, so every surface (river, ledger, journal) renders rich.
 * Deterministic PRNG: re-running produces the same world. Idempotent:
 * wipes and rebuilds only this user's data. NEVER run in production.
 */
import postgres from 'postgres'

const DATABASE_URL = process.env['DATABASE_URL']
const API = process.env['SEED_API_URL'] ?? 'http://localhost:3001/api/v1'
const EMAIL = 'river@splitroads.dev'
const PASSWORD = 'flowing-rivers-demo-2026'
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000001'

if (!DATABASE_URL) {
  console.error('DATABASE_URL required')
  process.exit(1)
}
if (process.env['NODE_ENV'] === 'production') {
  console.error('Refusing to seed in production')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { transform: postgres.camel, onnotice: () => {} })

// Deterministic PRNG (mulberry32)
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20260612)

function pick<T>(xs: readonly T[]): T { return xs[Math.floor(rand() * xs.length)]! }
function range(lo: number, hi: number): number { return lo + rand() * (hi - lo) }

/** Weekday timestamps across the last `weeks` weeks, NY session hours */
function sessionTime(daysAgo: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  // Skip weekends backwards
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1)
  d.setUTCHours(14 + Math.floor(rand() * 6), Math.floor(rand() * 60), Math.floor(rand() * 60), 0)
  return d
}

async function ensureUser(): Promise<string> {
  // Register through the API so the password hash is real Argon2id
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, display_name: 'River Demo' }),
  })
  if (!res.ok && res.status !== 409 && res.status !== 400) {
    throw new Error(`register failed: ${res.status} ${await res.text()}`)
  }
  const [user] = await sql<[{ userId: string }]>`
    SELECT user_id FROM core.users WHERE email = ${EMAIL}
  `
  if (!user) throw new Error('user not found after register')
  return user.userId
}

const INSTRUMENTS = [
  { symbol: 'NQ', venue: 'CME', assetClass: 'futures', px: 21500, tick: 12, weight: 0.55 },
  { symbol: 'ES', venue: 'CME', assetClass: 'futures', px: 6050, tick: 3, weight: 0.25 },
  { symbol: 'CL', venue: 'NYMEX', assetClass: 'futures', px: 72.4, tick: 0.4, weight: 0.20 },
] as const

function pickInstrument() {
  const r = rand()
  let acc = 0
  for (const ins of INSTRUMENTS) {
    acc += ins.weight
    if (r <= acc) return ins
  }
  return INSTRUMENTS[0]
}

async function main() {
  const userId = await ensureUser()
  console.log(`user  ${EMAIL} (${userId})`)

  // Idempotent wipe of this user's world
  await sql`DELETE FROM phantom.phantoms WHERE user_id = ${userId}`
  await sql`DELETE FROM intent.sessions WHERE user_id = ${userId}`
  await sql`DELETE FROM trading.trades WHERE user_id = ${userId}`
  await sql`DELETE FROM trading.accounts WHERE user_id = ${userId}`

  await sql`
    INSERT INTO trading.accounts (account_id, user_id, broker, label)
    VALUES (${ACCOUNT_ID}, ${userId}, 'csv', 'Demo futures account')
    ON CONFLICT (account_id) DO NOTHING
  `

  // ─── Trades: ~48 over 6 weeks, slight positive expectancy ─────────────────
  const trades: { tradeId: string; symbol: string; venue: string; direction: 'long' | 'short'; openedAt: Date; r: number }[] = []
  let n = 0
  for (let day = 42; day >= 0; day--) {
    const tradesToday = rand() < 0.45 ? 0 : Math.floor(range(1, 3.2))
    for (let k = 0; k < tradesToday; k++) {
      const ins = pickInstrument()
      const direction = rand() < 0.62 ? 'long' : 'short'
      const openedAt = sessionTime(day)
      const win = rand() < 0.46
      const r = win ? range(0.4, 2.6) : -range(0.3, 1.1)
      const stillOpen = day === 0 && k === 0 && rand() < 0.6

      const entry = ins.px * (1 + range(-0.01, 0.01))
      const riskPts = ins.tick * range(2, 6)
      const exit = direction === 'long' ? entry + r * riskPts : entry - r * riskPts
      const qty = ins.symbol === 'CL' ? Math.ceil(range(1, 3)) : Math.ceil(range(1, 4))
      const holdMin = range(4, 95)
      const closedAt = new Date(openedAt.getTime() + holdMin * 60000)

      const [row] = await sql<[{ tradeId: string }]>`
        INSERT INTO trading.trades (
          user_id, account_id, instrument_symbol, instrument_venue, asset_class,
          direction, opened_at, closed_at, avg_entry, avg_exit, quantity,
          realized_pnl, r_multiple, source, external_id, setup_tags
        ) VALUES (
          ${userId}, ${ACCOUNT_ID}, ${ins.symbol}, ${ins.venue}, ${ins.assetClass},
          ${direction}, ${openedAt.toISOString()},
          ${stillOpen ? null : closedAt.toISOString()},
          ${entry.toFixed(4)}, ${stillOpen ? null : exit.toFixed(4)}, ${qty},
          ${stillOpen ? null : (r * riskPts * qty * 18).toFixed(2)},
          ${stillOpen ? null : r.toFixed(3)},
          'seed', ${`seed-${n++}`},
          ${rand() < 0.4 ? sql.array([pick(['orb', 'vwap-fade', 'breakout', 'pullback'])]) : sql.array([])}
        ) RETURNING trade_id
      `
      trades.push({ tradeId: row!.tradeId, symbol: ins.symbol, venue: ins.venue, direction, openedAt, r })
    }
  }
  console.log(`trades ${trades.length}`)

  // ─── PREMATURE_EXIT phantoms: 24 resolved on NQ (clears the n>=20 gate),
  //     plus a sub-gate cell on ES ───────────────────────────────────────────
  let phantomCount = 0
  const nqTrades = trades.filter((t) => t.symbol === 'NQ' && t.r > 0)
  const esTrades = trades.filter((t) => t.symbol === 'ES')

  async function insertPrematureExit(t: (typeof trades)[number], resolved: boolean) {
    const spawned = new Date(t.openedAt.getTime() + 30 * 60000)
    // The road not taken usually had more to give; sometimes the exit was right
    const p50 = rand() < 0.7 ? range(0.2, 1.4) : -range(0.1, 0.8)
    const spread = range(0.5, 1.6)
    await sql`
      INSERT INTO phantom.phantoms (
        user_id, phantom_type, status, origin_trade_id,
        instrument_symbol, instrument_venue, asset_class, direction,
        cf_entry, cf_stop, cf_target, cf_size, cf_policy, param_provenance,
        spawned_at, expires_at, resolved_at, sim_version,
        outcome_r_p05, outcome_r_p50, outcome_r_p95,
        outcome_bars_held, outcome_exit_reason
      ) VALUES (
        ${userId}, 'PREMATURE_EXIT', ${resolved ? 'resolved' : 'active'}, ${t.tradeId},
        ${t.symbol}, ${t.venue}, 'futures', ${t.direction},
        ${21500 + range(-150, 150)}, ${21450 + range(-150, 150)}, ${21620 + range(-150, 150)}, 1,
        ${sql.json({ kind: 'hold_to_plan', time_stop_bars: 48 })},
        ${sql.json({ entry: 'observed', stop: 'observed', target: 'from plan' })},
        ${spawned.toISOString()}, ${new Date(spawned.getTime() + 5 * 86400000).toISOString()},
        ${resolved ? new Date(spawned.getTime() + range(1, 4) * 86400000).toISOString() : null},
        'v1.0',
        ${(p50 - spread).toFixed(3)}, ${p50.toFixed(3)}, ${(p50 + spread).toFixed(3)},
        ${Math.ceil(range(6, 48))}, ${resolved ? pick(['target', 'time_stop', 'stop']) : null}
      )
    `
    phantomCount++
  }

  for (let i = 0; i < Math.min(24, nqTrades.length); i++) await insertPrematureExit(nqTrades[i]!, true)
  for (let i = 0; i < Math.min(7, esTrades.length); i++) await insertPrematureExit(esTrades[i]!, true)

  // ─── ABANDONED_ENTRY phantoms via intent sessions ──────────────────────────
  async function insertAbandonedEntry(daysAgo: number, opts: { active?: boolean; score: number; resolvedPositive?: boolean }) {
    const ins = pickInstrument()
    const startedAt = sessionTime(daysAgo)
    const direction = rand() < 0.6 ? 'long' : 'short'
    const [session] = await sql<[{ sessionId: string }]>`
      INSERT INTO intent.sessions (
        user_id, instrument_symbol, instrument_venue, asset_class,
        started_at, ended_at, end_reason, event_count,
        inferred_direction, inferred_entry, inferred_stop, inferred_size
      ) VALUES (
        ${userId}, ${ins.symbol}, ${ins.venue}, 'futures',
        ${startedAt.toISOString()},
        ${new Date(startedAt.getTime() + range(3, 18) * 60000).toISOString()},
        'abandoned', ${Math.ceil(range(6, 30))},
        ${direction}, ${ins.px * (1 + range(-0.008, 0.008))}, ${ins.px * (1 - range(0.002, 0.006))}, 1
      ) RETURNING session_id
    `
    const spawned = new Date(startedAt.getTime() + 20 * 60000)
    const resolved = !opts.active
    const p50 = opts.resolvedPositive === false ? -range(0.2, 1.0) : range(0.3, 2.0)
    const spread = range(0.6, 1.8)
    await sql`
      INSERT INTO phantom.phantoms (
        user_id, phantom_type, status, origin_session_id, spawn_intent_score,
        instrument_symbol, instrument_venue, asset_class, direction,
        cf_entry, cf_stop, cf_size, cf_policy, param_provenance,
        spawned_at, expires_at, resolved_at, sim_version,
        outcome_r_p05, outcome_r_p50, outcome_r_p95,
        outcome_bars_held, outcome_exit_reason
      ) VALUES (
        ${userId}, 'ABANDONED_ENTRY', ${resolved ? 'resolved' : 'active'}, ${session!.sessionId}, ${opts.score},
        ${ins.symbol}, ${ins.venue}, 'futures', ${direction},
        ${ins.px * (1 + range(-0.008, 0.008))}, ${ins.px * (1 - range(0.002, 0.006))}, 1,
        ${sql.json({ kind: 'planned_bracket', time_stop_bars: 48 })},
        ${sql.json({ entry: 'inferred', stop: 'inferred' })},
        ${spawned.toISOString()}, ${new Date(spawned.getTime() + 5 * 86400000).toISOString()},
        ${resolved ? new Date(spawned.getTime() + range(1, 3) * 86400000).toISOString() : null},
        'v1.0',
        ${resolved ? (p50 - spread).toFixed(3) : null},
        ${resolved ? p50.toFixed(3) : null},
        ${resolved ? (p50 + spread).toFixed(3) : null},
        ${resolved ? Math.ceil(range(6, 48)) : null}, ${resolved ? pick(['target', 'time_stop', 'stop']) : null}
      )
    `
    phantomCount++
  }

  for (let i = 0; i < 6; i++) {
    await insertAbandonedEntry(Math.ceil(range(4, 38)), { score: range(0.75, 0.97), resolvedPositive: rand() < 0.65 })
  }
  // The open loop: one review-band phantom awaiting confirmation
  await insertAbandonedEntry(1, { active: true, score: 0.62 })
  await insertAbandonedEntry(3, { active: true, score: 0.81 })

  console.log(`phantoms ${phantomCount}`)
  console.log(`\nSeed complete. Sign in with:\n  ${EMAIL}\n  ${PASSWORD}`)
  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
