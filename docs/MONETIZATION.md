# MONETIZATION.md — Split-Roads

> Pricing logic in one line: **we charge against measured behavioral cost.** When the platform can show a trader that hesitation cost them $4,200 last quarter, a $79/month subscription is not a software expense — it is the cheapest coaching they will ever buy. Every tier below is priced as a small fraction of the behavioral cost it makes visible and addressable.

---

## 1. Willingness-to-pay context

- Trading journals (TraderSync, Tradezella, Edgewonk, Tradervue) sustain $30–80/mo for *backward-looking* analytics — the market's proven floor for "help me understand my trading."
- Trading psychology coaching runs $150–500/hour, unmeasured. We sell the measured version continuously.
- Prop firms pay $100–400/seat/mo for risk and evaluation tooling; their core business *is* trader evaluation, and they currently do it with ~30-trade outcome samples.
- Funded traders and serious independents already spend $100–300/mo on data, platforms, and tools. We slot into an existing budget line with a differentiated claim.

## 2. Tiers

### Retail — **Free** ($0)
Broker import (1 account), automated journal, basic R-analytics, 14-day insight history, monthly summary. **No phantoms, no DNA.**
*Role*: funnel + dataset (consented capture from free users still feeds aggregate density). The journal is genuinely useful free — that's the wedge promise — but everything counterfactual is paid: the moment a free user sees "3 phantoms were generated this week (upgrade to see them)," the value gap is visceral and self-demonstrating.

### Retail — **Trader** ($29/mo, $290/yr)
Everything free, plus: extension capture, 2 accounts, `PREMATURE_EXIT` + `ABANDONED_ENTRY` phantoms, Hesitation Cost + Exit Quality, weekly behavioral report, 90-day history.
*Anchor logic*: priced at journal-parity ($29 sits exactly in the incumbent band) while delivering a category they don't have — making the switch decision "same price, strictly more."

### Pro — **Pro** ($79/mo, $790/yr)
Everything Trader, plus: full phantom suite (conviction, sizing, stop, delayed types), Decision DNA with benchmarks, behavioral P&L attribution, coaching engine + recommendations, decision graph explorer, unlimited accounts/history, custom reports, API read access (personal).
*Anchor logic*: the serious-trader tier; one avoided behavioral mistake per quarter pays for the year. Target mix: 35–40% of paid B2C revenue on Pro by Phase 3.

### **Coach** ($149/mo + $10/client/mo)
Coach workspace: roster, consented client views, session prep packets, progress evidence, white-label weekly reports.
*Role*: revenue *and* distribution — each coach imports 10–50 traders whose subscriptions we also earn.

### Prop / Team — **Firm** ($120/seat/mo, volume-tiered to ~$70 at 500+ seats; eval-cohort pricing $15/eval-trader/mo)
Evaluation dashboards, behavioral scorecards, firm benchmarks, risk-behavior alerting, rule-adherence monitoring, admin/SSO, cohort management. Two-sided structure: cheap at eval stage (volume, data), full price for funded/desk seats (value).
*Anchor logic*: a single prevented account blowup or one better funding decision per month covers a desk's seats. Comparable risk tooling occupies the same band without behavioral depth.

### **Enterprise** (funds, large props — from $60k/yr, typical $100–250k)
Everything Firm, plus: PM/execution-behavior analytics, custom retention/residency, VPC deployment options, firm API, model provenance documentation, dedicated success. Custom-priced on seats + data scope.

### **API / Data** (Phase 5)
- Partner API (embeds, "powered by Split-Roads"): platform fee ($2–10k/mo) + per-MAU metering.
- Consented aggregate data products (behavioral indices, research datasets): annual licenses, $50–250k, k-anonymity-gated, **never individual grain** (constitutional law).

## 3. Packaging principles

1. **The counterfactual line is the paywall.** Past-facing analytics are cheap or free; forward/counterfactual intelligence is paid. This maps price exactly to differentiation.
2. **Never paywall trust surfaces**: privacy center, consent controls, data export, corrections — free at every tier, forever. Charging for trust controls would poison the dataset that funds everything.
3. **Annual-first** (2 months free): behavioral change and DNA need months to show compounding value; billing period should match the value arc — and it smooths the churn profile of a discretionary-income customer base.
4. **Usage caps, not feature crippling, inside a tier**: phantom budgets and history windows scale by tier; the *math is never degraded* (a cheap tier with dishonest statistics would damage the brand more than no tier).

## 4. Revenue projections

Assumptions stated so they can be argued with: B2C conversion free→paid 8–12% (journal incumbents report 5–15%); monthly churn 6% Trader / 4% Pro (annual mix improves blended); firm logo retention 90%. Scenarios are planning instruments, not promises.

### Base case

| Year (post-launch) | Paid B2C (avg) | B2C ARR | Coaches | Firm seats | B2B+Coach ARR | API/Data | **Total ARR** |
|---|---|---|---|---|---|---|---|
| Y1 (Ph 1–2) | 1,800 @ ~$35 blended | $0.76M | 20 | — | $0.06M | — | **~$0.8M** |
| Y2 (Ph 2–3) | 8,000 @ ~$42 | $4.0M | 150 | 600 | $1.4M | — | **~$5.4M** |
| Y3 (Ph 3–4) | 22,000 @ ~$46 | $12.1M | 400 | 3,500 | $7.0M | $0.4M | **~$19.5M** |
| Y4 (Ph 4–5) | 45,000 @ ~$48 | $25.9M | 800 | 9,000 | $16.6M | $2.5M | **~$45M** |

### Bear / bull deltas (Y3 snapshot)
- **Bear** (conversion 5%, prop wedge stalls): ~$7–9M ARR — survivable on B2C economics alone; forces Phase 4 delay, not death.
- **Bull** (coach channel compounds, 2 marquee firms reference-sell): ~$30M+ ARR with B2B crossing 50% a year early.

### Unit economics targets
- B2C: CAC ≤ $90 (content + coach channel keeps it organic-heavy), LTV ≥ $700 Pro / $350 Trader → blended LTV:CAC > 4.
- Firm: ACV $50–150k, CAC payback < 12 months, NRR ≥ 115% (seat expansion eval→funded→desk).
- Gross margin: 80%+ B2C (simulation compute is the COGS swing — phantom budgets and bar-close batching exist partly for this), 85%+ B2B.

## 5. Why users pay (the five questions, answered)

1. **Why does this matter?** It prices the invisible: the platform shows each user a personally-measured behavioral cost figure no other tool can compute.
2. **Why now?** The user sees their number within two weeks of install (premature-exit phantoms need only broker data). Time-to-quantified-pain is days, not months.
3. **Why defensible?** Price rides on the data moat: insights sharpen with corpus density (`DATA_MOAT.md` §3), so the paid product literally improves with company age while a copycat's equivalent tier starts hollow.
4. **Why will they keep paying?** The longitudinal record compounds: DNA trends, year-over-year comparisons, and personal baselines are worth more every month and reset to zero anywhere else.
5. **Why is the pricing hard to copy?** Anyone can copy the price card. The claim behind it — "we measured what your behavior costs, here's the evidence" — requires the engine, the calibration, and the elapsed capture time.
