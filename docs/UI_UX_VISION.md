# UI_UX_VISION.md — Split-Roads

> Design constitution (from `CLAUDE.md` §3.7): calm by default; every number earns its pixels; uncertainty is rendered, not footnoted; progressive depth; the weekly rhythm is the spine. Plus the hard product laws: distributions not anecdotes (Law 1), coach never taunt (Law 4), zero friction at decision time (Law 5).

---

## 1. Design character

Traders spend their day inside screaming terminals — dense grids, blinking reds and greens, urgency by design. Split-Roads is **the quiet room they walk into afterward**. The visual identity is built on that contrast:

- **Temperature**: dark-first interface, low-chroma base palette, generous whitespace, no animation that isn't informative. One accent family for behavioral semantics: *cost* (warm amber — not red; red means "danger, act now," and we are never urgent), *improvement* (cool teal — not green; green means "profit," and we measure behavior, not P&L), *uncertainty* (translucency and band-shading, everywhere).
- **Typography**: a humanist sans for narrative, a tabular mono for numbers; numbers always tabular-aligned — this product lives and dies on whether its figures feel trustworthy.
- **Voice**: a sharp, kind coach. Second person, present tense, no exclamation marks, no emoji, no shame. Every cost statement arrives with its action (Law 4 is also a copy rule).
- **The signature visual**: the **split road** — a path that forks, the taken branch solid, the untaken branch rendered as a translucent band (its width = uncertainty). This motif *is* the brand: it appears in the logo, the phantom ledger, the equity-curve overlay, and the decision graph. One metaphor, rendered honestly, everywhere.

## 2. Information architecture

```
Split-Roads
├── Today          (daily glance — 30 seconds)
├── Journal        (trades, plans, tags — the familiar surface)
├── Phantoms       (the ledger + explorer)
├── Decision Graph (the causal record)
├── DNA            (behavioral profile + evolution)
├── Coaching       (insights, goals, recommendations)
├── Reports        (weekly ritual + monthly/custom)
└── Settings       (integrations, consent/privacy center, billing)
```

Three cadences govern everything (the spine): **daily glance** (Today), **weekly ritual** (Reports — the product's center of gravity), **monthly reflection** (DNA evolution). No surface is designed to maximize time-in-app; several are explicitly designed to end the session ("That's everything worth your attention today.").

## 3. Surface designs

### 3.1 Today (daily dashboard)

A single column, four blocks, no scrolling on desktop:
1. **Yesterday/today strip**: trades taken, intent sessions, phantoms spawned/resolved — counts with sparklines, not tables.
2. **One insight** — exactly one, the top-ranked published insight, as a sentence with its evidence chip ("Exit quality, last 30 trades: 64% of available R captured · n=30 · CI ±9%"). Tapping unfolds the distribution.
3. **Open loop**: anything awaiting the user — a review-band intent confirmation ("Were you planning this NQ long at 14:32? Confirm / Deny"), an unread weekly report. The confirmation card is the correction loop (`BX-013`) wearing its UX face: one tap, done, thank-you state.
4. **Quiet close**: "Nothing else needs you." — the anti-engagement signature.

### 3.2 Phantom Explorer

Two levels, enforcing Law 1 by structure:

- **Ledger (default)**: phantoms grouped by *pattern cell* (type × setup × period), never a raw chronological feed of single phantoms. Each cell card: count, aggregate R distribution as a horizontal band (p05–p95, median tick), trend arrow. Cells below the n≥20 evidence gate render as "accumulating — 12 of 20" with no numbers: visible progress, withheld judgment.
- **Detail (on demand)**: drilling into a cell lists member phantoms; drilling into a phantom shows the split-road chart — actual price path, the counterfactual band overlaid, entry/stop/target markers, provenance chips on every parameter ("stop: observed · target: from plan"), and the resolution distribution. A "this is one sample" reminder is permanent furniture on this view.
- **Tone guard in the chrome**: phantom outcomes are never colored profit-green/loss-red; they use the cost/improvement amber/teal of *behavioral* meaning, reinforcing that this is about decisions, not money envy.

### 3.3 Decision Graph

A horizontal flow, left to right, matching the canonical chain: `MARKET_EVENT → ATTENTION → INTENT → ACTION → OUTCOME`.

- Default view is **one decision episode** (not the whole graph — a hairball teaches nothing): the chart-open, the drawings, the session's intent-score trajectory as a rising/falling thread, the fork (executed solid / abandoned translucent), the outcome or phantom band.
- Episode browser along the bottom: filterable by instrument, setup, fork-type ("show me every episode where intent exceeded 80% and I walked away").
- Aggregate mode (Pro): fork-frequency Sankey — where do my decision chains break? At attention (never drew the level)? At intent→action (the hesitation gap)? Rendered as flow widths with the same translucent-band language.

### 3.4 Decision DNA (behavioral profile)

- **The reveal** (end of baseline period — the signature moment): a full-screen, slow-build sequence. Dimensions appear one at a time as horizontal position markers on population-distribution strips — *your* marker, on the curve of traders like you, with the credible interval drawn as a bracket. Copy is diagnosis-grade and specific: "You abandon 1 in 3 high-intent setups. Among futures day-traders, that's 78th percentile hesitation." The reveal ends with one chosen focus, not twelve scores — a diagnosis, then a prescription.
- **Steady state**: radar/strip hybrid — strips for reading single dimensions honestly (radar charts alone invite shape-gazing over comprehension), small radar as gestalt thumbnail. Every score shows its interval; low-confidence dimensions render visibly wider and labeled "early estimate."
- **Evolution view** (monthly cadence): dimension trajectories over months with intervention markers ("rule adopted here") — the page where the product proves it works, one user at a time.

### 3.5 Coaching Center

- **Insight feed**: ranked, paginated shallowly (3–5 visible; depth on request). Each card = claim sentence + evidence chip + one action button ("Adopt this rule", "Watch this pattern", "Dismiss"). Dismissals are respected silently and inform personalization (`AI-007`).
- **Goals**: at most **one active behavioral goal** at a time — a deliberate constraint (behavior change literature and Law-4 kindness agree: one focus). Goal page shows the phantom-verified evidence stream for/against, weekly check-in prompts, and the pre-registered success criterion set at adoption.
- **Recommendations** carry their counterfactual receipts inline: "No entries after 2 consecutive losses → would have saved 2.1R/mo over your last 6 months [CI 0.7–3.8] · see the 14 episodes." The CI and the episode list are one tap away, always.

### 3.6 Weekly Report (the ritual)

Designed as a 15-minute Sunday read, delivered as email summary + full in-app experience:
1. **The week in one sentence** (narration engine, tone-calibrated).
2. **Behavioral P&L bridge**: a waterfall from strategy expectancy to realized — hesitation, exit, sizing contributions as amber/teal bars with bands.
3. **Pattern watch**: the active goal's evidence this week.
4. **One thing for next week** — single, specific, evidence-backed.
5. **Improvement acknowledged with the same rigor as cost** (Law of the emotional contract): "Exit quality up 11% this month, and it's statistically real [n=41]."
Print/share-ready by design — this artifact is the product's organic-growth engine (traders share it with coaches and Discords).

## 4. User journeys

### Journey A — Independent trader, week zero to the reveal
1. **Lands** from a coach's shared weekly report → signup → connects IBKR (read-only, scopes explained in plain language) → journal populates in minutes. *Value before any capture is installed.*
2. Day 2: first `PREMATURE_EXIT` insight candidate accumulates silently; UI shows "watching your exits — 9 of 20 trades observed." Anticipation, not judgment.
3. Day 4: prompted (not forced) to install the extension; consent center shows the capture scopes as toggles with live previews of what each emits. Trust by legibility.
4. Week 2: first phantom cell crosses the gate → first real insight → "it saw something true" moment (the Phase-1 qualitative KPI).
5. Week 3–4: **DNA reveal** → one focus chosen → converts to Trader/Pro at the natural value peak (the paywall meets the user exactly when counterfactual value is felt, per `MONETIZATION.md` §3.1).

### Journey B — Prop eval trader, behavioral compliance
1. Joins via firm workspace invite; the **visibility matrix is the first screen**: exactly what the firm sees (scores, adherence aggregates) vs what stays private (raw events, notes) — accept or adjust before any data flows.
2. Trades on MT5; the EA captures silently (Law 5: nothing appears during market hours).
3. Daily: Today-surface shows rule-adherence state vs the firm's eval rules — *forward-looking* ("2 of 3 daily-loss budget used") not punitive.
4. A tilt-risk alert (opt-in, max one per session) fires after two fast losses: "Historically, your next trade in this state averages −1.4R. You said you'd stop here." — *his own* rule quoted back, never the firm's voice.
5. Passes eval; his behavioral scorecard becomes part of his funding review — data he owns and chose to share.

### Journey C — Coach with a roster
1. Coach workspace: roster view of consented clients, each a DNA thumbnail + week-delta + flag if the active goal regressed.
2. Before a session: one-click **session prep packet** — the client's week, the evidence behind the focus area, suggested talking points (narration engine, coach-voice).
3. In session, screen-shares the client's decision-graph episodes — replacing "how did the week feel?" with "let's look at Tuesday's abandoned long together."
4. Assigns the next behavioral goal in-product; progress is measured by the platform between sessions. The coach's value visibly compounds — and so does their referral motivation.

## 5. Interaction & accessibility standards

- **Latency**: reflective surfaces may be deliberate (200–400ms transitions acceptable); anything touching live capture or confirmations must be instant (<100ms perceived). Nothing in the product ever interrupts an external trading platform (Law 5 — the extension has *no* UI during market interaction beyond its toolbar state).
- **Empty states are promises**: every gated/empty surface states what will appear, what's needed, and shows accumulation progress. The product is honest about being early with a specific user the way it's honest about everything else.
- **Accessibility**: WCAG 2.1 AA; the amber/teal semantic palette is colorblind-safe by luminance separation and always paired with iconography; all distribution charts have tabular alternatives; full keyboard navigation (traders are keyboard people).
- **Responsive posture**: desktop-first for analysis surfaces, mobile-excellent for Today, insight cards, confirmations, and the weekly report (the companion-app scope, `PL-006`).
- **Anti-dark-pattern checklist in design review**: no urgency theater, no streaks for activity, no guilt copy, no infinite feeds, no notification bait. The checklist is signed off per release like a security review — the calm *is* the brand, and it is the easiest thing to erode one "growth idea" at a time.

## 6. The one-screen test

Every new surface must pass: *Can a tired trader, five minutes after the close on a losing day, look at this screen and feel that the product is on their side, telling them something true, with a way forward?* If the answer is no — too dense, too judgmental, too vague, too noisy — it doesn't ship. This test outranks aesthetics, and it is the UX restatement of the company's thesis: behavioral optimization, delivered kindly, with evidence.
