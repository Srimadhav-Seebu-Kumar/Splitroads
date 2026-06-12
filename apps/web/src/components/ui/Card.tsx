import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type CardProps = { children: ReactNode; className?: string; onClick?: () => void }

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[10px] border border-line bg-raised p-5',
        onClick && 'cursor-pointer transition-colors duration-200 hover:border-line-strong',
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
  return <h3 className={cn('text-xs font-medium uppercase tracking-[0.14em] text-faint', className)}>{children}</h3>
}

export function CardValue({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('num text-2xl font-semibold text-ink', className)}>{children}</p>
}
