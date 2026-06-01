import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { uploadMedia, type UploadedMedia } from '@/lib/uploads'
import { ALL_TAGS, type Tag } from '@/types'
import Toast from '@/components/ui/Toast'
import MentionInput from '@/components/feed/MentionInput'
import PhotoCropModal from '@/components/ui/PhotoCropModal'
import { cn } from '@/lib/cn'

type Mode = 'post' | 'upcoming_event'

/** A file the user picked, in one of three states. */
interface MediaItem {
  id: string
  status: 'uploading' | 'ready' | 'error'
  pct: number
  kind: 'photo' | 'video'
  /** Local preview URL (object URL or data URL) — for the thumbnail tile while uploading. */
  preview: string
  /** Server-returned data after upload completes. */
  media?: UploadedMedia
  error?: string
}

const MAX_PHOTOS_POST = 10
const MAX_PHOTOS_EVENT = 1

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
  const [items, setItems] = useState<MediaItem[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // For the "Edit (crop)" flow on a single photo thumbnail
  const [cropFor, setCropFor] = useState<{ id: string; source: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxCount = mode === 'post' ? MAX_PHOTOS_POST : MAX_PHOTOS_EVENT

  const resetForm = () => {
    setTitle('')
    setCaption('')
    setTag('Team event')
    setEventDate('')
    setEventName('')
    setVenue('')
    setVenueMapUrl('')
    items.forEach((it) => {
      if (it.preview.startsWith('blob:')) URL.revokeObjectURL(it.preview)
    })
    setItems([])
  }

  const handleFilesPicked = async (filesRaw: FileList | null) => {
    if (!filesRaw || !filesRaw.length) return
    const remaining = maxCount - items.length
    const files = Array.from(filesRaw).slice(0, remaining)

    // Create placeholder tiles first so the user sees instant feedback
    const tiles: MediaItem[] = files.map((f) => ({
      id: `mi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'uploading',
      pct: 0,
      kind: f.type.startsWith('video/') ? 'video' : 'photo',
      preview: URL.createObjectURL(f),
    }))
    setItems((prev) => [...prev, ...tiles])

    // Upload each in parallel
    await Promise.all(
      tiles.map(async (tile, i) => {
        try {
          const uploaded = await uploadMedia(files[i], {
            onProgress: (pct) =>
              setItems((prev) => prev.map((x) => (x.id === tile.id ? { ...x, pct } : x))),
          })
          setItems((prev) =>
            prev.map((x) => (x.id === tile.id ? { ...x, status: 'ready', media: uploaded, pct: 100 } : x)),
          )
        } catch (e: any) {
          setItems((prev) =>
            prev.map((x) =>
              x.id === tile.id ? { ...x, status: 'error', error: e?.message || 'upload failed' } : x,
            ),
          )
        }
      }),
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target?.preview.startsWith('blob:')) URL.revokeObjectURL(target.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  const openCropFor = (id: string) => {
    const it = items.find((x) => x.id === id)
    if (!it || it.kind !== 'photo' || it.status !== 'ready' || !it.media) return
    // Use the full server URL as the cropper source
    setCropFor({ id, source: it.media.url })
  }

  /** When the crop modal saves, re-upload the cropped image as a fresh file and swap it in. */
  const handleCropSave = async (dataUrl: string) => {
    if (!cropFor) return
    const id = cropFor.id
    setCropFor(null)
    // Convert data URL → File so we can re-use uploadMedia
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'cropped.jpg', { type: blob.type || 'image/jpeg' })
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, status: 'uploading', pct: 0, preview: URL.createObjectURL(blob) } : x,
      ),
    )
    try {
      const uploaded = await uploadMedia(file, {
        onProgress: (pct) =>
          setItems((prev) => prev.map((x) => (x.id === id ? { ...x, pct } : x))),
      })
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: 'ready', media: uploaded, pct: 100 } : x)),
      )
    } catch (e: any) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, status: 'error', error: e?.message || 'upload failed' } : x,
        ),
      )
    }
  }

  const readyItems = items.filter((i) => i.status === 'ready' && i.media)
  const hasUploadInFlight = items.some((i) => i.status === 'uploading')

  const canSubmit =
    !submitting &&
    !hasUploadInFlight &&
    title.trim() &&
    caption.trim() &&
    (mode === 'upcoming_event' ? eventDate && venue && readyItems.length >= 1 : true)

  const handleSubmit = async () => {
    if (!currentUser || !canSubmit) return
    setSubmitting(true)
    try {
      if (mode === 'post') {
        await addPost({
          authorId: currentUser.id,
          title: title.trim(),
          caption: caption.trim(),
          tag,
          eventName: eventName.trim() || undefined,
          eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
          media: readyItems.map((i) => i.media!),
        })
        setToast(`Posted to ${liveQuarter.label}!`)
      } else {
        const hero = readyItems[0]?.media
        if (!hero) {
          setToast('Please add a hero photo first.')
          setSubmitting(false)
          return
        }
        await addUpcomingEvent({
          authorId: currentUser.id,
          title: title.trim(),
          caption: caption.trim(),
          tag,
          eventDate: new Date(eventDate).toISOString(),
          venue: venue.trim(),
          venueMapUrl: venueMapUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(venue)}`,
          hero,
        })
        setToast('Upcoming event added to the Chronicle!')
      }

      resetForm()
      setTimeout(() => navigate('/feed'), 900)
    } catch (e: any) {
      setToast(`Failed to post: ${e?.message || 'unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

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

  const acceptStr = mode === 'post' ? 'image/*,video/*' : 'image/*'

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
          <div className="text-xs text-ink-3 mt-1">Share what already happened — photos, videos, story.</div>
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

      {/* Hero block — media uploader */}
      <div className="bg-ink rounded-lg px-4 sm:px-5 py-5 mb-3">
        <div className="font-display text-xl text-white text-center mb-1">
          {mode === 'post' ? 'What happened?' : 'What are you organising?'}
        </div>
        <div className="text-xs text-white/40 text-center mb-4">
          {mode === 'post'
            ? `Add photos or videos and tell the story — ${liveQuarter.label}`
            : `Add a hero photo and event details — ${liveQuarter.label}`}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptStr}
          multiple={mode === 'post'}
          className="hidden"
          onChange={(e) => {
            handleFilesPicked(e.target.files)
            e.target.value = ''
          }}
        />

        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[140px] border-2 border-dashed border-white/20 rounded-md text-white/60 hover:border-white/40 transition flex flex-col items-center justify-center px-4 py-5"
          >
            <div className="text-3xl">📷</div>
            <p className="text-md mt-2">
              Tap to add {mode === 'post' ? 'photos or videos' : 'a hero photo'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {mode === 'post' ? `Up to ${MAX_PHOTOS_POST} files · jpg/png/mp4/mov` : '1 hero image'}
            </p>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3 rounded-md overflow-hidden">
              {items.map((it) => (
                <MediaTile key={it.id} item={it} onRemove={() => removeItem(it.id)} onEdit={() => openCropFor(it.id)} />
              ))}
            </div>
            {items.length < maxCount && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 rounded-sm border-2 border-dashed border-white/20 text-white/60 text-base hover:border-white/40 transition"
              >
                + Add more ({items.length}/{maxCount})
              </button>
            )}
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
        {submitting
          ? 'Posting…'
          : hasUploadInFlight
            ? 'Waiting for uploads…'
            : mode === 'post'
              ? `Post to ${liveQuarter.label}`
              : `Add to ${liveQuarter.label}`}
      </button>

      <Toast message={toast} onDone={() => setToast(null)} />

      <PhotoCropModal
        open={!!cropFor}
        image={cropFor?.source ?? null}
        shape="rect"
        aspect={4 / 3}
        outputSize={1600}
        onCancel={() => setCropFor(null)}
        onSave={handleCropSave}
      />

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

/* ────────────────────────────────────────────────────────────────
 *  MediaTile — one cell in the upload grid. Handles its 3 states:
 *  uploading (progress bar), ready (image/video + edit/remove), error.
 * ──────────────────────────────────────────────────────────────── */
function MediaTile({
  item,
  onRemove,
  onEdit,
}: {
  item: MediaItem
  onRemove: () => void
  onEdit: () => void
}) {
  return (
    <div className="relative aspect-square bg-white/5 rounded-sm overflow-hidden group">
      {item.kind === 'video' ? (
        <video src={item.preview} className="w-full h-full object-cover" muted playsInline />
      ) : (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={item.preview} className="w-full h-full object-cover" />
      )}

      {/* Status overlay */}
      {item.status === 'uploading' && (
        <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center text-white text-xs">
          <span>{item.pct}%</span>
          <div className="w-3/4 h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-g-blue transition-all" style={{ width: `${item.pct}%` }} />
          </div>
        </div>
      )}

      {item.status === 'error' && (
        <div className="absolute inset-0 bg-rose-700/85 flex items-center justify-center text-white text-xs px-1.5 text-center">
          {item.error || 'failed'}
        </div>
      )}

      {/* Video play badge */}
      {item.kind === 'video' && item.status === 'ready' && (
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-sm bg-black/60 text-white text-xs flex items-center gap-1">
          <span>▶</span> Video
        </div>
      )}

      {/* Buttons (top-right) */}
      <div className="absolute top-1 right-1 flex gap-1">
        {item.kind === 'photo' && item.status === 'ready' && (
          <button
            type="button"
            onClick={onEdit}
            className="w-6 h-6 rounded-full bg-black/55 text-white text-xs flex items-center justify-center hover:bg-black/80"
            aria-label="Edit crop"
            title="Crop & reposition"
          >
            ✎
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="w-6 h-6 rounded-full bg-black/55 text-white text-xs flex items-center justify-center hover:bg-rose-600"
          aria-label="Remove"
        >
          ×
        </button>
      </div>
    </div>
  )
}
