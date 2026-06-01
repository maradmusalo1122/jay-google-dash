import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import TagChip from '@/components/ui/TagChip'
import { cn } from '@/lib/cn'
import type { Entry } from '@/types'
import { formatShortDate } from '@/lib/format'

interface Props {
  entry: Entry | null
  onClose: () => void
}

export default function PhotoModal({ entry, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Reset the active thumbnail every time we open a different entry.
  useEffect(() => {
    setActiveIdx(0)
  }, [entry?.id])

  if (!entry) return null
  const photos = entry.photos
  const photo = photos[activeIdx] ?? photos[0]

  return (
    <Modal open={!!entry} onClose={onClose} size="xl">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="font-display text-xl text-ink leading-tight">{entry.title}</h2>
            {entry.eventDate && (
              <div className="text-xs text-ink-3 mt-1">
                {entry.eventName ? `${entry.eventName} · ` : ''}
                {formatShortDate(entry.eventDate)}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-ink-3 hover:text-ink leading-none px-2 -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <TagChip tag={entry.tag} />
        </div>

        <div className="rounded-md overflow-hidden bg-black mb-3 aspect-[4/3] flex items-center justify-center">
          {photo && photo.kind === 'video' ? (
            <video
              key={photo.id}
              src={photo.url}
              poster={photo.thumbUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full bg-black"
            />
          ) : photo ? (
            <img
              src={photo.url}
              alt={photo.label ?? entry.title}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        {photos.length > 1 && (
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={cn(
                  'relative aspect-square rounded overflow-hidden border-2 transition',
                  i === activeIdx ? 'border-g-blue' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                {p.kind === 'video' ? (
                  <>
                    {p.thumbUrl ? (
                      <img src={p.thumbUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={p.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">▶</span>
                  </>
                ) : (
                  <img src={p.thumbUrl ?? p.url} alt={p.label ?? ''} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {photo?.label && (
          <p className="text-xs text-ink-3 italic mb-3">{photo.label}</p>
        )}

        <p className="text-base text-ink-2 leading-relaxed mb-4">{entry.caption}</p>

        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-sm border border-line bg-surface text-base hover:bg-surface-soft"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
