import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  SEED_COMMENTS,
  SEED_ENTRIES,
  SEED_QUARTERS,
  SEED_REACTIONS,
  SEED_USERS,
} from './data'
import { KEYS, loadJSON, saveJSON } from './persist'
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
import { photoUrl, thumbUrl } from './images'
import { parseMentions, serializeMentions } from './mentions'

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
  getEntry: (id: string) => Entry | undefined
  getUser: (id: string) => User | undefined
  getEntryComments: (entryId: string) => Comment[]
  hasReaction: (entryId: string, userId: string, type: ReactionType) => boolean

  // Mutations
  setSelectedQuarter: (id: string) => void
  toggleReaction: (entryId: string, userId: string, type: ReactionType) => void
  addComment: (entryId: string, userId: string, body: string) => void
  addPost: (input: {
    authorId: string
    title: string
    caption: string
    tag: Tag
    eventName?: string
    eventDate?: string
    photoSeeds: string[]
  }) => Entry
  addUpcomingEvent: (input: {
    authorId: string
    title: string
    caption: string
    tag: Tag
    eventDate: string
    venue: string
    venueMapUrl: string
    photoSeed: string
  }) => Entry
  editEntry: (id: string, patch: Partial<Pick<Entry, 'title' | 'caption' | 'tag'>>) => void
  deleteEntry: (id: string) => void
  editComment: (commentId: string, body: string) => void
  deleteComment: (commentId: string) => void
  setUserStatus: (id: string, status: UserStatus) => void
  updateUser: (
    id: string,
    patch: Partial<
      Pick<
        User,
        'office' | 'team' | 'name' | 'firstName' | 'avatarInitials' | 'avatarColor' | 'avatarPhoto' | 'coverPhoto'
      >
    >,
  ) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
}

const StoreCtx = createContext<StoreState | null>(null)

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

const INITIAL_LIVE = SEED_QUARTERS.find((q) => q.status === 'live') ?? SEED_QUARTERS[SEED_QUARTERS.length - 1]

/**
 * Compute denormalised counts on each entry from the actual reactions
 * and comments. Run once on init so the displayed numbers always match
 * what's really in seed data — no more drift after the first toggle.
 */
function computeEntryCounts(
  entries: Entry[],
  reactions: Reaction[],
  comments: Comment[],
): Entry[] {
  return entries.map((e) => ({
    ...e,
    likeCount: reactions.filter((r) => r.entryId === e.id && r.type === 'like').length,
    goingCount: reactions.filter((r) => r.entryId === e.id && r.type === 'going').length,
    interestedCount: reactions.filter((r) => r.entryId === e.id && r.type === 'interested').length,
    commentCount: comments.filter((c) => c.entryId === e.id).length,
  }))
}

interface PersistedState {
  users: User[]
  entries: Entry[]
  comments: Comment[]
  reactions: Reaction[]
  notifications: Notification[]
  selectedQuarterId: string
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Hydrate from localStorage if available. Otherwise fall back to seed data
  // (with mention tokens serialized — see one-time migration below).
  const persisted = useMemo(() => loadJSON<PersistedState>(KEYS.state), [])

  const [users, setUsers] = useState<User[]>(persisted?.users ?? SEED_USERS)
  const [entries, setEntries] = useState<Entry[]>(() => {
    if (persisted?.entries) return persisted.entries
    // One-time seed migration: convert legacy `@firstname` mentions in seed
    // data to canonical `<@id>` tokens so renames don't break existing content.
    const seeded = SEED_ENTRIES.map((e) => ({
      ...e,
      caption: serializeMentions(e.caption, SEED_USERS),
    }))
    return computeEntryCounts(seeded, SEED_REACTIONS, SEED_COMMENTS)
  })
  const [comments, setComments] = useState<Comment[]>(() => {
    if (persisted?.comments) return persisted.comments
    return SEED_COMMENTS.map((c) => ({
      ...c,
      body: serializeMentions(c.body, SEED_USERS),
    }))
  })
  const [reactions, setReactions] = useState<Reaction[]>(persisted?.reactions ?? SEED_REACTIONS)
  const [notifications, setNotifications] = useState<Notification[]>(persisted?.notifications ?? [])
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>(
    persisted?.selectedQuarterId ?? INITIAL_LIVE.id,
  )

  // Persist everything that changes. Photos can be large base64 data URLs that
  // blow past the ~5MB localStorage quota — if the full payload fails to save,
  // retry once without photos so the rest survives.
  useEffect(() => {
    const payload: PersistedState = {
      users,
      entries,
      comments,
      reactions,
      notifications,
      selectedQuarterId,
    }
    const ok = saveJSON(KEYS.state, payload)
    if (!ok) {
      const slim = {
        ...payload,
        users: payload.users.map((u) => ({ ...u, avatarPhoto: undefined, coverPhoto: undefined })),
      }
      const okSlim = saveJSON(KEYS.state, slim)
      if (!okSlim) {
        // eslint-disable-next-line no-console
        console.warn('[sapac] Could not persist app state to localStorage.')
      }
    }
  }, [users, entries, comments, reactions, notifications, selectedQuarterId])

  const quarters = SEED_QUARTERS

  const liveQuarter = useMemo(
    () => quarters.find((q) => q.status === 'live') ?? quarters[quarters.length - 1],
    [quarters],
  )

  const selectedQuarter = useMemo(
    () => quarters.find((q) => q.id === selectedQuarterId) ?? liveQuarter,
    [quarters, selectedQuarterId, liveQuarter],
  )

  const isViewingLive = selectedQuarter.id === liveQuarter.id

  const getEntry = useCallback(
    (id: string) => entries.find((e) => e.id === id),
    [entries],
  )

  const getUser = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users],
  )

  const getEntryComments = useCallback(
    (entryId: string) =>
      comments
        .filter((c) => c.entryId === entryId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [comments],
  )

  const hasReaction = useCallback(
    (entryId: string, userId: string, type: ReactionType) =>
      reactions.some(
        (r) => r.entryId === entryId && r.userId === userId && r.type === type,
      ),
    [reactions],
  )

  const recountEntry = (entryId: string, nextReactions: Reaction[], nextComments: Comment[]) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              likeCount: nextReactions.filter((r) => r.entryId === entryId && r.type === 'like').length,
              goingCount: nextReactions.filter((r) => r.entryId === entryId && r.type === 'going').length,
              interestedCount: nextReactions.filter((r) => r.entryId === entryId && r.type === 'interested').length,
              commentCount: nextComments.filter((c) => c.entryId === entryId).length,
            }
          : e,
      ),
    )
  }

  const toggleReaction = useCallback(
    (entryId: string, userId: string, type: ReactionType) => {
      setReactions((prev) => {
        const exists = prev.some(
          (r) => r.entryId === entryId && r.userId === userId && r.type === type,
        )
        let next: Reaction[]
        if (exists) {
          next = prev.filter(
            (r) => !(r.entryId === entryId && r.userId === userId && r.type === type),
          )
        } else {
          // RSVPs are mutually exclusive (going XOR interested)
          let cleaned = prev
          if (type === 'going' || type === 'interested') {
            cleaned = prev.filter(
              (r) =>
                !(r.entryId === entryId && r.userId === userId && (r.type === 'going' || r.type === 'interested')),
            )
          }
          next = [
            ...cleaned,
            { entryId, userId, type, createdAt: new Date().toISOString() },
          ]
        }
        recountEntry(entryId, next, comments)
        return next
      })
    },
    [comments],
  )

  const addComment = useCallback(
    (entryId: string, userId: string, displayBody: string) => {
      const trimmed = displayBody.trim()
      if (!trimmed) return
      // Serialize @firstname mentions to stable <@id> tokens for storage.
      const storedBody = serializeMentions(trimmed, users)
      const commentId = uid('c')
      const createdAt = new Date().toISOString()
      setComments((prev) => {
        const next = [
          ...prev,
          { id: commentId, entryId, userId, body: storedBody, createdAt },
        ]
        recountEntry(entryId, reactions, next)
        return next
      })
      // Notify each @mentioned user (don't notify the author).
      const mentions = parseMentions(storedBody, users)
      const unique = Array.from(new Set(mentions.map((m) => m.userId))).filter(
        (id) => id !== userId,
      )
      if (unique.length > 0) {
        // Excerpt stays in display form (with @firstname) for readability.
        const excerpt =
          trimmed.length > 120 ? trimmed.slice(0, 117) + '…' : trimmed
        setNotifications((prev) => [
          ...prev,
          ...unique.map<Notification>((mentionedId) => ({
            id: uid('n'),
            userId: mentionedId,
            type: 'mention_comment',
            actorId: userId,
            entryId,
            commentId,
            excerpt,
            createdAt,
            read: false,
          })),
        ])
      }
    },
    [reactions, users],
  )

  const addPost: StoreState['addPost'] = useCallback((input) => {
    const id = uid('e')
    const photos = input.photoSeeds.map((seed, i) => ({
      id: uid('p'),
      url: photoUrl(seed),
      thumbUrl: thumbUrl(seed),
      order: i,
    }))
    const entry: Entry = {
      id,
      quarterId: liveQuarter.id,
      authorId: input.authorId,
      type: 'post',
      title: input.title,
      caption: serializeMentions(input.caption, users),
      tag: input.tag,
      eventName: input.eventName,
      eventDate: input.eventDate,
      photos,
      heroPhotoId: photos[0]?.id,
      contributorIds: [input.authorId],
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      goingCount: 0,
      interestedCount: 0,
    }
    setEntries((prev) => [entry, ...prev])
    return entry
  }, [liveQuarter, users])

  const addUpcomingEvent: StoreState['addUpcomingEvent'] = useCallback((input) => {
    const id = uid('e')
    const heroPhoto = {
      id: uid('p'),
      url: photoUrl(input.photoSeed),
      thumbUrl: thumbUrl(input.photoSeed),
      order: 0,
    }
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) + '-' + id.slice(-6)
    const entry: Entry = {
      id,
      quarterId: liveQuarter.id,
      authorId: input.authorId,
      type: 'upcoming_event',
      title: input.title,
      caption: serializeMentions(input.caption, users),
      tag: input.tag,
      eventDate: input.eventDate,
      venue: input.venue,
      venueMapUrl: input.venueMapUrl,
      publicSlug: slug,
      photos: [heroPhoto],
      heroPhotoId: heroPhoto.id,
      contributorIds: [input.authorId],
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      goingCount: 0,
      interestedCount: 0,
    }
    setEntries((prev) => [entry, ...prev])
    return entry
  }, [liveQuarter, users])

  const editEntry: StoreState['editEntry'] = useCallback(
    (id, patch) => {
      const finalPatch = { ...patch }
      if (typeof patch.caption === 'string') {
        finalPatch.caption = serializeMentions(patch.caption, users)
      }
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...finalPatch } : e)))
    },
    [users],
  )

  const deleteEntry: StoreState['deleteEntry'] = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setComments((prev) => prev.filter((c) => c.entryId !== id))
    setReactions((prev) => prev.filter((r) => r.entryId !== id))
  }, [])

  const editComment: StoreState['editComment'] = useCallback(
    (commentId, displayBody) => {
      const trimmed = displayBody.trim()
      if (!trimmed) return
      const storedBody = serializeMentions(trimmed, users)
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, body: storedBody } : c)),
      )
    },
    [users],
  )

  const deleteComment: StoreState['deleteComment'] = useCallback((commentId) => {
    setComments((prev) => {
      const target = prev.find((c) => c.id === commentId)
      const next = prev.filter((c) => c.id !== commentId)
      if (target) recountEntry(target.entryId, reactions, next)
      return next
    })
  }, [reactions])

  const setUserStatus: StoreState['setUserStatus'] = useCallback((id, status) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  }, [])

  const updateUser: StoreState['updateUser'] = useCallback((id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const markNotificationRead: StoreState['markNotificationRead'] = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead: StoreState['markAllNotificationsRead'] = useCallback(
    (userId) => {
      setNotifications((prev) =>
        prev.map((n) => (n.userId === userId && !n.read ? { ...n, read: true } : n)),
      )
    },
    [],
  )

  const value: StoreState = {
    users,
    quarters,
    entries,
    comments,
    reactions,
    notifications,
    liveQuarter,
    selectedQuarterId,
    selectedQuarter,
    isViewingLive,
    getEntry,
    getUser,
    getEntryComments,
    hasReaction,
    setSelectedQuarter: setSelectedQuarterId,
    toggleReaction,
    addComment,
    addPost,
    addUpcomingEvent,
    editEntry,
    deleteEntry,
    editComment,
    deleteComment,
    setUserStatus,
    updateUser,
    markNotificationRead,
    markAllNotificationsRead,
  }

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore(): StoreState {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>')
  return ctx
}
