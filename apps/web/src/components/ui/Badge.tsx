import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Variant = 'default' | 'improvement' | 'cost' | 'neutral' | 'active' | 'resolved' | 'expired'

const variants: Record<Variant, string> = {
  default:     'border-line text-dim',
  improvement: 'border-gain-deep/40 text-gain',
  cost:        'border-cost-deep/40 text-cost',
  neutral:     'border-line text-faint',
  active:      'border-gain-deep/40 text-gain',
  resolved:    'border-line-strong text-dim',
  expired:     'border-line text-faint',
}

export function Badge({ children, variant = 'default', className }: {
  children: ReactNode; variant?: Variant; className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-tight',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}
