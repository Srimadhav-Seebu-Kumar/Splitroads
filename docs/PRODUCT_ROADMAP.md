# PRODUCT_ROADMAP.md — Split-Roads

> Five phases, each with a name that states its thesis. Phases gate on **exit criteria, not dates** — dates below are planning estimates, not promises. Every phase carries a *dataset milestone* (per `DATA_MOAT.md` §6.4): the corpus is a deliverable.

---

## Phase 1 — **The Mirror** (months 0–6)

*Thesis: earn the right to exist by being the journal that sees what you almost did.*

**Goals**
- Ship the end-to-end loop: capture → infer (heuristic) → simulate (2 phantom types) → insight, on real users with real money.
- Establish the event backbone and contracts that everything else replays from — the architecture decisions made here are the ones we live with.
- Recruit a beta cohort of serious traders who feel *seen*, and convert the first cohort to paid.

**Features** (detail in `CURRENT_WORKING_DIRECTION.md`): CF-001/002/003/005/006/007/015/016/017/018/020, CF-008/009/010/011/012/013, SIM-001/002/003/010/012, BX-007/013, PL-001/002/003/004/008/012/014, AI-006 (gating logic, templated narration).

**Staffing** (7): 2 founding full-stack (TS), 1 data/backend (pipeline + Timescale), 1 quant-minded Python eng (simulation + market data), 1 frontend/design hybrid, 1 founder-PM, 1 founder-eng. No dedicated ML hire yet — the heuristic scorer is deliberately pre-ML.

**Risks**
- Extension capture fragility on TradingView DOM changes → contract tests against recorded DOM fixtures; capture-health paging; webhook fallback path.
- Phantom math embarrassment → internal red-team review before any public number; conservative-by-policy fills.
- Building journal-parity features consumes the whole phase → strict MVP scope discipline; parity means "excellent at the core," not feature-complete vs 10-year-old incumbents.

**KPIs / exit criteria**
- 1,000 WAU; ≥40% week-4 retention among extension installers; ≥60% of beta still emitting events in week 4.
- First paid conversions at Trader tier; qualitative bar: ≥1 "it saw something true about me" per user interview.
- **Dataset milestone**: 1M+ intent events, 10k+ resolved phantoms, 2k+ correction labels.

---

## Phase 2 — **The X-Ray** (months 6–14)

*Thesis: from recording behavior to understanding it — the learned models and the DNA reveal.*

**Goals**
- Replace heuristics with calibrated learned intent (shadow → champion), ship the full phantom suite, and deliver the Decision DNA reveal as the product's signature moment.
- Open the prop wedge: MT4/5 capture EA.
- Survive public quant scrutiny: publish the phantom methodology and calibration audits.

**Features**: AI-001/002/004/005/011/013, SIM-004–009/011/013, BX-001–006/008/014, CF-014/019 (full), AN-001/003/004/005/006/008/010, PL-005/010/011/013, AN-002 (graph explorer), BX-009 (first benchmarks where k≥50 cells exist).

**Staffing** (12–14): +2 ML engineers, +1 data engineer, +1 backend, +1 designer, +1 support/community (beta traders are the label pipeline — treat them accordingly).

**Risks**
- Learned model fails to beat heuristic on calibration → acceptable outcome, heuristic stays champion; the phase does not gate on ML winning, it gates on *honest evaluation infrastructure existing*.
- DNA reveal lands as horoscope, not diagnosis → validation gates (`AI_ARCHITECTURE.md` §5) are exit criteria, not aspirations; no reveal ships without predictive-validity evidence.
- Public methodology invites a takedown → that's the point; better in month 10 from a blogger than in year 3 from a fund's due diligence.

**KPIs / exit criteria**
- ≥3,000 paid; w4 retention ≥50% for extension users; intent Brier beats heuristic baseline with reliability deviation <5pp/decile.
- DNA dimensions pass test-retest + predictive-validity gates.
- **Dataset milestone**: 20M+ intent events, 250k+ phantoms, first benchmark cells at k≥50.

---

## Phase 3 — **The Coach** (months 14–24)

*Thesis: from diagnosis to treatment — prove the platform changes behavior, measurably.*

**Goals**
- Ship the coaching loop: recommendations with counterfactual evidence, behavioral goals, intervention tracking, personalized narration.
- Run and publish a cohort study: do Split-Roads users measurably reduce behavioral costs? (The company's central claim gets tested here.)
- Launch the coach workspace; coaches become a distribution channel.

**Features**: AI-007/010/012, BX-010/011/012, EN-010, AN-009/011, PL-006 (mobile companion), AI-008 (pre-tilt, guarded rollout), AI-003/009.

**Staffing** (18–22): +1 behavioral scientist (real one — owns study design and the human audit), +2 product eng, +1 ML, +1 growth, +1 coach-partnerships.

**Risks**
- Interventions don't move behavior → the existential bet, faced squarely: study runs with pre-registered metrics; a null result redirects the company toward measurement/evaluation value (which Phase 4 monetizes regardless) rather than coaching claims.
- Coaching tone misfires at scale → payload-fidelity checks + tone screening + slow rollout cohorts.
- Pre-tilt alerts annoy → alert-budgeted, opt-in, precision-tuned; kill switch per user.

**KPIs / exit criteria**
- Documented, statistically honest behavioral improvement in the study cohort (pre-registered endpoints).
- ≥10k paid; coach-attached users ≥15% of new revenue; mobile weekly-report open rate ≥60%.
- **Dataset milestone**: intervention-response dataset exists (the deepest moat stratum begins).

---

## Phase 4 — **The Firm** (months 24–36)

*Thesis: sell process-quality evaluation to the businesses whose P&L depends on it.*

**Goals**
- Productize the firm offer: evaluation dashboards, scorecards, firm benchmarks, risk-behavior alerting, compliance monitors — on the consent-matrix foundation.
- Land 10+ prop firms; first fund pilots; enterprise identity/controls.
- Eval-pass prediction trained on consented cohorts.

**Features**: EN-001–009/012, AI-015, PL-007/009, FUT-009/011 selectively.

**Staffing** (28–35): +enterprise AE pair, +solutions engineer, +security/compliance lead (SOC 2 lands here), +2 backend, +1 data, +legal counsel (data governance).

**Risks**
- Trader-vs-firm trust tension (will traders accept firm visibility?) → consent matrix is trader-controlled and legible; firm products consume scores/aggregates, not raw streams; this posture is the *sales pitch*, not its obstacle.
- Long enterprise cycles starve focus → B2C remains the engine; firm deals are pulled by inbound evidence (Phase 3 study), not pushed by a big sales org.
- A prop firm asks us to build surveillance → anti-goals hold; we sell development and risk-process tooling, not trader spyware. Walking from bad-fit revenue is a stated policy.

**KPIs / exit criteria**
- 10+ firm deployments; enterprise ARR ≥30% of total; logo retention ≥90%.
- SOC 2 Type II complete.
- **Dataset milestone**: cross-firm benchmark corpus defensibly unique (multiple firms, k≥50 cells across prop segments).

---

## Phase 5 — **The Standard** (months 36+)

*Thesis: become the reference layer for trading-behavior quality.*

**Goals**
- Public API + partner embeds ("powered by Split-Roads" inside brokers/prop platforms).
- Split-Roads Score as a portable, trader-owned credential referenced in funding/hiring decisions.
- Consented aggregate data products and the research portal; possibly the native capture terminal.

**Features**: PL-007 (full platform), FUT-001/005/006/007/010, EN-011 (funds, properly).

**Staffing** (45+): platform/partnerships org, data-products lead, research partnerships, developer relations.

**Risks**
- Standard-setting requires neutrality under commercial pressure → governance for the Score (published methodology, appeal process, trader ownership) designed *before* the first firm asks to buy placement in it.
- API opens competitive copying of derived signal → rate/grain limits encoded in API design; raw behavioral data never leaves at individual grain (constitutional law, restated).

**KPIs**
- Firms referencing the Score in real decisions; platform/API revenue material (≥15%); aggregate-data revenue line opened; the benchmark dataset acknowledged as category-defining (cited in research, referenced in industry).

---

## Cross-phase constants

- **Hiring bar**: every engineer can reason about probability; every PM can read a calibration curve. The product *is* applied statistics — staff accordingly.
- **The weekly ritual is sacred** across all phases: features that compete with the Sunday review for attention must justify themselves against it.
- **Phase gates are go/no-go reviews against this document**, held with the discipline of a board meeting: KPIs, dataset milestones, risk register deltas, and an explicit "what did we learn that changes the plan" section — this file gets amended there, deliberately.
