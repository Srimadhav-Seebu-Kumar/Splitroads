import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Variant = 'default' | 'improvement' | 'cost' | 'neutral' | 'active' | 'resolved' | 'expired'

const variants: Record<Variant, string> = {
  default:     'bg-zinc-800 text-zinc-300',
  improvement: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  cost:        'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  neutral:     'bg-zinc-800 text-zinc-400',
  active:      'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  resolved:    'bg-zinc-700 text-zinc-300',
  expired:     'bg-zinc-800/50 text-zinc-500',
}

export function Badge({ children, variant = 'default', className }: {
  children: ReactNode; variant?: Variant; className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
