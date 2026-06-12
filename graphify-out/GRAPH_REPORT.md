# Graph Report - Splitroads  (2026-06-12)

## Corpus Check
- 80 files · ~42,783 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 181 nodes · 247 edges · 19 communities (12 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `be4b3c50`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `Design` - 8 edges
2. `Product` - 8 edges
3. `main()` - 8 edges
4. `rand` - 6 edges
5. `simulatePrematureExitOutcome()` - 6 edges
6. `Mark()` - 5 edges
7. `Button()` - 5 edges
8. `normalizePhantom()` - 5 edges
9. `maybeSpawnPrematureExit()` - 4 edges
10. `importTrades()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `LoginPage()` --calls--> `placeholderForks()`  [EXTRACTED]
  apps/web/src/app/login/page.tsx → apps/web/src/components/river/River.tsx

## Communities (19 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (20): normalizePhantom(), normalizeTrade(), num(), Phantom, PHANTOM_TYPE_LABELS, pick(), Trade, avg() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (17): LoginPage(), computeRiverLayout(), cubic(), Pt, RibbonSpec, RiverFork, RiverLayout, Hover (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (10): TradeRow, Badge(), Variant, variants, Button(), ButtonProps, Size, sizes (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.2
Nodes (11): AbandonedEntryInput, Instrument, isPrematureExit(), maybeSpawnPrematureExit(), nullResult(), PrematureExitInput, riskUnits(), round() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (9): phantomService, findMatchingPlan(), getPlanLookupMap(), importTrades(), PlanLookup, RAnalytics, TradeFilter, TradeRow (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (7): Mark(), CommandPalette(), PAGES, NAV, Rail(), marketSession(), StatusStrip()

### Community 6 - "Community 6"
Cohesion: 0.38
Nodes (9): ensureUser(), INSTRUMENTS, main(), pick(), pickInstrument(), rand, range(), sessionTime() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (9): Build Session 1 — DONE ✓, Build Session 2 — UI/UX system — DONE ✓, Current Milestone, Current Priorities (in order), MVP Scope (the whole of it), Next 30 Days (updated), Next 90 Days, Standing reminders (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (8): Color palette (OKLCH), Components, Design, Iconography, Layout, Motion, Theme, Typography

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (3): instrument, jetbrains, metadata

## Knowledge Gaps
- **62 isolated node(s):** `Current Milestone`, `Current Priorities (in order)`, `MVP Scope (the whole of it)`, `What to IGNORE right now`, `Build Session 1 — DONE ✓` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Mark()` connect `Community 5` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `Current Milestone`, `Current Priorities (in order)`, `MVP Scope (the whole of it)` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._