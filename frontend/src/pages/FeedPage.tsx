import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import StatCard from '@/components/ui/StatCard'
import PostCard from '@/components/feed/PostCard'
import UpcomingEventCard from '@/components/feed/UpcomingEventCard'
import PhotoModal from '@/components/feed/PhotoModal'
import Toast from '@/components/ui/Toast'
import type { Entry } from '@/types'

export default function FeedPage() {
  const { entries, selectedQuarter, isViewingLive } = useStore()
  const [openPhotoEntry, setOpenPhotoEntry] = useState<Entry | null>(null)
  const [toast, setToast] = useState<string | null>(null)

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

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <StatCard number={totals.entries} label="Entries" />
        <StatCard number={totals.photos} label="Photos" />
        <StatCard number={totals.contributors} label="Contributors" />
      </div>

      {quarterEntries.length === 0 ? (
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
              onOpenPhoto={setOpenPhotoEntry}
              onShareLinkedIn={handleShareLinkedIn}
            />
          ) : (
            <PostCard key={entry.id} entry={entry} onOpenPhoto={setOpenPhotoEntry} />
          ),
        )
      )}

      <PhotoModal entry={openPhotoEntry} onClose={() => setOpenPhotoEntry(null)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
