/**
 * Typed API client — single fetch wrapper used everywhere.
 * DRY: one place for auth headers, base URL, error parsing.
 */

const BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1'

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } }

class ApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  const json = (await res.json()) as ApiResponse<T>

  if (!json.ok) throw new ApiError(json.error.code, json.error.message, json.error.details)
  return json.data
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (email: string, password: string, displayName?: string) =>
      request<{ user: { userId: string; email: string; tier: string }; token: string }>('/auth/register', {
        method: 'POST', body: JSON.stringify({ email, password, display_name: displayName }),
      }),
    login: (email: string, password: string) =>
      request<{ user: { userId: string; email: string; tier: string }; token: string }>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    me: (token: string) =>
      request<{ userId: string; email: string; displayName: string | null; tier: string }>('/auth/me', { token }),
  },

  dashboard: {
    today: (token: string) =>
      request<{
        today_trades: unknown[]; phantom_stats: unknown
        top_insight: unknown; intent_sessions_today: number
        open_trades: number; pending_corrections: number
      }>('/dashboard/today', { token }),
    weekly: (token: string) =>
      request<{ period: unknown; analytics: unknown; phantom_stats: unknown; insights: unknown[] }>('/dashboard/weekly', { token }),
  },

  trades: {
    list: (token: string, params?: Record<string, string>) =>
      request<{ items: unknown[]; total: number; page: number; has_more: boolean }>(
        `/trades?${new URLSearchParams(params ?? '')}`, { token }
      ),
    get: (token: string, id: string) => request<unknown>(`/trades/${id}`, { token }),
    analytics: (token: string, days = 90) => request<unknown>(`/trades/analytics?days=${days}`, { token }),
    importCSV: (token: string, accountId: string, csv: string) =>
      request<{ inserted: number; skipped: number; total_parsed: number }>('/trades/import/csv', {
        method: 'POST', body: JSON.stringify({ account_id: accountId, csv }), token,
      }),
    createPlan: (token: string, body: unknown) =>
      request<{ plan_id: string }>('/trades/plans', { method: 'POST', body: JSON.stringify(body), token }),
  },

  phantoms: {
    list: (token: string, params?: { type?: string; status?: string }) =>
      request<unknown[]>(`/phantoms?${new URLSearchParams(params as Record<string, string> ?? '')}`, { token }),
    stats: (token: string) => request<{
      totalPhantoms: number; prematureExits: number; abandonedEntries: number
      avgPrematureExitCostR: number | null; hesitationCostR: number | null
    }>('/phantoms/stats', { token }),
    get: (token: string, id: string) => request<unknown>(`/phantoms/${id}`, { token }),
    correct: (token: string, id: string, verdict: 'confirmed_intent' | 'denied_intent', note?: string) =>
      request<unknown>(`/phantoms/${id}/correction`, {
        method: 'POST', body: JSON.stringify({ verdict, note }), token,
      }),
  },
}

export { ApiError }
