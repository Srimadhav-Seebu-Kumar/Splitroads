/**
 * The split-road glyph: one path forking, the taken branch solid,
 * the untaken branch translucent. The brand in 24 pixels.
 */
export function Mark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* taken road */}
      <path
        d="M4 20 C 9 20, 9 12, 12 12 C 15 12, 15 14, 20 14"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      />
      {/* the road not taken: translucent, drifting up */}
      <path
        d="M12 12 C 14.5 12, 14.5 6, 20 5"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.32"
      />
    </svg>
  )
}
