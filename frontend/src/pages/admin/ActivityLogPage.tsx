import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import { relativeTime } from '@/lib/format'

interface ActivityRow {
  id: string
  actor: { initials: string; color: string; name: string }
  action: string
  target?: string
  createdAt: string
}

/**
 * Synthesised activity log built from seed data (reactions + comments + entries).
 * Real implementation will be a dedicated append-only ActivityLog table on the API.
 */
export default function ActivityLogPage() {
  const { reactions, comments, entries, getEntry, getUser } = useStore()

  const rows: ActivityRow[] = useMemo(() => {
    const out: ActivityRow[] = []

    entries.forEach((e) => {
      const author = getUser(e.authorId)
      if (!author) return
      out.push({
        id: `entry-${e.id}`,
        actor: { initials: author.avatarInitials, color: author.avatarColor, name: author.firstName },
        action: e.type === 'upcoming_event' ? 'created upcoming event' : 'posted',
        target: e.title,
        createdAt: e.createdAt,
      })
    })

    reactions.forEach((r) => {
      const user = getUser(r.userId)
      const e = getEntry(r.entryId)
      if (!user || !e) return
      out.push({
        id: `r-${r.entryId}-${r.userId}-${r.type}`,
        actor: { initials: user.avatarInitials, color: user.avatarColor, name: user.firstName },
        action: r.type === 'like' ? 'liked' : r.type === 'going' ? 'RSVPed Going to' : 'marked Interested in',
        target: e.title,
        createdAt: r.createdAt,
      })
    })

    comments.forEach((c) => {
      const user = getUser(c.userId)
      const e = getEntry(c.entryId)
      if (!user || !e) return
      out.push({
        id: `c-${c.id}`,
        actor: { initials: user.avatarInitials, color: user.avatarColor, name: user.firstName },
        action: 'commented on',
        target: e.title,
        createdAt: c.createdAt,
      })
    })

    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [reactions, comments, entries, getEntry, getUser])

  return (
    <div>
      <p className="text-base text-ink-3 mb-4">
        Append-only record of who did what. {rows.length} events shown.
      </p>
      <div className="bg-surface border border-line rounded-md divide-y divide-line">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start gap-3 px-4 py-3">
            <Avatar initials={r.actor.initials} color={r.actor.color} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-base text-ink-2">
                <span className="font-medium text-ink">{r.actor.name}</span> {r.action}
                {r.target && <> <span className="text-ink">{r.target}</span></>}
              </div>
              <div className="text-xs text-ink-3 mt-0.5">{relativeTime(r.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
