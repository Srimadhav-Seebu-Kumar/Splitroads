# CLAUDE.md — Split-Roads Master Project Document

> **Split-Roads** — *Track the trades you almost took.*
> Internal positioning: **Decision Intelligence Platform for Traders.**

This is the canonical project document. Every engineer, designer, and AI agent working on Split-Roads reads this first. When any other document conflicts with this one, this one wins. When this document is wrong, change it deliberately — never silently.

---

## Part I — Vision

### 1.1 The one-sentence thesis

Every trading platform on Earth records what traders **did**. Split-Roads is the first platform that records what traders **almost did** — and turns that invisible data into measurable, improvable behavioral performance.

### 1.2 The problem, stated precisely

A trader's P&L is the output of two multiplied factors:

```
P&L = (Quality of Strategy) × (Quality of Execution Behavior)
```

The entire trading-tools industry — charting, journaling, analytics, backtesting — attacks the first factor. Almost nothing attacks the second, even though for most traders the second factor is the dominant source of loss:

- **Hesitation**: a valid setup is identified, the order ticket is opened, and the trade is never placed. The setup works. The trader learns nothing, because nothing was recorded.
- **Premature exits**: a winning position is closed at +0.5R on a plan that called for +3R. The journal records a *win*. The behavior was a *failure*.
- **Conviction collapse**: a planned 2% position becomes a 0.5% position at the moment of execution. The trade wins. The sizing failure is invisible.
- **Emotional overrides**: a stop is moved, an exit is panicked, a revenge trade is taken. Each appears in the journal as an ordinary trade.
- **Missed opportunities**: the trade that was never taken appears nowhere at all.

The deepest problem: **traditional journals can only measure what happened.** The cost of hesitation, the cost of fear, the cost of under-sizing — these live in the counterfactual, the road not taken. Today that data is destroyed at the moment of decision, every day, for every trader in the world.

Split-Roads captures it.

### 1.3 What Split-Roads actually is

Three layers, each feeding the next:

1. **Intent Capture Layer.** Instruments the trader's workflow (broker integrations, platform plug-ins, browser extension, our own order-ticket front end) to record *decision signals*: charts opened, levels drawn, alerts set, tickets opened, sizes typed, buy buttons hovered, orders cancelled. These are **Intent Events** — not trades, but the shadow trades cast before they exist.

2. **Counterfactual Engine ("Phantoms").** When the Intent Engine infers sufficient intent (e.g., "87% probability this trader intended to go long EURUSD at 1.0850 with a 40-pip stop"), the platform spawns a **Phantom** — a simulated trade that tracks what *would have happened*. Phantoms are also spawned from real trades: the exit you almost held, the size you almost used, the stop you almost kept.

3. **Behavioral Intelligence Layer.** Phantoms are not the product; they are measurement instruments. Aggregated over weeks, they produce statements no other platform can make:
   - *"Hesitation cost you $4,200 this quarter. Your abandoned setups outperform your executed ones by 1.8R on average."*
   - *"You exit winners 2.3× too early. Your Premature-Exit Phantoms show +$11,300 left on the table."*
   - *"Your fear is profitable on Mondays and expensive on Thursdays."*

This rolls up into **Decision DNA** — a longitudinal behavioral profile — and a **Decision Graph** — the causal record of attention → intent → action → outcome.

### 1.4 Why this matters

- **For the trader**: the highest-leverage improvement available to a trader with a working strategy is behavioral, and today it is unmeasurable. We make it measurable, then improvable. Measurement precedes management.
- **For prop firms and funds**: trader evaluation today uses outcome statistics over small samples — statistically weak. Intent and counterfactual data multiplies the effective sample size per trader and reveals process quality directly. A firm that can see *why* a trader makes money can size capital allocations with far more confidence.
- **For the industry**: a dataset of human financial decision-making *under uncertainty, before commitment* has never existed. Its long-run value extends past trading into behavioral science and AI training data (pursued only with explicit consent and aggregation — see Data Principles).

### 1.5 Why now

1. **Broker API maturity.** Interactive Brokers, Tradier, Alpaca, Binance, Bybit, MetaTrader, TradingView webhooks — programmatic access to retail and prop order flow is now table stakes. Five years ago intent capture required being a broker. Today it requires integrations.
2. **AI capability inflection.** Intent inference from sparse, noisy event sequences is a sequence-modeling problem that transformers now handle well. Coaching that's personalized, contextual, and non-generic became possible roughly in 2023–2024. The Intent Engine could not have been built credibly before this.
3. **The journaling market has proven willingness to pay** (Tradervue, TraderSync, Edgewonk, Tradezella — tens of millions in combined ARR) while remaining backward-looking. The market is educated and underserved at the same time. That's the ideal entry condition.
4. **Prop-firm boom.** The funded-trader industry (FTMO, Topstep, Apex and hundreds of others) created tens of thousands of traders whose *livelihood depends on behavioral compliance* — and firms whose core business problem is evaluating trader behavior at scale. They are a concentrated, high-urgency B2B wedge.

### 1.6 Why it's defensible

Short answer: **the data cannot be retroactively collected.**

A competitor that clones our UI on day one still has zero intent events, zero phantoms, zero behavioral baselines. Intent data only exists if you were instrumenting the trader *at the moment of decision*. Every week of operation widens a gap that cannot be closed by capital. Full treatment in `docs/DATA_MOAT.md`, but the chain is:

```
Intent capture (proprietary instrumentation)
  → Phantom corpus (proprietary counterfactual outcomes)
    → Behavioral models trained on both (proprietary accuracy)
      → Better insights → more usage → more capture (flywheel)
        → Cross-trader benchmarks (network effect: each new trader
          makes everyone's percentiles more precise)
```

### 1.7 Anti-vision: what Split-Roads is NOT

State these as bluntly as the vision, because the gravitational pull toward each is real:

- **NOT a "trading multiverse simulator."** Phantoms are instrumentation, not entertainment. If a feature's main output is "whoa, look at this alternate timeline," kill it. If its output is "here is a measurable behavioral pattern and what it costs you," ship it.
- **NOT a regret machine.** Showing a trader "you'd be up $40k if you'd held" with no statistical context is psychologically harmful and analytically dishonest (single counterfactuals are noise). All phantom-derived insight is presented as *distributions over many decisions*, never as single-trade taunts. This is a hard product law, enforced in the design system.
- **NOT a signal service.** We never tell users what to trade. We tell them how *they* trade. The moment we generate trade ideas, we become a commodity competing with ten thousand signal sellers, and we destroy the trust that makes behavioral data flow.
- **NOT a broker.** We sit above execution venues, neutral to all of them. Neutrality is what lets every broker integrate with us.
- **NOT a backtester.** Backtesters answer "would this strategy have worked?" We answer "what is the gap between your decisions and your behavior?" Different question, different buyer, different moat.

---

## Part II — Product Philosophy

### 2.1 The Prime Directive

> **Phantoms are a mechanism. Behavioral insight is the product. Performance improvement is the outcome.**

Every feature must trace to one of three north stars, or it doesn't get built:

1. **Behavioral Optimization** — does this help the trader change a costly behavior?
2. **Decision Intelligence** — does this make a previously invisible decision pattern visible and quantified?
3. **Trading Performance Improvement** — does this plausibly move the user's P&L or risk-adjusted return?

### 2.2 Product laws

**Law 1 — Distributions, not anecdotes.** A single counterfactual is statistically meaningless and emotionally radioactive. Insights are only surfaced when backed by a minimum sample (configurable, default n ≥ 20 phantom-decision pairs) and shown with confidence intervals. The UI never leads with one phantom's P&L.

**Law 2 — Measurement before judgment.** The first weeks of a user's life are silent capture. We earn the right to coach by first demonstrating that we see them accurately. The "Decision DNA reveal" after the baseline period is the product's signature moment — it must feel like a diagnosis from someone who's been watching closely, because it is.

**Law 3 — The trader owns the narrative.** Behavioral data is intimate. The trader can see everything we infer about them, correct it (corrections are training signal), export it, and delete it. No dark inference.

**Law 4 — Coach, never taunt.** Tone calibration is a product feature, not a copywriting afterthought. Framing is forward-looking ("here's the pattern and the fix") not backward-shaming ("you blew it"). Loss-framed insights require an actionable next step attached, always.

**Law 5 — Zero added friction at decision time.** Intent capture must be invisible during trading. No popups, no confirmations, no "are you sure?" at the moment of execution. The trader's hot path is sacred. All reflection surfaces live outside market-decision moments (end of day, weekly review).

**Law 6 — Statistical honesty.** Counterfactual simulation has irreducible uncertainty (fills, slippage, the unobservable stop you never set). We model it explicitly, display it honestly, and refuse to print phantom P&L without uncertainty bounds. The credibility of the entire platform rests on quants being unable to dunk on our math. See `docs/PHANTOM_ENGINE.md`.

### 2.3 Who we serve, in order

| Priority | Segment | Job to be done | Why this order |
|---|---|---|---|
| P0 (wedge) | Serious independent traders (1–5 yrs, real money, plateaued) | "I know my problem is me. Show me exactly how, and fix it." | Highest pain-awareness, willing to pay, rich data emitters |
| P0 (wedge) | Prop-firm traders | "Pass the eval. Keep the funded account. Don't blow behavioral rules." | Livelihood depends on behavior; concentrated channels |
| P1 | Retail traders (newer) | "Stop bleeding money in ways I don't understand." | Volume + data, but churn-prone; serve after the wedge proves value |
| P1 | Trading coaches & psychology professionals | "Give me objective data on my clients instead of self-reports." | Force multiplier; each coach brings 10–50 traders |
| P2 | Prop firms & trading teams (B2B) | "Evaluate and develop traders on process, not 30-trade samples." | Highest ACV; needs the dataset and credibility built in P0/P1 |
| P2 | Hedge funds | "Quantify and improve PM/trader execution behavior." | Longest sales cycle, highest bar; enter only with proven models |

### 2.4 The emotional contract

A trading journal is a mirror; Split-Roads is an X-ray. That power demands care. The product must always feel like it is **on the trader's side, against their costly patterns** — never an auditor, never a judge. Concretely: insights celebrate measured improvement with the same statistical rigor used for deficits; "your hesitation cost is down 60% this month" is as important a deliverable as any warning. Traders who feel attacked churn. Traders who feel *seen* retain for years and tell other traders.

### 2.5 Strategy in one paragraph

Enter through serious independent and prop traders with a product that is *also* the best trading journal they've used (familiar surface, zero-effort import, automatic logging) so adoption requires no behavior change. Differentiate immediately with intent capture and phantom-derived insights nobody else can produce. Convert the resulting proprietary dataset into models that get measurably better with scale, then sell behavioral evaluation and development tooling to prop firms and funds at enterprise prices, on the strength of benchmarks and models no competitor can replicate without years of equivalent capture. The journal is the Trojan horse; the behavioral dataset is the empire.

---

## Part III — Architecture (Summary)

Full detail lives in `docs/SYSTEM_ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/AI_ARCHITECTURE.md`, `docs/PHANTOM_ENGINE.md`. This section states the load-bearing decisions and their rationale.

### 3.1 The shape of the system

Split-Roads is, at its core, **an event-sourcing system over human decisions**. Everything downstream — intent inference, phantoms, DNA, coaching — is a *derived view* over an immutable event log. This is the single most important architectural commitment:

```
[Capture Clients]                [Core]                        [Intelligence]
 browser extension   ─┐
 broker webhooks     ─┼─► Ingestion Gateway ─► Event Log ─► Stream Processors
 platform plug-ins   ─┤      (validate,        (immutable,      ├─► Intent Engine
 mobile app          ─┤       dedupe,           partitioned,    ├─► Phantom Engine
 manual entry        ─┘       enrich)           replayable)     ├─► Decision Graph builder
                                                                ├─► Decision DNA aggregator
                                                                └─► Analytics / Coaching
```

**Why event sourcing is non-negotiable here:**
1. Our models will improve for years. Replayability means every model upgrade can be retroactively applied to the full history — a 2027 intent model re-scores 2025 events. The dataset appreciates; it never has to be recollected.
2. Intent is inferred, therefore *revisable*. Derived state must be rebuildable; only the raw events are truth.
3. Auditability for enterprise: prop firms will demand to know exactly what was observed and when.

### 3.2 Core services

| Service | Responsibility | Notes |
|---|---|---|
| `ingestion-gateway` | Authn, schema validation, dedup, ordering, enrichment of inbound events | The only write path into the event log. Rate-limited per source. |
| `event-log` | Immutable, append-only store of Intent Events and Trade Events | Kafka/Redpanda topics → TimescaleDB/Postgres for durable query |
| `market-data-service` | Candles, ticks, reference data for simulation | Aggressive caching; phantom simulation is the dominant consumer |
| `intent-engine` | Scores intent probability per session/instrument in near-real-time | Heuristic v1 → learned model v2; see AI standards below |
| `phantom-engine` | Spawns, simulates, expires, and ranks phantoms | Stateless workers over a queue; see `docs/PHANTOM_ENGINE.md` |
| `decision-graph` | Maintains the Market Event → Attention → Intent → Action → Outcome graph | Postgres adjacency first; dedicated graph store only when proven necessary |
| `dna-aggregator` | Computes Decision DNA dimensions on schedule + on-event | All scores carry confidence; cold-start handled explicitly |
| `insight-service` | Turns statistics into ranked, deliverable insights | Owns Law 1/Law 4 enforcement programmatically |
| `coaching-service` | LLM-mediated coaching surface over insights + DNA | LLM never invents numbers; it narrates computed results only |
| `api-gateway` | Public/partner API, dashboards BFF | Versioned from day one |

### 3.3 Technology standards

Chosen for: small-team velocity now, no rewrite forced at 1000× scale, AI-ecosystem compatibility.

- **Languages**: **TypeScript** (product surfaces, API, capture clients), **Python** (ML, simulation, data pipelines). Nothing else without an ADR. Go is the pre-approved escape hatch if a hot path (ingestion, simulation inner loop) proves it with profiles, not vibes.
- **Backend**: Node/TypeScript services (NestJS or Fastify), Python with FastAPI for ML services. Monorepo (pnpm + Turborepo), modular monolith first — service boundaries enforced in code (module isolation + explicit interfaces) before they're enforced in deployment. Split a service out only when scaling or team boundaries demand it.
- **Event backbone**: Redpanda (Kafka API) from the start. The event log is the company; don't improvise it.
- **Storage**: PostgreSQL 16 + TimescaleDB as the system of record (events, trades, phantoms, graph, profiles). ClickHouse added in Phase 2+ for analytical workloads (cross-trader benchmarks, cohort queries). Redis for hot state (live intent sessions, leaderboards). Object storage (S3) for model artifacts and cold event archives. **No exotic databases without an ADR proving Postgres can't do it.**
- **Frontend**: Next.js + React + TypeScript, Tailwind, a single design system package. Charting via a single wrapped library (decide once: TradingView lightweight-charts for price, visx/d3 for decision-graph and DNA visuals).
- **Infra**: containerized, IaC (Terraform), deployed on a managed platform until ops pain is real (Phase 1: Vercel + managed Postgres + managed Redpanda is acceptable; Phase 2+: ECS/Kubernetes). Observability from day one: OpenTelemetry traces, structured logs, Grafana/Prometheus or a managed equivalent.
- **Security baseline** (non-negotiable, enforced in CI): parameterized queries only; secrets in a manager, never in code; TLS 1.2+ everywhere; Argon2id for credentials; row-level tenancy isolation for B2B; no PII or credentials in logs; rate limiting on every public endpoint; broker tokens encrypted at rest (AES-256-GCM) with rotation. Financial-behavior data is as sensitive as health data — treat it that way.

### 3.4 AI standards

1. **Heuristics before models, models before LLMs.** v1 of the Intent Engine is a transparent, hand-tuned scoring function. It ships sooner, it bootstraps labels, and it gives the learned model a baseline to beat. LLMs are reserved for language surfaces (coaching narration), never for numeric inference.
2. **Every inference carries provenance.** Stored intent scores record model version, feature snapshot, and timestamp. Required for replay, debugging, and enterprise audit.
3. **Calibration is the primary metric.** An intent model that says "80%" must be right ~80% of the time. We track Brier score and calibration curves before accuracy. Phantom spawning consumes probabilities; miscalibration poisons everything downstream.
4. **The LLM narrates; it never computes.** Coaching text is generated strictly from a structured payload of pre-computed statistics. Any number in coaching output must appear in the payload. Hallucinated statistics are a sev-1 product defect.
5. **Human corrections are gold.** Every user correction ("I wasn't planning that trade" / "yes, I meant to take that") is captured as a labeled example. The correction UX is part of the data strategy, not a support feature.
6. **Honest cold start.** Models degrade gracefully to population priors with widened uncertainty for new users, and the UI says so ("early estimate — improves over your first 3 weeks").

### 3.5 Coding standards

- **TypeScript**: `strict: true`, no `any` in non-test code, ESLint + Prettier enforced in CI. Zod schemas at every system boundary (API inputs, event payloads, LLM payloads) — types alone don't validate at runtime.
- **Python**: 3.12+, full type hints, Pydantic models at boundaries, ruff + mypy in CI.
- **Events are contracts.** Every event type has a versioned schema in `packages/contracts` (the shared schema package). Schema changes are additive-only; breaking changes mean a new version, never mutation. The event log is forever — treat schemas like a public API.
- **Testing**: unit tests for all scoring/simulation math (property-based where applicable — simulation code especially); golden-file tests for phantom outcomes against recorded market data; integration tests over the event pipeline (emit events → assert derived state). Simulation correctness bugs are silent and catastrophic; this is where test rigor concentrates.
- **Naming conventions** (canonical vocabulary — use these exact terms in code, schemas, UI, and docs):
  - `IntentEvent` — a captured decision signal. Never "user event," never "activity."
  - `IntentSession` — a clustered sequence of intent events around one instrument/timeframe.
  - `intent_score` — probability in [0,1]. Never "confidence" (reserved for model uncertainty).
  - `Phantom` — a counterfactual simulation. Types: `ABANDONED_ENTRY`, `DELAYED_ENTRY`, `PREMATURE_EXIT`, `DELAYED_EXIT`, `CONVICTION`, `POSITION_SIZE`, `STOP_PLACEMENT`, `OPPOSITE_PERSONALITY`.
  - `DecisionNode` / `DecisionEdge` — graph elements, node kinds: `MARKET_EVENT`, `ATTENTION`, `INTENT`, `ACTION`, `OUTCOME`.
  - `DecisionDNA` — the behavioral profile; individual measures are `dna_dimensions`.
  - `Insight` — a statistically-validated, user-deliverable finding. Drafts that haven't passed sample-size/significance gates are `candidate_insights` and must never reach a user surface.
  - Database: `snake_case` tables/columns, plural table names, `*_at` timestamps (UTC), `*_id` UUIDv7 keys. Code: `camelCase` TS, `snake_case` Python, `PascalCase` types/classes. Services: `kebab-case`.
- **Money and prices**: integer minor units or `NUMERIC` — never floats — with explicit currency. R-multiples and scores are decimals with documented precision. Timestamps are UTC everywhere; exchange-local time is a display concern only.

### 3.6 Engineering principles

1. **The event log is sacred.** Append-only, never mutated, never "cleaned up." Storage is cheap; this dataset is the company.
2. **Derived state is disposable.** Any projection (graph, DNA, insights) must be rebuildable from the log by replay. If a rebuild is scary, the architecture has drifted — fix it.
3. **Boring technology, novel product.** Innovation budget is spent on intent inference and counterfactual simulation. Infrastructure should be so conventional it's dull.
4. **Latency budget where it matters.** Capture path: must never degrade the trader's tooling (extension overhead < 5ms per event, fire-and-forget with local buffering). Insight path: minutes is fine. Don't engineer real-time where reflection is the use case.
5. **Idempotency everywhere.** Capture clients retry; brokers send duplicate webhooks; every event carries a client-generated idempotency key.
6. **Design for replay-driven development.** New model or new phantom type? Prove it by replaying six months of real events and diffing outputs before it touches production paths.

### 3.7 Design principles (product surface)

1. **Calm by default.** Traders live in screaming dashboards all day. Split-Roads is the quiet room: generous whitespace, restrained palette, no blinking anything. Reflection has a different visual temperature than execution.
2. **Every number earns its pixels.** No vanity stats. If a metric doesn't connect to a decision the trader can change, it doesn't ship.
3. **Uncertainty is rendered, not footnoted.** Ranges, bands, and confidence shading are first-class visual citizens. A phantom P&L is a distribution; draw it as one.
4. **Progressive depth.** Headline insight → supporting distribution → individual decision records, in that order, on every surface. The user chooses how deep to go.
5. **The weekly rhythm is the spine.** Daily glance (30s), weekly review (15min, the core ritual), monthly DNA evolution. Surfaces are designed around these cadences, not around "engagement."

### 3.8 Data principles

1. **Consent is explicit and granular.** Capture scopes (what we observe) are individually toggleable and legible to a non-lawyer. Default posture: capture broadly *for the user's own analysis*; cross-user/benchmark use requires separate opt-in.
2. **The trader owns their record.** Full export (machine-readable, including raw events), full deletion (hard delete from system of record; aggregate de-identified statistics may persist, and the policy says so plainly).
3. **Aggregation threshold.** No benchmark, cohort statistic, or research output is ever computed over fewer than k traders (k ≥ 50) — small cohorts can deanonymize.
4. **Behavioral data is never sold at individual grain. Ever.** B2B products operate on aggregates, percentiles, and models — or on traders who explicitly joined a firm's workspace and know exactly what their firm sees (the per-field visibility matrix is a product surface, not a legal PDF).
5. **Models are part of the data estate.** Training datasets are versioned, lineage-tracked, reproducible. We will someday need to prove what a model was trained on.

---

## Part IV — Roadmap & Anti-Goals

### 4.1 Roadmap (summary — full version in `docs/PRODUCT_ROADMAP.md`)

| Phase | Name | Theme | Exit criteria |
|---|---|---|---|
| 1 | **The Mirror** (mo 0–6) | Best-in-class automated journal + intent capture v1 + first phantom types | 1k WAU, 40%+ w4 retention, intent capture proven on 2 platforms, first paid conversions |
| 2 | **The X-Ray** (mo 6–14) | Learned intent model, full phantom suite, Decision DNA reveal, weekly report | DNA validated against outcomes, ≥3k paid, phantom math survives quant scrutiny publicly |
| 3 | **The Coach** (mo 14–24) | Coaching engine, goals/interventions, coach workspace, measurable user improvement | Documented behavioral improvement in cohort study; coach-led distribution loop running |
| 4 | **The Firm** (mo 24–36) | Prop/team product: evaluation, benchmarks, risk-behavior alerts, admin/compliance | 10+ firm deployments, benchmark dataset defensibly unique, enterprise ACV proven |
| 5 | **The Standard** (mo 36+) | API platform, behavioral data products (aggregate, consented), embedded distribution | Split-Roads scores referenced by firms in hiring/allocation; platform revenue material |

### 4.2 Anti-goals

Things we are deliberately **not** doing, so nobody has to relitigate them:

1. **No trade signals or recommendations of what to buy/sell.** Kills neutrality, kills trust, commoditizes us. Permanent.
2. **No execution/brokerage.** We integrate with everyone precisely because we compete with no one.
3. **No social feed.** Public P&L comparison feeds the exact pathologies we're treating. (Anonymous *behavioral* benchmarking is different and in scope.)
4. **No gamification of trading activity.** Streaks and badges for *trading more* are disqualifying. We may celebrate *behavioral* milestones (discipline, plan-adherence) — carefully.
5. **No "multiverse" entertainment features.** Phantom data is presented as statistics, not as alternate-reality storytelling. (Marketing may flirt with the metaphor; the product may not.)
6. **No crypto-token anything.** Obvious, but written down.
7. **No engagement-maximization mechanics.** Success metric is user improvement and retention through value, not session count. A trader who checks in 20 minutes a week and improves is a triumph.
8. **No selling individual behavioral data.** Restated from Data Principles because it is the one decision that could kill the company in a headline.

### 4.3 Honest risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Intent inference is too noisy → phantom spawning garbage | Existential | Heuristic v1 with conservative thresholds; user confirmation loop generates labels; precision over recall always |
| Counterfactual math gets publicly debunked | Existential | Conservative fill models, explicit uncertainty, publish the methodology, invite quant scrutiny early |
| Capture friction (extension/integration setup) kills activation | High | Broker-import-first onboarding delivers value before any capture is installed; capture is an upgrade, not a prerequisite |
| Regret UX harms users → churn + reputation | High | Product Laws 1 & 4 enforced programmatically in `insight-service`; tone-test all loss-framed insights |
| Platform dependence (TradingView/broker ToS) | Medium | Multi-source capture from day one; own order-ticket surface in Phase 2+ reduces dependence |
| Privacy backlash | High | Data principles above; radical transparency as marketing asset, not compliance cost |
| Market-size skeptics ("journaling is niche") | Medium | Journaling is the wedge, not the market; B2B behavioral evaluation is the market |

### 4.4 How to use this document

- New engineer? Read Parts I–III, then `CURRENT_WORKING_DIRECTION.md` for what we're building *this month*, then the deep-dive doc for your area.
- Making a product decision? Check the Prime Directive (§2.1), the laws (§2.2), and the anti-goals (§4.2). If the decision contradicts none of them and serves a north star, you have latitude — move.
- Making an architectural decision? §3.1 and §3.6 are the constraints. Anything else needs an ADR in `docs/adr/`.

*Document owner: founding team. Review cadence: monthly, and at every phase transition.*

