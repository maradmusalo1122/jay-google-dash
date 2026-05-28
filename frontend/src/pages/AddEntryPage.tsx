import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { ALL_TAGS, type Tag } from '@/types'
import Toast from '@/components/ui/Toast'
import MentionInput from '@/components/feed/MentionInput'
import { cn } from '@/lib/cn'

type Mode = 'post' | 'upcoming_event'

const PLACEHOLDER_COLORS = ['#1D9E75', '#7F77DD', '#EF9F27', '#D4537E', '#378ADD', '#34A853', '#EA4335', '#4285F4', '#FBBC05', '#993556']

interface PendingPhoto {
  id: string
  seed: string
  color: string
}

export default function AddEntryPage() {
  const { currentUser } = useAuth()
  const { addPost, addUpcomingEvent, liveQuarter, isViewingLive, setSelectedQuarter } = useStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('post')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [tag, setTag] = useState<Tag>('Team event')
  const [eventDate, setEventDate] = useState('')
  const [eventName, setEventName] = useState('')
  const [venue, setVenue] = useState('')
  const [venueMapUrl, setVenueMapUrl] = useState('')
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const resetForm = () => {
    setTitle('')
    setCaption('')
    setTag('Team event')
    setEventDate('')
    setEventName('')
    setVenue('')
    setVenueMapUrl('')
    setPhotos([])
  }

  const addPhoto = () => {
    if (photos.length >= 10) return
    const i = photos.length
    setPhotos((p) => [
      ...p,
      {
        id: `pp-${Date.now()}-${i}`,
        seed: `user-${mode}-${Date.now()}-${i}`,
        color: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
      },
    ])
  }

  const removePhoto = (id: string) => {
    setPhotos((p) => p.filter((x) => x.id !== id))
  }

  const canSubmit =
    title.trim() &&
    caption.trim() &&
    (mode === 'upcoming_event' ? eventDate && venue : true)

  const handleSubmit = () => {
    if (!currentUser || !canSubmit) return

    if (mode === 'post') {
      const seeds = photos.length > 0 ? photos.map((p) => p.seed) : [`user-post-${Date.now()}-0`]
      addPost({
        authorId: currentUser.id,
        title: title.trim(),
        caption: caption.trim(),
        tag,
        eventName: eventName.trim() || undefined,
        eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
        photoSeeds: seeds,
      })
      setToast(`Posted to ${liveQuarter.label}!`)
    } else {
      addUpcomingEvent({
        authorId: currentUser.id,
        title: title.trim(),
        caption: caption.trim(),
        tag,
        eventDate: new Date(eventDate).toISOString(),
        venue: venue.trim(),
        venueMapUrl: venueMapUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(venue)}`,
        photoSeed: photos[0]?.seed ?? `user-event-${Date.now()}`,
      })
      setToast('Upcoming event added to the Chronicle!')
    }

    resetForm()
    setTimeout(() => navigate('/feed'), 900)
  }

  // If user is viewing an archived quarter, they shouldn't be here.
  // Switch them back to live and show a notice.
  if (!isViewingLive) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-5">
        <div className="font-display text-lg text-amber-900 mb-1">Switch to the live quarter to post</div>
        <p className="text-base text-amber-800 mb-3">
          New entries can only be added to the live quarter ({liveQuarter.label}). You're currently viewing an archived quarter.
        </p>
        <button
          type="button"
          onClick={() => setSelectedQuarter(liveQuarter.id)}
          className="px-4 py-2 rounded-sm bg-amber-600 text-white text-base font-medium hover:bg-amber-700 transition"
        >
          Switch to {liveQuarter.label}
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-4">+ Add entry</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <button
          type="button"
          onClick={() => setMode('post')}
          className={cn(
            'flex-1 px-4 py-3 rounded-md border text-md font-medium transition text-left',
            mode === 'post'
              ? 'bg-g-blue-l text-g-blue-d border-[#85B7EB]'
              : 'bg-surface text-ink border-line hover:border-g-blue',
          )}
        >
          <div className="font-display text-lg leading-tight">Post</div>
          <div className="text-xs text-ink-3 mt-1">Share what already happened — photos, caption, contributors.</div>
        </button>
        <button
          type="button"
          onClick={() => setMode('upcoming_event')}
          className={cn(
            'flex-1 px-4 py-3 rounded-md border text-md font-medium transition text-left',
            mode === 'upcoming_event'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-surface text-ink border-line hover:border-amber-400',
          )}
        >
          <div className="font-display text-lg leading-tight">Upcoming event</div>
          <div className="text-xs text-ink-3 mt-1">Announce something coming up. RSVPs, venue, shareable to LinkedIn.</div>
        </button>
      </div>

      {/* Hero block (dark, like prototype) */}
      <div className="bg-ink rounded-lg px-4 sm:px-5 py-5 mb-3">
        <div className="font-display text-xl text-white text-center mb-1">
          {mode === 'post' ? 'What happened?' : 'What are you organising?'}
        </div>
        <div className="text-xs text-white/40 text-center mb-4">
          {mode === 'post'
            ? `Add photos and tell the story — ${liveQuarter.label}`
            : `Add a hero photo and event details — ${liveQuarter.label}`}
        </div>

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={addPhoto}
            className="w-full min-h-[140px] border-2 border-dashed border-white/20 rounded-md text-white/60 hover:border-white/40 transition flex flex-col items-center justify-center px-4 py-5"
          >
            <div className="text-3xl">📷</div>
            <p className="text-md mt-2">Tap to add {mode === 'post' ? 'photos' : 'a hero photo'}</p>
            <p className="text-xs text-white/40 mt-1">
              {mode === 'post' ? 'Up to 10 photos' : '1 hero image'}
            </p>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3 rounded-md overflow-hidden">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative aspect-square flex items-center justify-center text-white/80 text-2xl"
                  style={{ backgroundColor: p.color }}
                >
                  📷
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/55 text-white text-xs flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {(mode === 'post' && photos.length < 10) || (mode === 'upcoming_event' && photos.length < 1) ? (
              <button
                type="button"
                onClick={addPhoto}
                className="w-full px-4 py-2 rounded-sm border-2 border-dashed border-white/20 text-white/60 text-base hover:border-white/40 transition"
              >
                + Add more photos ({photos.length}/{mode === 'post' ? 10 : 1})
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Details */}
      <div className="bg-surface border border-line rounded-lg p-5 mb-3 space-y-4">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === 'post' ? 'e.g. Surat Affiliate Partnership Mixer' : 'e.g. Mumbai Networking Dinner'}
            className="form-input"
          />
        </Field>

        {mode === 'post' && (
          <Field label="Event name (optional)">
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Social Beat Summit"
              className="form-input"
            />
          </Field>
        )}

        <Field label={mode === 'post' ? 'When did it happen?' : 'When?'}>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="form-input"
          />
        </Field>

        {mode === 'upcoming_event' && (
          <>
            <Field label="Venue">
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Sofitel Mumbai BKC"
                className="form-input"
              />
            </Field>
            <Field label="Google Maps URL (optional — we'll generate one if blank)">
              <input
                value={venueMapUrl}
                onChange={(e) => setVenueMapUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=…"
                className="form-input"
              />
            </Field>
          </>
        )}

        <Field label="Caption / story">
          <MentionInput
            value={caption}
            onChange={setCaption}
            multiline
            placeholder={mode === 'post'
              ? 'What happened, who was there, what made it memorable… (type @ to mention)'
              : "What's happening, who it's for, anything attendees should know… (type @ to mention)"}
            className="form-input h-24 resize-none"
          />
        </Field>

        <Field label="Tag">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={cn(
                  'px-2 py-2 rounded-sm border text-xs font-medium transition',
                  tag === t
                    ? 'bg-g-blue-l text-g-blue-d border-[#85B7EB]'
                    : 'bg-surface text-ink-3 border-line hover:border-g-blue hover:text-g-blue',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-md bg-g-blue text-white font-display text-md hover:bg-g-blue-d disabled:bg-line-strong disabled:text-ink-3 disabled:cursor-not-allowed transition"
      >
        {mode === 'post' ? `Post to ${liveQuarter.label}` : `Add to ${liveQuarter.label}`}
      </button>

      <Toast message={toast} onDone={() => setToast(null)} />

      <style>{`
        .form-input {
          width: 100%;
          font-size: 14px;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid #E8E8E2;
          background: #fff;
          color: #0F0F14;
          outline: none;
          font-family: inherit;
          transition: border-color .15s;
        }
        .form-input:focus { border-color: #4285F4; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-3 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
