'use client'
/**
 * Login: the threshold. The river flows on the left before you have
 * any data of your own; the form is the quiet right column.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mark } from '@/components/brand/Mark'
import { RiverFallback } from '@/components/river/RiverFallback'
import { placeholderForks } from '@/components/river/River'

export default function LoginPage() {
  const router = useRouter()
  const { login, register } = useAuth()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, displayName || undefined)
      }
      router.push('/today')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel: the river, before it's yours */}
      <div className="relative hidden flex-1 overflow-hidden lg:block" aria-hidden>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(110% 90% at 60% 55%, oklch(0.17 0.012 75) 0%, oklch(0.125 0.008 75) 100%)' }}
        />
        <RiverFallback forks={placeholderForks()} dimmed />
        <div className="absolute left-8 top-8 flex items-center gap-2.5 text-ink">
          <Mark size={24} />
          <span className="text-sm font-semibold tracking-tight">Split-Roads</span>
        </div>
        <div className="absolute bottom-10 left-8 max-w-sm">
          <p className="text-lg font-medium leading-snug text-ink">
            Track the trades you almost took.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            Every decision forks. The road you took is solid; the one you didn&apos;t is a band of possibility. This is where you finally see both.
          </p>
        </div>
      </div>

      {/* Form column */}
      <div className="flex w-full items-center justify-center px-6 lg:w-[480px] lg:shrink-0 lg:border-l lg:border-line">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <div className="mb-8 flex items-center gap-2.5 text-ink">
              <Mark size={24} />
              <span className="text-sm font-semibold tracking-tight">Split-Roads</span>
            </div>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {mode === 'login' ? 'Welcome back' : 'Begin your record'}
          </h1>
          <p className="mt-1 text-sm text-dim">
            {mode === 'login'
              ? 'The river kept flowing while you were away.'
              : 'Decisions can only be captured forward. Day one starts now.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <Input
                label="Display name (optional)"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your trader name"
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Minimum 12 characters' : '••••••••••••'}
              required
              minLength={mode === 'register' ? 12 : 1}
            />

            {error && (
              <p className="rounded-lg border border-cost-deep/40 bg-cost-deep/10 px-3 py-2 text-sm text-cost">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-faint">
            {mode === 'login' ? 'No account yet? ' : 'Already recording? '}
            <button
              type="button"
              onClick={() => { setMode((m) => (m === 'login' ? 'register' : 'login')); setError(null) }}
              className="text-gain transition-colors hover:text-gain-deep"
            >
              {mode === 'login' ? 'Start your record' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
