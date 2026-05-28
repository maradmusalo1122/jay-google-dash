import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from './store'
import { KEYS, loadJSON, removeKey, saveJSON } from './persist'
import type { User } from '@/types'

interface AuthState {
  currentUser: User | null
  signIn: (asUserId?: string) => void
  signOut: () => void
}

const AuthCtx = createContext<AuthState | null>(null)

const DEFAULT_USER_ID = 'u-abhishek' // admin — gives full access for testing

export function AuthProvider({ children }: { children: ReactNode }) {
  const { users } = useStore()
  // Hydrate from localStorage so refresh keeps you signed in.
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    loadJSON<string>(KEYS.auth),
  )

  // Live lookup so profile edits propagate immediately to header, comments, etc.
  const currentUser = currentUserId ? users.find((u) => u.id === currentUserId) ?? null : null

  function persist(id: string | null) {
    if (id) saveJSON(KEYS.auth, id)
    else removeKey(KEYS.auth)
  }

  function signIn(asUserId: string = DEFAULT_USER_ID) {
    const exists = users.some((u) => u.id === asUserId)
    const id = exists ? asUserId : users[0]?.id ?? null
    setCurrentUserId(id)
    persist(id)
  }

  function signOut() {
    setCurrentUserId(null)
    persist(null)
  }

  return (
    <AuthCtx.Provider value={{ currentUser, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
