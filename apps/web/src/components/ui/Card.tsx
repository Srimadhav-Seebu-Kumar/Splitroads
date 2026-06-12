import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type CardProps = { children: ReactNode; className?: string; onClick?: () => void }

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900 p-5',
        onClick && 'cursor-pointer hover:border-zinc-700 transition-colors',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-medium text-zinc-400 uppercase tracking-wider', className)}>{children}</h3>
}

export function CardValue({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-2xl font-semibold tabular-nums text-zinc-100', className)}>{children}</p>
}
