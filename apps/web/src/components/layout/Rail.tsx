'use client'
/**
 * The rail: 64px icon navigation. Icon above a 9px label,
 * active page marked by an ink shift, not a filled pill.
 * Keyboard users live in the command palette; the rail is the map.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Mark } from '@/components/brand/Mark'
import { Sun, BookOpen, Ghost, Fingerprint, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const NAV = [
  { href: '/today',    label: 'Today',    icon: Sun         },
  { href: '/journal',  label: 'Journal',  icon: BookOpen    },
  { href: '/phantoms', label: 'Phantoms', icon: Ghost       },
  { href: '/dna',      label: 'DNA',      icon: Fingerprint },
] as const

export function Rail() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <aside className="flex h-screen w-16 shrink-0 flex-col items-center border-r border-line bg-bg py-4">
      <Link href="/today" aria-label="Split-Roads home" className="mb-7 text-ink transition-colors hover:text-gain">
        <Mark size={26} />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1.5" aria-label="Primary">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex w-14 flex-col items-center gap-1 rounded-lg py-2.5 transition-colors duration-200',
                active ? 'text-ink' : 'text-faint hover:text-dim'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-gain" aria-hidden />
              )}
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              <span className="text-[9px] font-medium uppercase tracking-[0.08em]">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col items-center gap-1.5">
        <Link
          href="/settings"
          className="flex w-14 flex-col items-center gap-1 rounded-lg py-2.5 text-faint transition-colors duration-200 hover:text-dim"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-[0.08em]">Settings</span>
        </Link>
        <button
          onClick={logout}
          className="flex w-14 flex-col items-center gap-1 rounded-lg py-2.5 text-faint transition-colors duration-200 hover:text-dim"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-[0.08em]">Out</span>
        </button>
      </div>
    </aside>
  )
}
