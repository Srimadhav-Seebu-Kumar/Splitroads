import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '_')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-zinc-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'rounded-lg border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
          error ? 'border-amber-500' : 'border-zinc-800',
          'disabled:opacity-50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-amber-400">{error}</p>}
    </div>
  )
}
