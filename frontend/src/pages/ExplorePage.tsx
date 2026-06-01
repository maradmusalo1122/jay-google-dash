import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import Pill from '@/components/ui/Pill'
import UserAvatar from '@/components/ui/UserAvatar'
import PhotoModal from '@/components/feed/PhotoModal'
import { ALL_TAGS, type Entry, type Tag } from '@/types'
import { formatShortDate } from '@/lib/format'

export default function ExplorePage() {
  const { entries, users } = useStore()
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<Tag | 'All'>('All')
  const [openEntry, setOpenEntry] = useState<Entry | null>(null)

  // People matching the query — name, firstName, or email handle
  const matchedPeople = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return users
      .filter((u) => u.status === 'approved')
      .filter((u) => {
        const emailHandle = (u.email ?? '').split('@')[0].toLowerCase()
        return (
          u.name.toLowerCase().includes(q) ||
          (u.firstName ?? '').toLowerCase().includes(q) ||
          emailHandle.includes(q)
        )
      })
      .slice(0, 12) // cap so the row doesn't blow up
  }, [users, query])

  // Entries matching the query (title/caption/event) AND/OR involving a matched person
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const peopleIds = new Set(matchedPeople.map((u) => u.id))
    return entries.filter((e) => {
      if (tagFilter !== 'All' && e.tag !== tagFilter) return false
      if (!q) return true

      // Text match on the entry itself
      const textMatch =
        e.title.toLowerCase().includes(q) ||
        (e.eventName ?? '').toLowerCase().includes(q) ||
        e.caption.toLowerCase().includes(q)

      // People match: author OR any contributor matches
      const peopleMatch =
        peopleIds.has(e.authorId) ||
        e.contributorIds.some((id) => peopleIds.has(id))

      return textMatch || peopleMatch
    })
  }, [entries, query, tagFilter, matchedPeople])

  const showPeopleSection = matchedPeople.length > 0
  const noResults = !filtered.length && !showPeopleSection

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events, people, moments…"
        className="w-full text-md px-4 py-2.5 rounded-md border border-line bg-surface outline-none focus:border-g-blue mb-3"
      />

      <div className="flex gap-1.5 flex-wrap mb-4">
        <Pill active={tagFilter === 'All'} onClick={() => setTagFilter('All')}>All</Pill>
        {ALL_TAGS.map((t) => (
          <Pill key={t} active={tagFilter === t} onClick={() => setTagFilter(t)}>{t}</Pill>
        ))}
      </div>

      {/* PEOPLE — surfaced when there's a query that matches users */}
      {showPeopleSection && (
        <section className="mb-5">
          <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">People</h2>
          <div className="flex gap-3 flex-wrap">
            {matchedPeople.map((u) => (
              <Link
                key={u.id}
                to={`/u/${u.id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-pill border border-line bg-surface hover:border-g-blue transition"
              >
                <UserAvatar user={u} size="sm" />
                <div className="min-w-0">
                  <div className="text-base font-medium text-ink truncate max-w-[12rem]">{u.name}</div>
                  {(u.team || u.office) && (
                    <div className="text-xs text-ink-3 truncate max-w-[12rem]">
                      {[u.team, u.office].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MOMENTS — entries (existing grid) */}
      {showPeopleSection && filtered.length > 0 && (
        <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">Moments</h2>
      )}

      {noResults ? (
        <div className="text-center py-12 text-ink-3 text-md">No results match that.</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-ink-3 text-sm">No moments — try a different filter.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filtered.map((entry) => {
            const hero = entry.photos.find((p) => p.id === entry.heroPhotoId) ?? entry.photos[0]
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setOpenEntry(entry)}
                className="bg-surface border border-line rounded-md overflow-hidden hover:border-g-blue transition text-left"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-soft">
                  {hero && (
                    <img src={hero.thumbUrl ?? hero.url} alt={entry.title} className="w-full h-full object-cover hover:scale-105 transition" />
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <div className="text-base font-medium text-ink truncate">{entry.title}</div>
                  <div className="text-xs text-ink-3 mt-0.5 truncate">
                    {entry.eventDate ? formatShortDate(entry.eventDate) : ''}
                    {' · '}
                    {entry.photos.length} {entry.photos.length === 1 ? 'photo' : 'photos'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <PhotoModal entry={openEntry} onClose={() => setOpenEntry(null)} />
    </div>
  )
}
