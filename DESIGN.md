# Design

## Theme

Dark, warm-tinted. Scene: a trader at 4:45pm, markets closed, lamp-lit room, 27-inch monitor, reviewing what they almost did today. The interface is the quiet room after the screaming terminal, so the dark is warm (umber-tinted neutrals), never the cold navy/slate of finance tools. Light theme is out of scope until the companion mobile surfaces ship.

Color strategy: **Restrained** base (warm tinted neutrals) with a strict two-accent behavioral semantic layer. The River surface is the one place translucent color is allowed to bloom.

## Color palette (OKLCH)

Neutrals (all tinted toward hue 75, warm umber; never #000/#fff):

- `--bg`        oklch(0.155 0.008 75)   page field
- `--bg-raised` oklch(0.19 0.009 75)    panels, rails
- `--bg-overlay` oklch(0.23 0.010 75)   popovers, command palette
- `--line`      oklch(0.30 0.010 75)    hairline borders
- `--line-strong` oklch(0.38 0.012 75)
- `--text`      oklch(0.93 0.006 80)    primary
- `--text-dim`  oklch(0.72 0.010 78)    secondary
- `--text-faint` oklch(0.55 0.010 78)   tertiary, metadata

Behavioral semantics (the only saturated colors in the chrome):

- `--cost`        oklch(0.78 0.13 75)    warm amber: behavioral cost, hesitation, phantom debt
- `--cost-deep`   oklch(0.62 0.12 70)
- `--gain`        oklch(0.80 0.10 185)   cool teal: improvement, validated discipline
- `--gain-deep`   oklch(0.64 0.09 190)
- `--phantom`     translucent amber/white ribbons; alpha 0.10-0.35, band width = uncertainty

Never profit-green or loss-red as semantic colors. Focus ring: `--gain` at 60% alpha.

## Typography

- Narrative / UI: **Instrument Sans** (humanist, warm, modern)
- Data / numerals: **JetBrains Mono** with `font-variant-numeric: tabular-nums` everywhere a number appears
- Scale (ratio ~1.333): 12.5 / 14 / 16 / 21 / 28 / 38 / 50
- Body line length capped at 70ch. Hierarchy via weight contrast (400 vs 600) plus scale, never color alone.
- Numbers are the product's credibility: always tabular, always mono, always aligned.

## Components

- **Panels**: flat `--bg-raised`, 1px `--line` full border, radius 10px. No shadows except overlays (single soft ambient). No nested cards, no side-stripe accents, no glassmorphism.
- **Bands**: the signature primitive. A horizontal distribution band (p05-p95 fill at 12% alpha, p25-p75 at 22%, median tick 2px solid). Used for every estimate.
- **Evidence chips**: mono microtype `n=34 · CI ±0.4R` attached to every claim.
- **Buttons**: quiet by default (text + hairline), one filled accent action per view max.
- **Command palette** (cmdk): the primary navigation accelerator, `⌘K`.
- **Provenance chips**: every simulated parameter labels its source (`stop: observed`, `target: from plan`).

## Layout

- Desktop-first. Left icon rail (64px, labels on hover/expand), thin top status strip, content max-width 1200px except the River, which bleeds full width.
- Spacing rhythm varies deliberately: tight inside instruments (4/8), generous between thoughts (32/56). Same-padding-everywhere monotony is a defect.
- The River owns vertical space (~55vh) on Today; everything below is a single calm column.

## Motion

- Springs for interface physics (motion lib): stiffness 260, damping 32 for panels; 170/26 for the palette.
- Exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) for CSS transitions, 200-400ms on reflective surfaces. Nothing bounces, nothing elastic.
- Same-document View Transitions for state morphs (cell -> detail). Numbers animate via `@property` counters when they change, never on first paint.
- The River drifts at idle (sub-pixel parallax, dust at 0.2 opacity); it must never demand attention. All motion fully disabled under `prefers-reduced-motion`, replaced by static renders that are composed, not stripped.

## Iconography

Lucide, 1.5px stroke, 16/18px. Icons always accompany the amber/teal semantics (colorblind safety). The brand glyph is the split road: one path forking, second branch translucent.
