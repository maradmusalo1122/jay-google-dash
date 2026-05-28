import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import Pill from '@/components/ui/Pill'
import PhotoModal from '@/components/feed/PhotoModal'
import { ALL_TAGS, type Entry, type Tag } from '@/types'
import { formatShortDate } from '@/lib/format'

export default function ExplorePage() {
  const { entries } = useStore()
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<Tag | 'All'>('All')
  const [openEntry, setOpenEntry] = useState<Entry | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (tagFilter !== 'All' && e.tag !== tagFilter) return false
      if (!q) return true
      return (
        e.title.toLowerCase().includes(q) ||
        (e.eventName ?? '').toLowerCase().includes(q) ||
        e.caption.toLowerCase().includes(q)
      )
    })
  }, [entries, query, tagFilter])

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

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-ink-3 text-md">No moments match that.</div>
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
