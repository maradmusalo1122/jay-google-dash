import { useState } from 'react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'
import { formatShortDate } from '@/lib/format'

export default function ArchivePage() {
  const { quarters, entries } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)

  // Live first, then archived chronologically (newest first).
  const ordered = [...quarters].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'live' ? -1 : 1
    return b.startDate.localeCompare(a.startDate)
  })

  return (
    <div>
      <p className="text-base text-ink-3 mb-4">
        Every quarter sealed, saved and always accessible.
      </p>

      {ordered.map((q) => {
        const qEntries = entries.filter((e) => e.quarterId === q.id)
        const photos = qEntries.reduce((sum, e) => sum + e.photos.length, 0)
        const contribs = new Set<string>()
        qEntries.forEach((e) => e.contributorIds.forEach((id) => contribs.add(id)))
        const isOpen = openId === q.id
        const isLive = q.status === 'live'

        return (
          <button
            type="button"
            key={q.id}
            onClick={() => setOpenId((c) => (c === q.id ? null : q.id))}
            className={cn(
              'block w-full text-left bg-surface border rounded-lg mb-2.5 overflow-hidden transition',
              isLive ? 'border-g-blue-l' : 'border-line hover:border-g-blue-d',
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-md text-lg flex-shrink-0"
                style={{ background: isLive ? '#E1F5EE' : '#F4F4F0' }}
              >
                {isLive ? '🔓' : '📦'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg text-ink">{q.label.replace("'", '20')}</div>
                <div className="text-xs text-ink-3 mt-0.5">
                  {formatShortDate(q.startDate)} – {formatShortDate(q.endDate)} ·{' '}
                  {isLive ? 'Live now' : 'Archived'}
                </div>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-pill font-medium"
                style={{
                  background: isLive ? '#E8F0FE' : '#F4F4F0',
                  color: isLive ? '#185FA5' : '#8888A0',
                }}
              >
                {isLive ? 'Live' : 'Archived'}
              </span>
              <span
                className={cn('text-base text-ink-3 transition-transform', isOpen && 'rotate-90')}
                aria-hidden
              >
                ›
              </span>
            </div>

            {isOpen && (
              <div className="border-t border-line px-4 pt-3 pb-4">
                {qEntries.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-1 mb-3 rounded overflow-hidden">
                      {qEntries.slice(0, 4).map((e) => {
                        const hero =
                          e.photos.find((p) => p.id === e.heroPhotoId) ?? e.photos[0]
                        return (
                          <div key={e.id} className="aspect-video overflow-hidden bg-surface-soft">
                            {hero && <img src={hero.thumbUrl ?? hero.url} alt={e.title} className="w-full h-full object-cover" />}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-surface-soft rounded-sm py-2 text-center">
                        <div className="font-display text-xl text-ink">{qEntries.length}</div>
                        <div className="text-xs text-ink-3">{qEntries.length === 1 ? 'entry' : 'entries'}</div>
                      </div>
                      <div className="flex-1 bg-surface-soft rounded-sm py-2 text-center">
                        <div className="font-display text-xl text-ink">{photos}</div>
                        <div className="text-xs text-ink-3">photos</div>
                      </div>
                      <div className="flex-1 bg-surface-soft rounded-sm py-2 text-center">
                        <div className="font-display text-xl text-ink">{contribs.size}</div>
                        <div className="text-xs text-ink-3">contributors</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-base text-ink-3 text-center py-3">
                    Nothing posted to this quarter.
                  </div>
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
