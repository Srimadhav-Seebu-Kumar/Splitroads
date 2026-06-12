'use client'
/**
 * The river, rendered in SVG: the taken path solid, the roads not taken
 * as translucent amber/teal branches whose width is uncertainty.
 * Branches draw themselves in on mount; the whole field drifts gently
 * at idle so the river feels alive without demanding attention.
 * Reliable everywhere, and the static frame under reduced motion is composed.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { computeRiverLayout, type RiverFork, type Pt } from './layout'

const TONE_COLOR = { ink: 'var(--text)', cost: 'var(--cost)', gain: 'var(--gain)' } as const

type Hover = { fork: RiverFork; x: number; y: number } | null

export function RiverFallback({
  forks,
  onHover,
  onSelect,
  dimmed = false,
}: {
  forks: RiverFork[]
  onHover?: (fork: RiverFork | null, screen: Pt | null) => void
  onSelect?: (fork: RiverFork) => void
  dimmed?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const filterId = useId()
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setDims({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const layout = useMemo(
    () => (dims ? computeRiverLayout(forks, dims.w, dims.h) : null),
    [dims, forks]
  )

  return (
    <div ref={ref} className="absolute inset-0">
      {layout && (
        <svg
          width={layout.width}
          height={layout.height}
          className="block"
          style={reduced ? undefined : { animation: 'river-drift 14s ease-in-out infinite' }}
        >
          <defs>
            <filter id={`glow-${filterId}`} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* The taken path */}
          <path
            d={toPath(layout.main)}
            fill="none"
            stroke="var(--text)"
            strokeOpacity={dimmed ? 0.3 : 0.55}
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#glow-${filterId})`}
          />

          {/* The roads not taken */}
          {layout.ribbons.map((r, i) => {
            const len = pathLength(r.pts)
            const isPhantom = r.tone !== 'ink'
            const base = r.tone === 'ink' ? 0.7 : 0.42
            return (
              <path
                key={r.fork.id}
                d={toPath(r.pts)}
                fill="none"
                stroke={TONE_COLOR[r.tone]}
                strokeOpacity={dimmed ? base * 0.5 : base}
                strokeWidth={r.tone === 'ink' ? 2 : (r.w0 + r.w1) / 2}
                strokeLinecap="round"
                filter={isPhantom ? `url(#glow-${filterId})` : undefined}
                style={
                  reduced
                    ? undefined
                    : {
                        strokeDasharray: len,
                        strokeDashoffset: len,
                        animation: `river-draw 1.1s cubic-bezier(0.16,1,0.3,1) ${0.15 + r.tNorm * 0.6}s forwards`,
                      }
                }
                onMouseEnter={(e) => {
                  if (dimmed) return
                  const rect = ref.current!.getBoundingClientRect()
                  onHover?.(r.fork, { x: e.clientX - rect.left, y: e.clientY - rect.top })
                }}
                onMouseMove={(e) => {
                  if (dimmed) return
                  const rect = ref.current!.getBoundingClientRect()
                  onHover?.(r.fork, { x: e.clientX - rect.left, y: e.clientY - rect.top })
                }}
                onMouseLeave={() => onHover?.(null, null)}
                onClick={() => !dimmed && onSelect?.(r.fork)}
                className={dimmed ? undefined : 'cursor-pointer'}
                pointerEvents={r.tone === 'ink' ? 'none' : 'stroke'}
              />
            )
          })}

          {/* Fork mouths: small markers where decisions happened */}
          {!dimmed &&
            layout.ribbons.map((r) => (
              <circle
                key={`m-${r.fork.id}`}
                cx={r.hit.x}
                cy={r.hit.y}
                r={1.6}
                fill="var(--text)"
                fillOpacity={0.5}
                pointerEvents="none"
              />
            ))}
        </svg>
      )}
    </div>
  )
}

function toPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

function pathLength(pts: Pt[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y)
  }
  return Math.ceil(len)
}
