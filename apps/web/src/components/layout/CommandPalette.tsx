'use client'
/**
 * Command palette (⌘K): the primary navigation accelerator.
 * Traders are keyboard people; the rail is the map, this is the road.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'motion/react'
import { Sun, BookOpen, Ghost, Fingerprint, Settings, LogOut, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const PAGES = [
  { label: 'Today',    href: '/today',    icon: Sun,         hint: 'daily glance' },
  { label: 'Journal',  href: '/journal',  icon: BookOpen,    hint: 'trades and plans' },
  { label: 'Phantoms', href: '/phantoms', icon: Ghost,       hint: 'the roads not taken' },
  { label: 'DNA',      href: '/dna',      icon: Fingerprint, hint: 'behavioral profile' },
  { label: 'Settings', href: '/settings', icon: Settings,    hint: 'integrations, privacy' },
] as const

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href as never)
  }, [router])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-bg/70 pt-[18vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ type: 'spring', stiffness: 480, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-line-strong bg-overlay shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)]"
          >
            <Command label="Command palette">
              <Command.Input
                autoFocus
                placeholder="Where to?"
                className="w-full border-b border-line bg-transparent px-4 py-3.5 text-sm text-ink placeholder:text-faint focus:outline-none"
              />
              <Command.List className="max-h-72 overflow-y-auto p-1.5">
                <Command.Empty className="px-3 py-6 text-center text-sm text-faint">
                  Nothing matches.
                </Command.Empty>
                <Command.Group>
                  {PAGES.map(({ label, href, icon: Icon, hint }) => (
                    <Command.Item
                      key={href}
                      value={label}
                      onSelect={() => go(href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-dim data-[selected=true]:bg-raised data-[selected=true]:text-ink"
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <span className="flex-1">{label}</span>
                      <span className="text-[11px] text-faint">{hint}</span>
                    </Command.Item>
                  ))}
                  <Command.Item
                    value="Import trades CSV"
                    onSelect={() => go('/journal')}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-dim data-[selected=true]:bg-raised data-[selected=true]:text-ink"
                  >
                    <Upload className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="flex-1">Import trades</span>
                    <span className="text-[11px] text-faint">CSV</span>
                  </Command.Item>
                  <Command.Item
                    value="Sign out"
                    onSelect={() => { setOpen(false); logout() }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-dim data-[selected=true]:bg-raised data-[selected=true]:text-ink"
                  >
                    <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="flex-1">Sign out</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
