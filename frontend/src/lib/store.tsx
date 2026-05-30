import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from './api'
import { useAuth } from './auth'
import { photoUrl, thumbUrl } from './images'
import type {
  Comment,
  Entry,
  Notification,
  Quarter,
  Reaction,
  ReactionType,
  Tag,
  User,
  UserStatus,
} from '@/types'

interface StoreState {
  users: User[]
  quarters: Quarter[]
  entries: Entry[]
  comments: Comment[]
  reactions: Reaction[]
  notifications: Notification[]

  // Derived
  liveQuarter: Quarter
  selectedQuarterId: string
  selectedQuarter: Quarter
  isViewingLive: boolean

  loading: boolean

  getEntry: (id: string) => Entry | undefined
  getUser: (id: string) => User | undefined
  getEntryComments: (entryId: string) => Comment[]
  hasReaction: (entryId: string, userId: string, type: ReactionType) => boolean

  // Mutations
  setSelectedQuarter: (id: string) => void
  toggleReaction: (entryId: string, userId: string, type: ReactionType) => Promise<void>
  addComment: (entryId: string, userId: string, body: string) => Promise<void>
  addPost: (input: {
    authorId: string
    title: string
    caption: string
    tag: Tag
    eventName?: string
    eventDate?: string
    photoSeeds: string[]
  }) => Promise<Entry>
  addUpcomingEvent: (input: {
    authorId: string
    title: string
    caption: string
    tag: Tag
    eventDate: string
    venue: string
    venueMapUrl: string
    photoSeed: string
  }) => Promise<Entry>
  editEntry: (id: string, patch: Partial<Pick<Entry, 'title' | 'caption' | 'tag'>>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  editComment: (commentId: string, body: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  setUserStatus: (id: string, status: UserStatus) => Promise<void>
  updateUser: (
    id: string,
    patch: Partial<Pick<User, 'office' | 'team' | 'name' | 'firstName' | 'avatarInitials' | 'avatarColor' | 'avatarPhoto' | 'coverPhoto'>>,
  ) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: (userId: string) => Promise<void>
}

const StoreCtx = createContext<StoreState | null>(null)

/** Re-fetch everything from the API after a sign-in/out. */
/** Hit one endpoint with one retry — handles Render free-tier cold starts (~30s). */
async function getWithRetry<T>(path: string): Promise<T> {
  try {
    return await api.get<T>(path)
  } catch (err) {
    // Wait a moment for the server to wake up, then try one more time
    await new Promise((r) => setTimeout(r, 1500))
    return await api.get<T>(path)
  }
}

async function fetchAll() {
  const [u, q, e, c, r, n] = await Promise.all([
    getWithRetry<{ users: User[] }>('/api/users').catch(() => ({ users: [] as User[] })),
    getWithRetry<{ quarters: Quarter[] }>('/api/quarters').catch(() => ({ quarters: [] as Quarter[] })),
    getWithRetry<{ entries: Entry[] }>('/api/entries').catch(() => ({ entries: [] as Entry[] })),
    getWithRetry<{ comments: Comment[] }>('/api/comments').catch(() => ({ comments: [] as Comment[] })),
    getWithRetry<{ reactions: Reaction[] }>('/api/reactions').catch(() => ({ reactions: [] as Reaction[] })),
    getWithRetry<{ notifications: Notification[] }>('/api/notifications').catch(() => ({ notifications: [] as Notification[] })),
  ])
  return {
    users: u.users,
    quarters: q.quarters,
    entries: e.entries,
    comments: c.comments,
    reactions: r.reactions,
    notifications: n.notifications,
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()

  const [users, setUsers] = useState<User[]>([])
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  // Load everything when the user signs in. Reset when they sign out.
  useEffect(() => {
    let cancelled = false
    if (!currentUser) {
      setUsers([])
      setQuarters([])
      setEntries([])
      setComments([])
      setReactions([])
      setNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchAll().then((all) => {
      if (cancelled) return
      setUsers(all.users)
      setQuarters(all.quarters)
      setEntries(all.entries)
      setComments(all.comments)
      setReactions(all.reactions)
      setNotifications(all.notifications)
      // Default to live quarter
      const live = all.quarters.find((q) => q.status === 'live')
      if (live) setSelectedQuarterId(live.id)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [currentUser?.id])

  const liveQuarter = useMemo(
    () => quarters.find((q) => q.status === 'live') ?? quarters[quarters.length - 1] ?? ({} as Quarter),
    [quarters],
  )

  const selectedQuarter = useMemo(
    () => quarters.find((q) => q.id === selectedQuarterId) ?? liveQuarter,
    [quarters, selectedQuarterId, liveQuarter],
  )

  const isViewingLive = selectedQuarter.id === liveQuarter.id

  const getEntry = useCallback((id: string) => entries.find((e) => e.id === id), [entries])
  const getUser = useCallback((id: string) => users.find((u) => u.id === id), [users])
  const getEntryComments = useCallback(
    (entryId: string) =>
      comments
        .filter((c) => c.entryId === entryId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [comments],
  )
  const hasReaction = useCallback(
    (entryId: string, userId: string, type: ReactionType) =>
      reactions.some((r) => r.entryId === entryId && r.userId === userId && r.type === type),
    [reactions],
  )

  // ── Mutations ────────────────────────────────────────────────

  const toggleReaction: StoreState['toggleReaction'] = useCallback(
    async (entryId, _userId, type) => {
      const resp = await api.post<{ reactions: Reaction[] }>(`/api/entries/${entryId}/reactions`, { type })
      // Replace this entry's reactions with the server truth
      setReactions((prev) => [...prev.filter((r) => r.entryId !== entryId), ...resp.reactions])
      // Refresh the entry to get updated counts
      const fresh = await api.get<{ entry: Entry }>(`/api/entries/${entryId}`)
      setEntries((prev) => prev.map((e) => (e.id === entryId ? fresh.entry : e)))
    },
    [],
  )

  const addComment: StoreState['addComment'] = useCallback(
    async (entryId, _userId, body) => {
      const { comment } = await api.post<{ comment: Comment }>(`/api/entries/${entryId}/comments`, { body })
      setComments((prev) => [...prev, comment])
      const fresh = await api.get<{ entry: Entry }>(`/api/entries/${entryId}`)
      setEntries((prev) => prev.map((e) => (e.id === entryId ? fresh.entry : e)))
      // Refresh notifications in case the new comment created any for me
      api.get<{ notifications: Notification[] }>('/api/notifications').then((r) => setNotifications(r.notifications)).catch(() => {})
    },
    [],
  )

  const editComment: StoreState['editComment'] = useCallback(
    async (commentId, body) => {
      const { comment } = await api.put<{ comment: Comment }>(`/api/comments/${commentId}`, { body })
      setComments((prev) => prev.map((c) => (c.id === commentId ? comment : c)))
    },
    [],
  )

  const deleteComment: StoreState['deleteComment'] = useCallback(
    async (commentId) => {
      const c = comments.find((x) => x.id === commentId)
      await api.delete(`/api/comments/${commentId}`)
      setComments((prev) => prev.filter((x) => x.id !== commentId))
      if (c) {
        const fresh = await api.get<{ entry: Entry }>(`/api/entries/${c.entryId}`)
        setEntries((prev) => prev.map((e) => (e.id === c.entryId ? fresh.entry : e)))
      }
    },
    [comments],
  )

  const addPost: StoreState['addPost'] = useCallback(async (input) => {
    const photos = input.photoSeeds.map((seed, i) => ({
      url: photoUrl(seed),
      thumbUrl: thumbUrl(seed),
      order: i,
    }))
    const { entry } = await api.post<{ entry: Entry }>('/api/entries', {
      type: 'post',
      title: input.title,
      caption: input.caption,
      tag: input.tag,
      eventName: input.eventName,
      eventDate: input.eventDate,
      contributorIds: [input.authorId],
      photos,
    })
    setEntries((prev) => [entry, ...prev])
    return entry
  }, [])

  const addUpcomingEvent: StoreState['addUpcomingEvent'] = useCallback(async (input) => {
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
    const { entry } = await api.post<{ entry: Entry }>('/api/entries', {
      type: 'upcoming_event',
      title: input.title,
      caption: input.caption,
      tag: input.tag,
      eventDate: input.eventDate,
      venue: input.venue,
      venueMapUrl: input.venueMapUrl,
      publicSlug: slug + '-' + Math.random().toString(36).slice(2, 8),
      contributorIds: [input.authorId],
      photos: [{ url: photoUrl(input.photoSeed), thumbUrl: thumbUrl(input.photoSeed), order: 0 }],
    })
    setEntries((prev) => [entry, ...prev])
    return entry
  }, [])

  const editEntry: StoreState['editEntry'] = useCallback(async (id, patch) => {
    const { entry } = await api.put<{ entry: Entry }>(`/api/entries/${id}`, patch)
    setEntries((prev) => prev.map((e) => (e.id === id ? entry : e)))
  }, [])

  const deleteEntry: StoreState['deleteEntry'] = useCallback(async (id) => {
    await api.delete(`/api/entries/${id}`)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setComments((prev) => prev.filter((c) => c.entryId !== id))
    setReactions((prev) => prev.filter((r) => r.entryId !== id))
  }, [])

  const setUserStatus: StoreState['setUserStatus'] = useCallback(async (id, status) => {
    const { user } = await api.post<{ user: User }>(`/api/users/${id}/status`, { status })
    setUsers((prev) => prev.map((u) => (u.id === id ? user : u)))
  }, [])

  const updateUser: StoreState['updateUser'] = useCallback(async (id, patch) => {
    const { user } = await api.put<{ user: User }>(`/api/users/${id}`, patch)
    setUsers((prev) => prev.map((u) => (u.id === id ? user : u)))
  }, [])

  const markNotificationRead: StoreState['markNotificationRead'] = useCallback(async (id) => {
    await api.post(`/api/notifications/${id}/read`)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead: StoreState['markAllNotificationsRead'] = useCallback(async () => {
    await api.post('/api/notifications/read-all')
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const value: StoreState = {
    users, quarters, entries, comments, reactions, notifications,
    liveQuarter, selectedQuarterId: selectedQuarterId || liveQuarter.id, selectedQuarter, isViewingLive,
    loading,
    getEntry, getUser, getEntryComments, hasReaction,
    setSelectedQuarter: setSelectedQuarterId,
    toggleReaction, addComment, addPost, addUpcomingEvent,
    editEntry, deleteEntry, editComment, deleteComment,
    setUserStatus, updateUser,
    markNotificationRead, markAllNotificationsRead,
  }

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore(): StoreState {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>')
  return ctx
}
