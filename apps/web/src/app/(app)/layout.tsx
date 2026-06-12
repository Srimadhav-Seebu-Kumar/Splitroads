'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Rail } from '@/components/layout/Rail'
import { StatusStrip } from '@/components/layout/StatusStrip'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { Mark } from '@/components/brand/Mark'
import { useAuth } from '@/lib/auth-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Mark size={32} className="animate-pulse text-faint" />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col">
        <StatusStrip />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
