'use client'
/**
 * Generic SWR-like data fetching hook.
 * DRY: every data-fetching component uses this — no ad-hoc useState/useEffect pairs.
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

type State<T> = { data: T | null; loading: boolean; error: string | null }

export function useApi<T>(
  fetcher: (token: string) => Promise<T>,
  deps: unknown[] = []
): State<T> & { refetch: () => void } {
  const { token } = useAuth()
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })

  const load = useCallback(() => {
    if (!token) { setState({ data: null, loading: false, error: 'Not authenticated' }); return }
    setState(s => ({ ...s, loading: true, error: null }))
    fetcher(token)
      .then(data => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ...deps])

  useEffect(() => { load() }, [load])

  return { ...state, refetch: load }
}
