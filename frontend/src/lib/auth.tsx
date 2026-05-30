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
    // One retry to ride out Render free-tier cold starts (~30s wake)
    const fetchMe = async () => api.get<{ user: User | null }>('/api/auth/me')
    try {
      let user: User | null
      try {
        ;({ user } = await fetchMe())
      } catch (firstErr) {
        // Only retry on network/server errors, not on 4xx auth errors
        const status = firstErr instanceof ApiError ? firstErr.status : 0
        if (status >= 400 && status < 500) throw firstErr
        await new Promise((r) => setTimeout(r, 2000))
        ;({ user } = await fetchMe())
      }
      setCurrentUser(user)
    } catch (e) {
      if (!(e instanceof ApiError)) console.warn('[auth] /me failed', e)
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
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
