import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import UserAvatar from '@/components/ui/UserAvatar'
import { relativeTime } from '@/lib/format'

export default function NotificationBell() {
  const { currentUser } = useAuth()
  const { notifications, getUser, getEntry, markNotificationRead, markAllNotificationsRead } = useStore()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Notifications for the current user, newest first
  const mine = useMemo(
    () =>
      notifications
        .filter((n) => n.userId === currentUser?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications, currentUser?.id],
  )

  const unread = mine.filter((n) => !n.read).length

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!currentUser) return null

  const handleClick = (notifId: string, entryId: string) => {
    markNotificationRead(notifId)
    setOpen(false)
    // Navigate to feed; entries are visible there. (Deep linking → entry id
    // anchor is a v1.1 enhancement.)
    navigate('/feed')
    requestAnimationFrame(() => {
      const el = document.getElementById(`entry-${entryId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={unread > 0 ? `${unread} new notifications` : 'Notifications'}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-soft transition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-g-red text-white text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-32px)] bg-surface border border-line rounded-lg shadow-xl z-[300] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <div className="font-display text-md">Notifications</div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(currentUser.id)}
                className="text-xs text-g-blue hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          {mine.length === 0 ? (
            <div className="px-4 py-8 text-center text-base text-ink-3">
              <div className="text-2xl mb-1">🔔</div>
              You're all caught up.
            </div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto divide-y divide-line">
              {mine.slice(0, 30).map((n) => {
                const actor = getUser(n.actorId)
                const entry = getEntry(n.entryId)
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n.id, n.entryId)}
                      className={`w-full text-left px-4 py-3 flex gap-2.5 items-start transition ${n.read ? 'hover:bg-surface-soft' : 'bg-g-blue-l/40 hover:bg-g-blue-l/60'}`}
                    >
                      {actor && <UserAvatar user={actor} size="md" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-base text-ink leading-snug">
                          <span className="font-medium">{actor?.firstName ?? 'Someone'}</span>{' '}
                          mentioned you in{' '}
                          <span className="font-medium">{entry?.title ?? 'a post'}</span>
                        </div>
                        <div className="text-xs text-ink-3 mt-1 line-clamp-2">"{n.excerpt}"</div>
                        <div className="text-[10px] text-ink-3 mt-1">{relativeTime(n.createdAt)}</div>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-g-blue flex-shrink-0 mt-1.5" aria-label="unread" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
