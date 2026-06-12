'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, Ghost, Activity, User, Settings, LogOut
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const NAV = [
  { href: '/today',    label: 'Today',    icon: LayoutDashboard },
  { href: '/journal',  label: 'Journal',  icon: BookOpen        },
  { href: '/phantoms', label: 'Phantoms', icon: Ghost           },
  { href: '/dna',      label: 'DNA',      icon: Activity        },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-4">
      {/* Logo */}
      <div className="mb-8 px-3">
        <span className="text-lg font-bold tracking-tight text-zinc-100">Split</span>
        <span className="text-lg font-bold tracking-tight text-teal-400">Roads</span>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-zinc-600">Decision Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="mt-auto border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-200">{user?.email}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">{user?.tier ?? 'free'}</p>
          </div>
        </div>
        <Link href="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          <Settings className="h-3.5 w-3.5" /> Settings
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </aside>
  )
}
