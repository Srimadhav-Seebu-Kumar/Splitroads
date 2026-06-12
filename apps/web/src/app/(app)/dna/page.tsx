'use client'
/**
 * Decision DNA: the behavioral profile. Pre-reveal it accrues silently;
 * the empty state is a promise, with the dimensions previewed as
 * unrevealed population strips.
 */
import { Fingerprint } from 'lucide-react'

const DIMENSIONS = ['Conviction', 'Hesitation', 'Patience', 'Discipline', 'Recovery'] as const

export default function DNAPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="rise-in">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Decision DNA</h1>
        <p className="mt-1 max-w-xl text-sm text-dim">
          Your behavioral profile, measured against traders like you. It builds silently; the reveal comes when the evidence is honest, after about three weeks of decisions.
        </p>
      </header>

      <section className="rise-in-1 mt-10 space-y-7" aria-label="Dimensions accruing">
        {DIMENSIONS.map((dim, i) => (
          <div key={dim}>
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-dim">{dim}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">accruing</p>
            </div>
            {/* Unrevealed population strip: the curve exists, your marker doesn't yet */}
            <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="mt-2 h-7 w-full" aria-hidden>
              <path
                d={bellPath(i)}
                fill="var(--line)" fillOpacity="0.5"
              />
              <line x1="0" y1="13.5" x2="100" y2="13.5" stroke="var(--line)" strokeWidth="0.4" />
            </svg>
          </div>
        ))}
      </section>

      <div className="rise-in-2 mt-14 flex flex-col items-center gap-3 text-center">
        <Fingerprint className="h-6 w-6 text-faint" strokeWidth={1.25} />
        <p className="max-w-sm text-xs leading-relaxed text-faint">
          Every dimension will arrive with its credible interval and its population context.
          No score is shown before it can be defended.
        </p>
      </div>
    </div>
  )
}

/** Slightly different bell shape per dimension so the page breathes */
function bellPath(seed: number): string {
  const skew = (seed - 2) * 6
  const peak = 50 + skew
  const w = 26 + (seed % 3) * 5
  const pts: string[] = [`M0,13.5`]
  for (let x = 0; x <= 100; x += 2) {
    const y = 13.5 - 12 * Math.exp(-((x - peak) ** 2) / (2 * w * w))
    pts.push(`L${x},${y.toFixed(2)}`)
  }
  pts.push('L100,13.5 Z')
  return pts.join(' ')
}
