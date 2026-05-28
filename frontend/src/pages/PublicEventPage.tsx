import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import GoogleLogo from '@/components/GoogleLogo'
import TagChip from '@/components/ui/TagChip'
import { formatShortDate } from '@/lib/format'

/**
 * Public Event Landing Page — /event/:slug
 *
 * This is the URL the LinkedIn share button targets.
 * Renders just the event basics (title, date, venue, hero image, caption)
 * and sets OpenGraph meta tags so LinkedIn shows a rich preview card.
 * No authentication, no internal data.
 */
export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>()
  const { entries } = useStore()
  const entry = entries.find((e) => e.publicSlug === slug && e.type === 'upcoming_event')

  // Set OG meta tags so LinkedIn (and other crawlers) render a rich card.
  useEffect(() => {
    if (!entry) return
    const hero = entry.photos[0]
    const tags: Record<string, string> = {
      'og:title': entry.title,
      'og:description': entry.caption.slice(0, 200),
      'og:type': 'article',
      'og:image': hero?.url ?? '',
      'og:url': window.location.href,
      'twitter:card': 'summary_large_image',
      'twitter:title': entry.title,
      'twitter:description': entry.caption.slice(0, 200),
      'twitter:image': hero?.url ?? '',
    }
    const created: HTMLMetaElement[] = []
    Object.entries(tags).forEach(([k, v]) => {
      const m = document.createElement('meta')
      m.setAttribute(k.startsWith('og:') ? 'property' : 'name', k)
      m.setAttribute('content', v)
      document.head.appendChild(m)
      created.push(m)
    })
    document.title = `${entry.title} · NBS SAPAC Chronicle`
    return () => {
      created.forEach((m) => m.remove())
      document.title = 'NBS SAPAC Chronicle'
    }
  }, [entry])

  if (!entry) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <GoogleLogo size={48} />
          <h1 className="font-display text-2xl mt-3">Event not found</h1>
          <p className="text-base text-ink-3 mt-2">This link may be old or the event was removed.</p>
        </div>
      </div>
    )
  }

  const hero = entry.photos[0]

  return (
    <div className="min-h-full">
      {/* Slim public header — no app shell */}
      <header className="bg-surface border-b border-line">
        <div className="max-w-page mx-auto px-4 py-3 flex items-center gap-2.5">
          <GoogleLogo size={26} />
          <div className="font-display text-base">NBS SAPAC Chronicle</div>
        </div>
      </header>

      <main className="max-w-page mx-auto px-4 sm:px-6 py-6">
        <article className="bg-surface border border-line rounded-lg overflow-hidden">
          {hero && (
            <img src={hero.url} alt={entry.title} className="w-full max-h-[480px] object-cover" />
          )}
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <TagChip tag={entry.tag} />
              <span className="text-xs text-amber-700 font-medium">UPCOMING EVENT</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-ink leading-tight mb-2">
              {entry.title}
            </h1>
            {entry.eventDate && (
              <div className="text-md text-ink-2 mb-1">
                {formatShortDate(entry.eventDate)}
              </div>
            )}
            {entry.venue && (
              <div className="text-md text-ink-2 mb-3">
                {entry.venue}
                {entry.venueMapUrl && (
                  <>
                    {' · '}
                    <a href={entry.venueMapUrl} target="_blank" rel="noreferrer" className="text-g-blue hover:underline">
                      Open in Google Maps
                    </a>
                  </>
                )}
              </div>
            )}
            <p className="text-md text-ink-2 leading-relaxed mt-4">{entry.caption}</p>

            <div className="border-t border-line mt-6 pt-4 text-base text-ink-3">
              Hosted by the NBS SAPAC team · {entry.goingCount} going · {entry.interestedCount} interested
            </div>
          </div>
        </article>

        <p className="text-xs text-ink-3 text-center mt-4">
          This is a public event page. The internal Chronicle is for the NBS SAPAC team only.
        </p>
      </main>
    </div>
  )
}
