import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatShortDate } from '@/lib/format'
import type { Entry, Quarter, User } from '@/types'

/* ────────────────────────────────────────────────────────────
 *  Archive — list of past quarters, each a clickable "yearbook"
 *  card with curated highlights + drill-in to that quarter's feed.
 * ──────────────────────────────────────────────────────────── */

export default function ArchivePage() {
  const { quarters, entries, users, setSelectedQuarter } = useStore()
  const navigate = useNavigate()

  const live = useMemo(() => quarters.find((q) => q.status === 'live'), [quarters])
  const archived = useMemo(
    () =>
      quarters
        .filter((q) => q.status !== 'live')
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [quarters],
  )

  const goToQuarter = (q: Quarter) => {
    setSelectedQuarter(q.id)
    navigate('/feed')
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-2xl text-ink">The Chronicle Archive</h1>
        <p className="text-base text-ink-3 mt-1">
          Every quarter sealed, saved, and always accessible. Open one to relive the moments.
        </p>
      </header>

      {/* CURRENT (live) — visually distinct, points back to the feed */}
      {live && (
        <LiveBanner
          q={live}
          entries={entries.filter((e) => e.quarterId === live.id)}
          onOpen={() => goToQuarter(live)}
        />
      )}

      {/* ARCHIVED */}
      {archived.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <div className="text-3xl">📚</div>
          <p className="text-base text-ink-3 mt-2">
            No quarters have been archived yet — {live ? live.label : 'the first one'} is still being written.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2 mt-6">
            Archived quarters
          </h2>
          <div className="space-y-3">
            {archived.map((q) => (
              <QuarterCard
                key={q.id}
                q={q}
                entries={entries.filter((e) => e.quarterId === q.id)}
                users={users}
                onOpen={() => goToQuarter(q)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 *  LiveBanner — a compact "currently writing" callout that
 *  links back to the feed (where the live quarter belongs).
 * ──────────────────────────────────────────────────────────── */
function LiveBanner({
  q,
  entries,
  onOpen,
}: {
  q: Quarter
  entries: Entry[]
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full text-left bg-gradient-to-br from-g-blue-l via-surface to-surface border border-g-blue-l rounded-lg p-4 mb-2 hover:border-g-blue transition"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white text-lg">
          ✍️
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-g-blue-d uppercase tracking-wide">Currently writing</div>
          <div className="font-display text-lg text-ink">
            {q.label.replace("'", '20')} · {entries.length} {entries.length === 1 ? 'entry' : 'entries'} so far
          </div>
          <div className="text-xs text-ink-3 mt-0.5">
            {formatShortDate(q.startDate)} – {formatShortDate(q.endDate)}
          </div>
        </div>
        <span className="text-base text-g-blue-d font-medium hidden sm:inline">Open in feed →</span>
        <span className="text-base text-g-blue-d sm:hidden">→</span>
      </div>
    </button>
  )
}

/* ────────────────────────────────────────────────────────────
 *  QuarterCard — full archived-quarter highlight card.
 * ──────────────────────────────────────────────────────────── */
function QuarterCard({
  q,
  entries,
  users,
  onOpen,
}: {
  q: Quarter
  entries: Entry[]
  users: User[]
  onOpen: () => void
}) {
  // Empty quarter — show a thin "nothing here" card
  if (entries.length === 0) {
    return (
      <article className="bg-surface border border-line rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-surface-soft text-lg">📦</span>
          <div className="flex-1">
            <div className="font-display text-lg text-ink">{q.label.replace("'", '20')}</div>
            <div className="text-xs text-ink-3">
              {formatShortDate(q.startDate)} – {formatShortDate(q.endDate)} · nothing posted
            </div>
          </div>
        </div>
      </article>
    )
  }

  // ── Highlights ───────────────────────────────────────────
  const totalReacts = (e: Entry) =>
    e.likeCount + e.commentCount + e.goingCount + e.interestedCount

  // Top 4 entries by total engagement (for the photo strip + top moment)
  const top4 = [...entries].sort((a, b) => totalReacts(b) - totalReacts(a)).slice(0, 4)
  const topMoment = top4[0]

  // Top contributor — count both authored and contributed entries
  const contribCounts = new Map<string, number>()
  entries.forEach((e) => {
    contribCounts.set(e.authorId, (contribCounts.get(e.authorId) ?? 0) + 1)
    e.contributorIds.forEach((id) => {
      if (id !== e.authorId) contribCounts.set(id, (contribCounts.get(id) ?? 0) + 0.5)
    })
  })
  const topContribId = [...contribCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const topContrib = topContribId ? users.find((u) => u.id === topContribId) : null
  const topContribCount = topContribId ? Math.round(contribCounts.get(topContribId)!) : 0

  // Dominant tag
  const tagCounts = new Map<string, number>()
  entries.forEach((e) => tagCounts.set(e.tag, (tagCounts.get(e.tag) ?? 0) + 1))
  const [topTag, topTagCount] = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0]

  // Aggregate stats
  const photoCount = entries.reduce((sum, e) => sum + e.photos.length, 0)
  const contribIds = new Set<string>()
  entries.forEach((e) => {
    contribIds.add(e.authorId)
    e.contributorIds.forEach((id) => contribIds.add(id))
  })

  return (
    <article className="bg-surface border border-line rounded-lg overflow-hidden hover:border-g-blue-d transition">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-surface-soft text-lg flex-shrink-0">
          📕
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg text-ink">{q.label.replace("'", '20')}</div>
          <div className="text-xs text-ink-3 mt-0.5">
            {formatShortDate(q.startDate)} – {formatShortDate(q.endDate)}
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-pill font-medium bg-surface-soft text-ink-3">
          Archived
        </span>
      </div>

      {/* Top 4 photos — best engagement, not first-4 chronologically */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {top4.map((e) => {
          const hero = e.photos.find((p) => p.id === e.heroPhotoId) ?? e.photos[0]
          return (
            <button
              key={e.id}
              type="button"
              onClick={onOpen}
              className="relative aspect-[4/3] bg-surface-soft overflow-hidden group"
              title={e.title}
            >
              {hero ? (
                hero.kind === 'video' ? (
                  <>
                    {hero.thumbUrl ? (
                      <img src={hero.thumbUrl} alt={e.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition" />
                    ) : (
                      <video src={hero.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-white text-3xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">▶</span>
                  </>
                ) : (
                  <img
                    src={hero.thumbUrl ?? hero.url}
                    alt={e.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-ink-3">📷</div>
              )}
            </button>
          )
        })}
        {/* Pad with empty tiles if fewer than 4 entries */}
        {Array.from({ length: Math.max(0, 4 - top4.length) }).map((_, i) => (
          <div key={`pad-${i}`} className="hidden sm:block aspect-[4/3] bg-surface-soft" />
        ))}
      </div>

      {/* Highlights row */}
      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-base">
        {topMoment && (
          <div className="min-w-0">
            <div className="text-xs text-ink-3 mb-0.5">🌟 Top moment</div>
            <div className="text-ink font-medium truncate" title={topMoment.title}>
              {topMoment.title}
            </div>
            <div className="text-xs text-ink-3">
              {totalReacts(topMoment)} {totalReacts(topMoment) === 1 ? 'reaction' : 'reactions'}
            </div>
          </div>
        )}

        {topContrib && (
          <div className="min-w-0">
            <div className="text-xs text-ink-3 mb-0.5">👤 Most active</div>
            <div className="flex items-center gap-1.5">
              <UserAvatar user={topContrib} size="sm" />
              <div className="min-w-0">
                <div className="text-ink font-medium truncate">{topContrib.firstName || topContrib.name}</div>
                <div className="text-xs text-ink-3">
                  {topContribCount} {topContribCount === 1 ? 'post' : 'posts'}
                </div>
              </div>
            </div>
          </div>
        )}

        {topTag && (
          <div className="min-w-0">
            <div className="text-xs text-ink-3 mb-0.5">🏷️ Mostly</div>
            <div className="text-ink font-medium truncate" title={topTag}>{topTag}</div>
            <div className="text-xs text-ink-3">
              {topTagCount} of {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        )}
      </div>

      {/* Stats + CTA */}
      <div className="px-4 py-3 border-t border-line flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-4 text-xs text-ink-3 flex-1">
          <span><strong className="text-ink font-display text-base">{entries.length}</strong> {entries.length === 1 ? 'entry' : 'entries'}</span>
          <span><strong className="text-ink font-display text-base">{photoCount}</strong> {photoCount === 1 ? 'photo' : 'photos'}</span>
          <span><strong className="text-ink font-display text-base">{contribIds.size}</strong> {contribIds.size === 1 ? 'contributor' : 'contributors'}</span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="px-4 py-2 rounded-sm bg-ink text-white text-base font-medium hover:bg-g-blue transition flex items-center justify-center gap-1.5"
        >
          Browse {q.label.replace("'", '20')} <span aria-hidden>→</span>
        </button>
      </div>
    </article>
  )
}
