import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError } from './api'
import type { User } from '@/types'

interface AuthState {
  currentUser: User | null
  loading: boolean
  signIn: (asUserId?: string) => Promise<void>
  signOut: () => Promise<void>
  startGoogleOAuth: () => void
  refresh: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

const DEFAULT_USER_ID = 'u-abhishek' // admin — gives full access for testing (dev signin)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const refresh = useCallback(async () => {
    // Exponential-backoff retries to ride out Render free-tier cold starts (~30s wake)
    const delays = [1000, 3000, 8000, 15000]
    let lastErr: unknown
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const { user } = await api.get<{ user: User | null }>('/api/auth/me')
        setCurrentUser(user)
        setLoading(false)
        return
      } catch (e) {
        lastErr = e
        // Don't retry on 4xx auth errors — those are real "not signed in"
        if (e instanceof ApiError && e.status >= 400 && e.status < 500) break
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]))
        }
      }
    }
    if (!(lastErr instanceof ApiError)) console.warn('[auth] /me failed after retries', lastErr)
    setCurrentUser(null)
    setLoading(false)
  }, [])

  // Initial session check
  useEffect(() => {
    refresh()
  }, [refresh])

  const signIn = useCallback(async (asUserId: string = DEFAULT_USER_ID) => {
    const { user } = await api.post<{ user: User }>('/api/auth/dev-signin', { userId: asUserId })
    setCurrentUser(user)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.post('/api/auth/signout')
    } catch { /* still clear locally */ }
    setCurrentUser(null)
  }, [])

  const startGoogleOAuth = useCallback(() => {
    // Browser navigates away to Google → callback redirects back to /
    const base = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    window.location.href = `${base}/api/auth/google`
  }, [])

  return (
    <AuthCtx.Provider value={{ currentUser, loading, signIn, signOut, startGoogleOAuth, refresh }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
