'use client'
/**
 * Auth context — token + user stored in-memory (SSR-safe).
 * One place for all auth state. Components never touch localStorage directly.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { api, ApiError } from './api'

type User = { userId: string; email: string; tier: string; displayName?: string | null }

type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'sr_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const setAuth = useCallback((t: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Restore session from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) { setLoading(false); return }

    api.auth.me(stored)
      .then(u => setAuth(stored, u))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [setAuth])

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token: t } = await api.auth.login(email, password)
    setAuth(t, u)
  }, [setAuth])

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const { user: u, token: t } = await api.auth.register(email, password, displayName)
    setAuth(t, u)
  }, [setAuth])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
