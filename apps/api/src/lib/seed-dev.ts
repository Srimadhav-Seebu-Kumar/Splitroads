/**
 * Dev-only seed: multiple trader personas, each exercising different
 * component states so every surface can be inspected:
 *
 *   river@splitroads.dev  veteran   — gate crossed, published insights, open loops, trades today
 *   dawn@splitroads.dev   week two  — everything still accumulating (below n>=20)
 *   sol@splitroads.dev    disciplined — teal-dominant river (walking away was right)
 *   new@splitroads.dev    day one   — every empty state
 *
 * All share one password. Deterministic per-user PRNG: re-running rebuilds the
 * same worlds. Idempotent: wipes and rebuilds only these users. NEVER in prod.
 */
import postgres from 'postgres'

const DATABASE_URL = process.env['DATABASE_URL']
const API = process.env['SEED_API_URL'] ?? 'http://localhost:3001/api/v1'
const PASSWORD = 'splitroads-demo-2026'

if (!DATABASE_URL) {
  console.error('DATABASE_URL required')
  process.exit(1)
}
if (process.env['NODE_ENV'] === 'production') {
  console.error('Refusing to seed in production')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { transform: postgres.camel, onnotice: () => {} })

// ─── Deterministic PRNG (mulberry32) ─────────────────────────────────────────
function makeRng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const INSTRUMENTS = [
  { symbol: 'NQ', venue: 'CME', assetClass: 'futures', px: 21500, tick: 12 },
  { symbol: 'ES', venue: 'CME', assetClass: 'futures', px: 6050, tick: 3 },
  { symbol: 'CL', venue: 'NYMEX', assetClass: 'futures', px: 72.4, tick: 0.4 },
] as const
type Instrument = (typeof INSTRUMENTS)[number]

type Persona = {
  key: string
  email: string
  name: string
  tier: 'free' | 'trader' | 'pro' | 'coach' | 'firm'
  accountId: string
  weeks: number
  /** [min, max] trades on an active day */
  density: [number, number]
  winRate: number
  /** probability a phantom's median is positive (= behavioral cost, amber) */
  costBias: number
  nqExitPhantoms: number
  esExitPhantoms: number
  abandonedResolved: number
  openLoops: number
  insights: boolean
  tradesToday: number
}

const PERSONAS: Persona[] = [
  {
    key: 'veteran', email: 'river@splitroads.dev', name: 'River', tier: 'pro',
    accountId: '00000000-0000-0000-0000-000000000001',
    weeks: 8, density: [1, 3.5], winRate: 0.5, costBias: 0.72,
    nqExitPhantoms: 24, esExitPhantoms: 7, abandonedResolved: 8, openLoops: 2,
    insights: true, tradesToday: 3,
  },
  {
    key: 'rookie', email: 'dawn@splitroads.dev', name: 'Dawn', tier: 'trader',
    accountId: '00000000-0000-0000-0000-000000000002',
    weeks: 2, density: [0, 2], winRate: 0.41, costBias: 0.66,
    nqExitPhantoms: 9, esExitPhantoms: 3, abandonedResolved: 3, openLoops: 1,
    insights: false, tradesToday: 1,
  },
  {
    key: 'disciplined', email: 'sol@splitroads.dev', name: 'Sol', tier: 'trader',
    accountId: '00000000-0000-0000-0000-000000000003',
    weeks: 6, density: [0, 2.2], winRate: 0.57, costBias: 0.3,
    nqExitPhantoms: 22, esExitPhantoms: 6, abandonedResolved: 10, openLoops: 1,
    insights: true, tradesToday: 0,
  },
  {
    key: 'blank', email: 'new@splitroads.dev', name: 'New', tier: 'free',
    accountId: '00000000-0000-0000-0000-000000000004',
    weeks: 0, density: [0, 0], winRate: 0.5, costBias: 0.5,
    nqExitPhantoms: 0, esExitPhantoms: 0, abandonedResolved: 0, openLoops: 0,
    insights: false, tradesToday: 0,
  },
]

type SeedTrade = { tradeId: string; symbol: string; venue: string; direction: 'long' | 'short'; openedAt: Date; r: number }

async function ensureUser(p: Persona): Promise<string> {
  // Delete-then-register so the shared password always applies (cascade wipes data)
  await sql`DELETE FROM core.users WHERE email = ${p.email}`
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: p.email, password: PASSWORD, display_name: p.name }),
  })
  if (!res.ok) throw new Error(`register ${p.email} failed: ${res.status} ${await res.text()}`)
  const [user] = await sql<[{ userId: string }]>`SELECT user_id FROM core.users WHERE email = ${p.email}`
  if (!user) throw new Error(`user ${p.email} not found after register`)
  await sql`UPDATE core.users SET tier = ${p.tier}, display_name = ${p.name} WHERE user_id = ${user.userId}`
  return user.userId
}

async function buildPersona(p: Persona) {
  const rand = makeRng(hashSeed(p.email))
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!
  const range = (lo: number, hi: number) => lo + rand() * (hi - lo)
  const pickInstrument = (): Instrument => {
    const r = rand()
    if (p.key === 'disciplined') return r < 0.5 ? INSTRUMENTS[2]! : r < 0.8 ? INSTRUMENTS[1]! : INSTRUMENTS[0]!
    return r < 0.55 ? INSTRUMENTS[0]! : r < 0.8 ? INSTRUMENTS[1]! : INSTRUMENTS[2]!
  }
  const sessionTime = (daysAgo: number): Date => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - daysAgo)
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1)
    d.setUTCHours(14 + Math.floor(rand() * 6), Math.floor(rand() * 60), Math.floor(rand() * 60), 0)
    return d
  }

  const userId = await ensureUser(p)

  await sql`
    INSERT INTO trading.accounts (account_id, user_id, broker, label)
    VALUES (${p.accountId}, ${userId}, 'csv', ${`${p.name}'s futures account`})
    ON CONFLICT (account_id) DO UPDATE SET user_id = EXCLUDED.user_id
  `

  // ─── Trades ────────────────────────────────────────────────────────────────
  const trades: SeedTrade[] = []
  let extId = 0
  const totalDays = p.weeks * 7

  async function insertTrade(openedAt: Date, forceOpen = false) {
    const ins = pickInstrument()
    const direction = rand() < 0.6 ? 'long' : 'short'
    const win = rand() < p.winRate
    const r = win ? range(0.4, 2.7) : -range(0.3, 1.2)
    const stillOpen = forceOpen || (totalDays > 0 && rand() < 0.02)
    const entry = ins.px * (1 + range(-0.01, 0.01))
    const riskPts = ins.tick * range(2, 6)
    const exit = direction === 'long' ? entry + r * riskPts : entry - r * riskPts
    const qty = Math.ceil(range(1, 4))
    const closedAt = new Date(openedAt.getTime() + range(4, 95) * 60000)
    const [row] = await sql<[{ tradeId: string }]>`
      INSERT INTO trading.trades (
        user_id, account_id, instrument_symbol, instrument_venue, asset_class,
        direction, opened_at, closed_at, avg_entry, avg_exit, quantity,
        realized_pnl, r_multiple, source, external_id, setup_tags
      ) VALUES (
        ${userId}, ${p.accountId}, ${ins.symbol}, ${ins.venue}, ${ins.assetClass},
        ${direction}, ${openedAt.toISOString()},
        ${stillOpen ? null : closedAt.toISOString()},
        ${entry.toFixed(4)}, ${stillOpen ? null : exit.toFixed(4)}, ${qty},
        ${stillOpen ? null : (r * riskPts * qty * 18).toFixed(2)},
        ${stillOpen ? null : r.toFixed(3)},
        'seed', ${`seed-${p.key}-${extId++}`},
        ${rand() < 0.4 ? sql.array([pick(['orb', 'vwap-fade', 'breakout', 'pullback'])]) : sql.array([])}
      ) RETURNING trade_id
    `
    trades.push({ tradeId: row!.tradeId, symbol: ins.symbol, venue: ins.venue, direction, openedAt, r })
  }

  for (let day = totalDays; day >= 1; day--) {
    const n = rand() < 0.45 ? 0 : Math.floor(range(p.density[0], p.density[1] + 0.2))
    for (let k = 0; k < n; k++) await insertTrade(sessionTime(day))
  }
  for (let k = 0; k < p.tradesToday; k++) {
    const t = new Date()
    t.setUTCHours(14 + k, Math.floor(rand() * 60), 0, 0)
    await insertTrade(t, k === 0 && p.key === 'veteran')
  }

  // ─── PREMATURE_EXIT phantoms (attach to trades of a given symbol) ───────────
  async function insertPrematureExit(symbol: string, count: number) {
    const pool = trades.filter((t) => t.symbol === symbol)
    if (pool.length === 0 || count === 0) return
    const base = INSTRUMENTS.find((i) => i.symbol === symbol)!
    for (let i = 0; i < count; i++) {
      const t = pool[i % pool.length]!
      const spawned = new Date(t.openedAt.getTime() + 30 * 60000)
      const p50 = rand() < p.costBias ? range(0.2, 1.5) : -range(0.1, 0.8)
      const spread = range(0.5, 1.6)
      await sql`
        INSERT INTO phantom.phantoms (
          user_id, phantom_type, status, origin_trade_id,
          instrument_symbol, instrument_venue, asset_class, direction,
          cf_entry, cf_stop, cf_target, cf_size, cf_policy, param_provenance,
          spawned_at, expires_at, resolved_at, sim_version,
          outcome_r_p05, outcome_r_p50, outcome_r_p95, outcome_bars_held, outcome_exit_reason
        ) VALUES (
          ${userId}, 'PREMATURE_EXIT', 'resolved', ${t.tradeId},
          ${base.symbol}, ${base.venue}, 'futures', ${t.direction},
          ${base.px + range(-150, 150)}, ${base.px - range(30, 150)}, ${base.px + range(60, 220)}, 1,
          ${sql.json({ kind: 'hold_to_plan', time_stop_bars: 48 })},
          ${sql.json({ entry: 'observed', stop: 'observed', target: 'from plan' })},
          ${spawned.toISOString()}, ${new Date(spawned.getTime() + 5 * 86400000).toISOString()},
          ${new Date(spawned.getTime() + range(1, 4) * 86400000).toISOString()}, 'v1.0',
          ${(p50 - spread).toFixed(3)}, ${p50.toFixed(3)}, ${(p50 + spread).toFixed(3)},
          ${Math.ceil(range(6, 48))}, ${pick(['target', 'time_stop', 'stop'])}
        )
      `
    }
  }
  await insertPrematureExit('NQ', p.nqExitPhantoms)
  await insertPrematureExit('ES', p.esExitPhantoms)

  // ─── ABANDONED_ENTRY phantoms via intent sessions ───────────────────────────
  async function insertAbandoned(daysAgo: number, opts: { active?: boolean; score: number }) {
    const ins = pickInstrument()
    const startedAt = sessionTime(Math.max(1, daysAgo))
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
    // Append a heuristic score row (the training label target for the correction loop)
    await sql`
      INSERT INTO intent.scores (session_id, intent_score, model_id, feature_snapshot)
      VALUES (${session!.sessionId}, ${opts.score.toFixed(3)}, 'heuristic@1.0',
              ${sql.json({ ticket_opened: 1, size_entered: opts.score > 0.7 ? 1 : 0, hover_dwell_norm: range(0.2, 0.9) })})
    `
    const resolved = !opts.active
    const p50 = rand() < p.costBias ? range(0.3, 2.1) : -range(0.2, 1.0)
    const spread = range(0.6, 1.8)
    await sql`
      INSERT INTO phantom.phantoms (
        user_id, phantom_type, status, origin_session_id, spawn_intent_score,
        instrument_symbol, instrument_venue, asset_class, direction,
        cf_entry, cf_stop, cf_size, cf_policy, param_provenance,
        spawned_at, expires_at, resolved_at, sim_version,
        outcome_r_p05, outcome_r_p50, outcome_r_p95, outcome_bars_held, outcome_exit_reason
      ) VALUES (
        ${userId}, 'ABANDONED_ENTRY', ${resolved ? 'resolved' : 'active'}, ${session!.sessionId}, ${opts.score.toFixed(3)},
        ${ins.symbol}, ${ins.venue}, 'futures', ${direction},
        ${ins.px * (1 + range(-0.008, 0.008))}, ${ins.px * (1 - range(0.002, 0.006))}, 1,
        ${sql.json({ kind: 'planned_bracket', time_stop_bars: 48 })},
        ${sql.json({ entry: 'inferred', stop: 'inferred' })},
        ${new Date(startedAt.getTime() + 20 * 60000).toISOString()},
        ${new Date(startedAt.getTime() + 5 * 86400000).toISOString()},
        ${resolved ? new Date(startedAt.getTime() + range(1, 3) * 86400000).toISOString() : null}, 'v1.0',
        ${resolved ? (p50 - spread).toFixed(3) : null},
        ${resolved ? p50.toFixed(3) : null},
        ${resolved ? (p50 + spread).toFixed(3) : null},
        ${resolved ? Math.ceil(range(6, 48)) : null}, ${resolved ? pick(['target', 'time_stop', 'stop']) : null}
      )
    `
  }
  for (let i = 0; i < p.abandonedResolved; i++) {
    await insertAbandoned(Math.ceil(range(4, totalDays || 30)), { score: range(0.75, 0.97) })
  }
  // Open loops: review-band score [0.5, 0.75) so the Today surface asks for confirmation
  for (let i = 0; i < p.openLoops; i++) {
    await insertAbandoned(1 + i, { active: true, score: range(0.5, 0.74) })
  }

  // ─── Published insights + profile metrics (showcase personas only) ──────────
  if (p.insights) {
    await sql`
      INSERT INTO profile.insights (user_id, kind, status, claim, action, severity, sample_n, published_at)
      VALUES (
        ${userId}, 'EXIT_QUALITY', 'published',
        ${sql.json({
          description: 'You capture 64% of available R on winning trades; the rest you hand back by exiting early.',
          metric: 'exit_efficiency', sample_n: 24, ci: '±9%',
        })},
        ${sql.json({ label: 'Adopt a rule: hold to plan target unless structure breaks.' })},
        'cost', 24, ${new Date(Date.now() - 2 * 86400000).toISOString()}
      )
    `
    await sql`
      INSERT INTO profile.insights (user_id, kind, status, claim, action, severity, sample_n, published_at)
      VALUES (
        ${userId}, 'DISCIPLINE_TREND', 'published',
        ${sql.json({
          description: 'Your exit discipline is up 11% this month, and it is statistically real.',
          metric: 'exit_efficiency_trend', sample_n: 41, ci: '±6%',
        })},
        ${sql.json({ label: 'Keep the current target rule; it is working.' })},
        'improvement', 41, ${new Date(Date.now() - 5 * 86400000).toISOString()}
      )
    `
    await sql`
      INSERT INTO profile.behavioral_metrics (
        user_id, window_days, hesitation_sessions_n, hesitation_sessions_pct,
        hesitation_cost_r_p50, hesitation_cost_r_p05, hesitation_cost_r_p95,
        premature_exits_n, exit_efficiency_p50, exit_cost_r_p50,
        plan_adherence_pct, stop_moved_pct, size_vs_plan_pct
      ) VALUES (
        ${userId}, 30, ${p.abandonedResolved}, 0.31, 0.62, -0.4, 2.1,
        ${p.nqExitPhantoms + p.esExitPhantoms}, 0.64, 0.42, 0.78, 0.18, 0.94
      )
    `
    await sql`
      INSERT INTO profile.dna_snapshots (user_id, as_of, window_days, dimensions)
      VALUES (${userId}, ${new Date().toISOString()}, 90, ${sql.json({
        conviction: { score: 0.58, ci: [0.47, 0.69], n: 48, trend: '+0.04' },
        hesitation: { score: 0.71, ci: [0.6, 0.82], n: 32, trend: '-0.02' },
        patience: { score: 0.44, ci: [0.33, 0.55], n: 41, trend: '+0.06' },
        discipline: { score: 0.66, ci: [0.55, 0.77], n: 50, trend: '+0.11' },
        recovery: { score: 0.52, ci: [0.4, 0.64], n: 28, trend: '+0.01' },
      })})
    `
  }

  const [{ phantoms }] = await sql<[{ phantoms: number }]>`
    SELECT COUNT(*)::int AS phantoms FROM phantom.phantoms WHERE user_id = ${userId}
  `
  console.log(`  ${p.email.padEnd(24)} tier=${p.tier.padEnd(7)} trades=${String(trades.length).padStart(3)} phantoms=${String(phantoms).padStart(3)}`)
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

async function main() {
  console.log('Seeding personas:')
  for (const p of PERSONAS) await buildPersona(p)
  console.log(`\nAll personas share password:  ${PASSWORD}`)
  console.log('Sign in as river@ (full), dawn@ (accumulating), sol@ (disciplined), new@ (empty).')
  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
