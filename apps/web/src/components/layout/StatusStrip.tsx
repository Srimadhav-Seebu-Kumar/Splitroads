'use client'
/**
 * Thin top strip: date, market session state, ⌘K affordance.
 * Quiet furniture; never demands attention.
 */
import { useAuth } from '@/lib/auth-context'

function marketSession(): { label: string; live: boolean } {
  // US equities cash session, ET. Coarse on purpose; this is ambience, not data.
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  const mins = et.getHours() * 60 + et.getMinutes()
  if (day === 0 || day === 6) return { label: 'Markets closed', live: false }
  if (mins >= 570 && mins < 960) return { label: 'NY session open', live: true }
  if (mins >= 240 && mins < 570) return { label: 'Pre-market', live: false }
  return { label: 'Markets closed', live: false }
}

export function StatusStrip() {
  const { user } = useAuth()
  const session = marketSession()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-line px-5">
      <p className="text-xs text-faint">{today}</p>
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-xs text-faint">
          <span
            className={session.live ? 'h-1.5 w-1.5 rounded-full bg-gain' : 'h-1.5 w-1.5 rounded-full bg-line-strong'}
            aria-hidden
          />
          {session.label}
        </span>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint transition-colors hover:border-line-strong hover:text-dim"
          aria-label="Open command palette"
        >
          ⌘K
        </button>
        <span className="text-xs text-faint">{user?.email}</span>
      </div>
    </header>
  )
}
