import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import StatCard from '@/components/ui/StatCard'
import PostCard from '@/components/feed/PostCard'
import UpcomingEventCard from '@/components/feed/UpcomingEventCard'
import PhotoModal from '@/components/feed/PhotoModal'
import Toast from '@/components/ui/Toast'
import type { Entry } from '@/types'

export default function FeedPage() {
  const { entries, selectedQuarter, isViewingLive, loading, setSelectedQuarter } = useStore()
  const [searchParams] = useSearchParams()
  const [openPhotoEntry, setOpenPhotoEntry] = useState<Entry | null>(null)
  const [openPhotoIndex, setOpenPhotoIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  // Deep link from a shared post link (/feed?post=<id>): switch to that post's
  // quarter, then scroll to it and briefly highlight it.
  const sharedPostId = searchParams.get('post')
  useEffect(() => {
    if (!sharedPostId || loading) return
    const target = entries.find((e) => e.id === sharedPostId)
    if (!target) return
    if (target.quarterId !== selectedQuarter.id) setSelectedQuarter(target.quarterId)
    const timer = setTimeout(() => {
      const el = document.getElementById(`entry-${sharedPostId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-g-blue', 'ring-offset-2')
      setTimeout(() => el.classList.remove('ring-2', 'ring-g-blue', 'ring-offset-2'), 2600)
    }, 450)
    return () => clearTimeout(timer)
  }, [sharedPostId, loading, entries, selectedQuarter.id, setSelectedQuarter])

  const openPhoto = (entry: Entry, index = 0) => {
    setOpenPhotoEntry(entry)
    setOpenPhotoIndex(index)
  }

  const quarterEntries = useMemo(
    () =>
      entries
        .filter((e) => e.quarterId === selectedQuarter.id)
        .sort((a, b) => {
          // Upcoming events pinned to top, sorted by event date (soonest first).
          if (a.type === 'upcoming_event' && b.type !== 'upcoming_event') return -1
          if (a.type !== 'upcoming_event' && b.type === 'upcoming_event') return 1
          if (a.type === 'upcoming_event' && b.type === 'upcoming_event') {
            return (a.eventDate ?? '').localeCompare(b.eventDate ?? '')
          }
          return b.createdAt.localeCompare(a.createdAt)
        }),
    [entries, selectedQuarter.id],
  )

  const totals = useMemo(() => {
    const photos = quarterEntries.reduce((sum, e) => sum + e.photos.length, 0)
    const contribIds = new Set<string>()
    quarterEntries.forEach((e) => e.contributorIds.forEach((id) => contribIds.add(id)))
    return { entries: quarterEntries.length, photos, contributors: contribIds.size }
  }, [quarterEntries])

  const handleShareLinkedIn = (entry: Entry) => {
    if (!entry.publicSlug) return
    const eventUrl = `${window.location.origin}/event/${entry.publicSlug}`
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600')
    setToast('Opened LinkedIn share — the OG preview pulls from the public event page.')
  }

  return (
    <div>
      {!isViewingLive && (
        <div className="bg-surface-soft border border-line rounded-md px-4 py-2.5 mb-4 text-base text-ink-2 flex items-center gap-2">
          <span aria-hidden>📦</span>
          You're viewing the <strong className="font-medium text-ink">{selectedQuarter.label}</strong> archive. New entries can only be added to the live quarter.
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <StatCard number={totals.entries} label="Entries" />
          <StatCard number={totals.photos} label="Photos" />
          <StatCard number={totals.contributors} label="Contributors" />
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-ink-3">
          <div className="inline-block w-8 h-8 border-2 border-ink-3 border-t-transparent rounded-full animate-spin" />
          <p className="text-md mt-3">Loading the chronicle…</p>
          <p className="text-sm text-ink-3 mt-1">The server may take ~30 seconds to wake up on first load.</p>
        </div>
      ) : quarterEntries.length === 0 ? (
        <div className="text-center py-16 text-ink-3">
          <div className="text-4xl">📭</div>
          <p className="text-md mt-2">No entries yet for {selectedQuarter.label}.</p>
        </div>
      ) : (
        quarterEntries.map((entry) =>
          entry.type === 'upcoming_event' ? (
            <UpcomingEventCard
              key={entry.id}
              entry={entry}
              onOpenPhoto={(e) => openPhoto(e)}
              onShareLinkedIn={handleShareLinkedIn}
            />
          ) : (
            <PostCard key={entry.id} entry={entry} onOpenPhoto={openPhoto} />
          ),
        )
      )}

      <PhotoModal entry={openPhotoEntry} initialIndex={openPhotoIndex} onClose={() => setOpenPhotoEntry(null)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
