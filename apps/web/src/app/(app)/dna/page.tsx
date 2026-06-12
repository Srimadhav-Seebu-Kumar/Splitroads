'use client'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Activity } from 'lucide-react'

export default function DNAPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-400" /> Decision DNA
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your behavioral profile. Accruing silently — the reveal comes after your first 3 weeks.
        </p>
      </div>
      <Card className="py-16 text-center">
        <Activity className="mx-auto mb-4 h-10 w-10 text-zinc-700" />
        <p className="text-sm font-medium text-zinc-400">Profile is building</p>
        <p className="mt-2 max-w-sm mx-auto text-sm text-zinc-600">
          We observe quietly for 3 weeks before revealing your behavioral DNA.
          This ensures your profile is based on enough evidence to be honest.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {['Conviction', 'Hesitation', 'Patience', 'Discipline', 'FOMO'].map(dim => (
            <span key={dim} className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-700">
              {dim}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
