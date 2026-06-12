/**
 * River layout: pure geometry, no rendering.
 * Maps a decision history (trades taken + phantoms not taken) onto
 * a flowing path with forks. Shared by the WebGL renderer and the
 * static SVG fallback so both render the same truth.
 */

export type RiverFork = {
  id: string
  kind: 'trade' | 'phantom'
  at: number // epoch ms
  symbol: string
  direction: 'long' | 'short'
  /** Realized R for trades */
  r: number | null
  /** Distribution for phantoms */
  p05?: number | null
  p50?: number | null
  p95?: number | null
  phantomType?: string
  status?: string
}

export type Pt = { x: number; y: number }

export type RibbonSpec = {
  fork: RiverFork
  /** Sampled centerline, screen px */
  pts: Pt[]
  /** Ribbon half-width at t=0 and t=1 (px) */
  w0: number
  w1: number
  /** 'ink' (taken), 'cost' (amber), 'gain' (teal) */
  tone: 'ink' | 'cost' | 'gain'
  alpha: number
  /** Screen point used for hover hit-testing (the fork mouth) */
  hit: Pt
  /** End of the branch, for hit-testing and labels */
  end: Pt
  /** 0-1 position along the river, drives the draw-in stagger */
  tNorm: number
}

export type RiverLayout = {
  main: Pt[]
  ribbons: RibbonSpec[]
  width: number
  height: number
}

const SAMPLES_MAIN = 96
const SAMPLES_BRANCH = 40
const MAX_FORKS = 64

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

export function computeRiverLayout(forks: RiverFork[], width: number, height: number): RiverLayout {
  const margin = Math.max(48, width * 0.05)
  const usable = forks
    .slice()
    .sort((a, b) => a.at - b.at)
    .slice(-MAX_FORKS)

  const t0 = usable.length ? usable[0]!.at : Date.now() - 86400000
  const t1 = usable.length ? usable[usable.length - 1]!.at : Date.now()
  const span = Math.max(t1 - t0, 3600000)

  const yc = height * 0.56
  const meanderA = height * 0.045

  const mainY = (x: number) => yc + Math.sin((x / width) * Math.PI * 2.2 + 0.6) * meanderA

  const main: Pt[] = []
  for (let i = 0; i <= SAMPLES_MAIN; i++) {
    const x = (i / SAMPLES_MAIN) * width
    main.push({ x, y: mainY(x) })
  }

  const ribbons: RibbonSpec[] = []
  for (const fork of usable) {
    const tNorm = (fork.at - t0) / span
    const fx = margin + tNorm * (width - 2 * margin)
    const fy = mainY(fx)

    const mag = fork.kind === 'trade' ? (fork.r ?? 0) : (fork.p50 ?? 0)
    // Up = favorable; screen y is inverted
    const sign = mag >= 0 ? -1 : 1
    const norm = Math.min(Math.abs(mag), 3) / 3
    const reach = (0.18 + norm * 0.82) * height * 0.30

    const len = Math.min(Math.max(width * 0.07, 70), 150)
    const p0: Pt = { x: fx, y: fy }
    const p3: Pt = { x: fx + len, y: fy + sign * reach }
    const p1: Pt = { x: fx + len * 0.45, y: fy }
    const p2: Pt = { x: fx + len * 0.78, y: fy + sign * reach * 0.55 }

    const pts: Pt[] = []
    for (let i = 0; i <= SAMPLES_BRANCH; i++) pts.push(cubic(p0, p1, p2, p3, i / SAMPLES_BRANCH))

    let tone: RibbonSpec['tone']
    let w0: number, w1: number, alpha: number
    if (fork.kind === 'trade') {
      tone = 'ink'
      w0 = 1.6; w1 = 1.6
      alpha = 0.85
    } else {
      // Phantom: positive median = the road would have paid = behavioral cost (amber).
      // Negative median = walking away was right = validated discipline (teal).
      tone = (fork.p50 ?? 0) > 0 ? 'cost' : 'gain'
      const bandWidth = Math.abs((fork.p95 ?? 0) - (fork.p05 ?? 0))
      w0 = 1.2
      w1 = Math.min(Math.max(bandWidth * 5, 7), 26) // uncertainty widens downstream
      alpha = 0.5
    }

    ribbons.push({ fork, pts, w0, w1, tone, alpha, hit: p0, end: p3, tNorm })
  }

  return { main, ribbons, width, height }
}

/** Convert a centerline + width profile into a triangle-strip vertex list. */
export function ribbonStrip(pts: Pt[], w0: number, w1: number): { position: Float32Array; uv: Float32Array } {
  const n = pts.length
  const position = new Float32Array(n * 2 * 2)
  const uv = new Float32Array(n * 2 * 2)

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const p = pts[i]!
    const prev = pts[Math.max(0, i - 1)]!
    const next = pts[Math.min(n - 1, i + 1)]!
    // Normal of the local tangent
    let dx = next.x - prev.x
    let dy = next.y - prev.y
    const dlen = Math.hypot(dx, dy) || 1
    dx /= dlen; dy /= dlen
    const nx = -dy, ny = dx
    const w = w0 + (w1 - w0) * t
    // Soft glow halo: geometry is 3x the visual core; shader fades the edges
    const half = w * 3

    position[i * 4 + 0] = p.x + nx * half
    position[i * 4 + 1] = p.y + ny * half
    position[i * 4 + 2] = p.x - nx * half
    position[i * 4 + 3] = p.y - ny * half

    uv[i * 4 + 0] = t; uv[i * 4 + 1] = 1
    uv[i * 4 + 2] = t; uv[i * 4 + 3] = -1
  }

  return { position, uv }
}
