# CURRENT_WORKING_DIRECTION.md

> **What are we building RIGHT NOW?**
> Last updated: 2026-06-12 (build session 1) · Owner: founding team · Review: weekly, Monday

This file is deliberately short and deliberately bossy. If a task isn't justified by this file, it waits.

---

## Current Milestone

**Milestone 1 of Phase 1 ("The Mirror"): the journal that sees what you almost did.**

A trader can: connect a broker → get an automatically populated, genuinely excellent journal → install the TradingView extension → and within two weeks see their **first Abandoned-Entry and Premature-Exit phantoms with an honest Hesitation Cost number.**

That end-to-end loop — capture → infer → simulate → insight — running on real users with real money, is the milestone. Nothing else is.

## Current Priorities (in order)

1. **Event backbone** (`CF-005`): ingestion gateway + immutable event log + contracts package. Everything is a view over this. Get the schemas right; they are forever.
2. **Broker import + auto journal** (`CF-001`, `CF-002`, `CF-018`): start with **two** brokers done excellently (IBKR + one crypto/FX source based on first-cohort demand), CSV fallback for everyone else.
3. **TradingView extension capture v1** (`CF-004`, `CF-015`): chart open/close, drawings, alerts, order-ticket interactions, hover dwell. Consent center ships *with* it, not after it.
4. **Heuristic intent scorer** (`CF-006`, `CF-007`): transparent, conservative, explainable. Precision over recall — a false phantom costs more trust than a missed one.
5. **First two phantom types** (`CF-009` first — it works from broker data alone; then `CF-008`) on top of the market-replay service (`SIM-002`) with the conservative fill model (`SIM-003`) and uncertainty bands (`SIM-012`) from day one.
6. **The surfaces**: daily dashboard (`CF-012`), phantom ledger (`CF-010`), weekly report (`CF-013`), correction loop (`BX-013`).

## MVP Scope (the whole of it)

- 2 broker integrations + CSV import
- Automated journal with R-analytics and setup tagging
- TradingView extension with granular consent
- Heuristic intent scoring (no ML)
- 2 phantom types: `PREMATURE_EXIT`, `ABANDONED_ENTRY`
- Hesitation Cost + Exit Quality as the two headline metrics
- Daily dashboard, phantom ledger, weekly email report
- Auth/MFA, billing (Free + Trader tier), privacy center, data export/delete
- Observability on the capture pipeline (silent capture failure is silent moat erosion)

## What to IGNORE right now

- **No ML models.** The heuristic scorer ships first and bootstraps labels. (`AI-001+` waits for Phase 2.)
- **No Decision DNA surface.** We *accrue* the underlying metrics silently (plan adherence, hesitation rates) but build no profile UI yet.
- **No coaching engine, no LLM features.** The weekly report uses templated language over computed stats.
- **No Decision Graph explorer.** The event log *is* the graph's raw material; the projection and UI wait.
- **No teams, coaches, firms, enterprise anything.** Single-player only.
- **No mobile app.** Responsive web is enough for MVP review surfaces.
- **No MT4/5 EA yet** — it unlocks the prop wedge in Phase 2; building two capture clients at once would sink the milestone.
- **No exotic phantom types** (conviction, sizing, opposite-personality). Two types, done honestly, beat six done loosely.
- **No public API, no benchmarks, no cohort analytics** (we don't have the user count for k≥50 anyway).

## Build Session 1 — DONE ✓

| Item | Status |
|---|---|
| pnpm + Turborepo monorepo | ✓ |
| `packages/contracts` — Zod event schemas (forever) | ✓ |
| `packages/db` — 6 migration files (core/trading/events/intent/phantom/profile) | ✓ |
| Docker Compose (Postgres/Timescale, Redpanda, Redis) | ✓ |
| `apps/api` — Fastify: auth, trade import, journal, phantom, dashboard routes | ✓ |
| Heuristic intent scorer (transparent, named weights) | ✓ |
| `PREMATURE_EXIT` phantom engine (256-path Monte Carlo, p05/p50/p95) | ✓ |
| CSV connector (multi-platform column aliases) | ✓ |
| `apps/web` — Next.js: Today dashboard, Journal, Phantom Ledger, Login, DNA stub | ✓ |
| All TypeScript strict — 0 errors | ✓ |

## Next 30 Days (updated)

| Week | Target |
|---|---|
| 1 (now) | Docker up + run migrations + dogfood: import real trades, see first PREMATURE_EXIT phantoms |
| 2 | IBKR broker connector via IBKR Flex Reports API; R-analytics charts on journal page |
| 3 | TradingView browser extension v1 (chart.opened, ticket events, hover dwell) + consent center |
| 4 | Intent session clustering + ABANDONED_ENTRY phantoms end-to-end; correction loop UI |

## Next 90 Days

- Days 30–60: TradingView extension + consent center → intent sessions → heuristic scorer → `ABANDONED_ENTRY` phantoms live. Correction loop shipped (label collection starts). Daily dashboard + phantom ledger.
- Days 60–90: Weekly report + hesitation/exit-quality metrics with uncertainty bands. Billing live. Private beta: 50–100 hand-recruited serious traders (target: futures/FX day traders + funded-account holders). Instrument activation, w2/w4 retention, correction rates, capture health.
- Day 90 gate (go/no-go for Phase 1 continuation): ≥60% of beta users with extension installed still emitting events in week 4; ≥1 "this saw something true about me" moment per user interview; phantom math survives our own red-team review.

## Standing reminders

- Every event schema change is forever — review accordingly.
- Precision over recall on intent. Always.
- No insight without sample-size gating, even in MVP (Law 1).
- The hot path is sacred: capture must never add friction at decision time (Law 5).
