import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import type { Photo } from '@/types'

interface Props {
  photos: Photo[]
  /** Alt/title fallback when a photo has no label. */
  title: string
  /** Open the full-screen lightbox at a given index. */
  onOpenLightbox: (index: number) => void
}

/**
 * One media item inside a uniform, fixed-aspect frame.
 *
 * Photos/videos in a post can have very different shapes (wide group photos,
 * tall action clips). To keep the carousel a consistent height with NO ugly
 * black letterbox bars, every slide uses the same square box and:
 *   - a blurred, zoomed copy of the image fills the background, then
 *   - the real image/video sits on top with object-contain (nothing cropped).
 */
function MediaFrame({
  photo,
  title,
  index,
  count,
  onOpen,
}: {
  photo: Photo
  title: string
  index: number
  count: number
  onOpen?: () => void
}) {
  const blurSrc = photo.thumbUrl ?? photo.url
  const blurLayer = (
    <img
      aria-hidden
      src={blurSrc}
      alt=""
      className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
    />
  )

  if (photo.kind === 'video') {
    return (
      <div className="relative w-full aspect-square bg-ink overflow-hidden">
        {blurLayer}
        <video
          src={photo.url}
          poster={photo.thumbUrl}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative block w-full aspect-square bg-ink overflow-hidden group/frame"
      aria-label={count > 1 ? `Open photo ${index + 1} of ${count}` : undefined}
    >
      {blurLayer}
      <img
        src={photo.url}
        alt={photo.label ?? `${title}${count > 1 ? ` — ${index + 1}` : ''}`}
        className="absolute inset-0 w-full h-full object-contain group-hover/frame:scale-[1.01] transition"
      />
    </button>
  )
}

/**
 * Instagram-style inline media carousel for a post card.
 *
 * - Native horizontal swipe (CSS scroll-snap) on touch
 * - Prev/next arrows on hover (desktop)
 * - Dot indicators + "n/m" counter so it's obvious there's more than one
 * - Every slide is the same height (uniform square), so mixed-aspect photos
 *   no longer letterbox with black bars
 */
export default function PostMediaCarousel({ photos, title, onOpenLightbox }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const count = photos.length

  const handleScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActive((prev) => (prev === idx ? prev : idx))
  }, [])

  const scrollToIdx = useCallback(
    (idx: number) => {
      const el = trackRef.current
      if (!el) return
      const clamped = Math.max(0, Math.min(count - 1, idx))
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
    },
    [count],
  )

  if (count === 0) return null

  // Single item — no carousel chrome.
  if (count === 1) {
    return <MediaFrame photo={photos[0]} title={title} index={0} count={1} onOpen={() => onOpenLightbox(0)} />
  }

  // Multiple items — full carousel.
  return (
    <div className="relative group/carousel">
      {/* Scroll track */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {photos.map((p, i) => (
          <div key={p.id} className="w-full flex-shrink-0 snap-center">
            <MediaFrame photo={p} title={title} index={i} count={count} onOpen={() => onOpenLightbox(i)} />
          </div>
        ))}
      </div>

      {/* Counter badge (top-right) — always visible so multi-photo is obvious */}
      <div className="absolute top-2.5 right-2.5 bg-black/65 text-white text-xs font-medium px-2 py-0.5 rounded-pill pointer-events-none">
        {active + 1}/{count}
      </div>

      {/* Prev arrow */}
      {active > 0 && (
        <button
          type="button"
          onClick={() => scrollToIdx(active - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 text-ink shadow-md flex items-center justify-center hover:bg-white transition opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      {/* Next arrow */}
      {active < count - 1 && (
        <button
          type="button"
          onClick={() => scrollToIdx(active + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 text-ink shadow-md flex items-center justify-center hover:bg-white transition opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
          aria-label="Next photo"
        >
          ›
        </button>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-pill bg-black/35">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => scrollToIdx(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={cn(
              'rounded-full transition-all',
              i === active ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/55 hover:bg-white/80',
            )}
          />
        ))}
      </div>
    </div>
  )
}
