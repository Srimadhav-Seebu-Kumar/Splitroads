import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '_')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-dim">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'rounded-lg border bg-bg px-3 py-2 text-sm text-ink placeholder:text-faint',
          'transition-colors duration-200 focus:outline-none focus:border-gain-deep',
          error ? 'border-cost-deep' : 'border-line',
          'disabled:opacity-50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-cost">{error}</p>}
    </div>
  )
}
