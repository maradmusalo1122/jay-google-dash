import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import Modal from '@/components/ui/Modal'
import MentionInput from './MentionInput'
import { ALL_TAGS, type Entry, type Tag } from '@/types'
import { deserializeMentions } from '@/lib/mentions'
import { copyPostLink } from '@/lib/share'
import { uploadMedia, type UploadedMedia } from '@/lib/uploads'
import { cn } from '@/lib/cn'

/**
 * The "⋯" management menu on a post card. Shown only to the post's author or an
 * admin (edit + delete are also enforced server-side). Sharing/copying the link
 * lives in the main actions row (the Share button), like other social apps, so
 * it isn't duplicated here.
 */
export default function PostActions({
  entry,
  onNotify,
}: {
  entry: Entry
  onNotify: (msg: string) => void
}) {
  const { currentUser } = useAuth()
  const { deleteEntry } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const canManage = !!currentUser && (currentUser.id === entry.authorId || currentUser.role === 'admin')

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Nothing to manage → no menu (everyone shares via the Share button in the row).
  if (!canManage) return null

  const copyLink = async () => {
    setOpen(false)
    onNotify((await copyPostLink(entry.id)) ? 'Link copied to clipboard' : 'Could not copy the link')
  }

  const doDelete = () => {
    setOpen(false)
    if (!window.confirm(`Delete "${entry.title}"? This can't be undone.`)) return
    deleteEntry(entry.id)
      .then(() => onNotify('Post deleted'))
      .catch(() => onNotify('Could not delete the post'))
  }

  return (
    <div className="relative flex-shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Post options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-xl leading-none text-ink-3 hover:bg-surface-soft hover:text-ink transition"
      >
        ⋯
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-48 bg-surface border border-line rounded-md shadow-lg py-1 overflow-hidden"
        >
          <MenuItem onClick={() => { setOpen(false); setEditing(true) }}>
            <span aria-hidden>✏️</span> Edit post
          </MenuItem>
          <MenuItem onClick={copyLink}>
            <span aria-hidden>📋</span> Copy link
          </MenuItem>
          <MenuItem onClick={doDelete} danger>
            <span aria-hidden>🗑️</span> Delete post
          </MenuItem>
        </div>
      )}

      {editing && (
        <EditPostModal
          entry={entry}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            onNotify('Post updated')
          }}
        />
      )}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-base text-left transition',
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink hover:bg-surface-soft',
      )}
    >
      {children}
    </button>
  )
}

/* ── Edit modal (title / caption / tag / media) ─────────────────── */

const MAX_MEDIA = 10

interface EditMedia {
  key: string
  kind: 'photo' | 'video'
  preview: string // existing thumb/url, or an object URL while uploading
  existingId?: string // set when this is an already-saved photo to keep
  uploaded?: UploadedMedia // set when this is a freshly uploaded item
  status: 'ready' | 'uploading' | 'error'
  pct: number
}

function EditPostModal({
  entry,
  onClose,
  onSaved,
}: {
  entry: Entry
  onClose: () => void
  onSaved: () => void
}) {
  const { editEntry, users } = useStore()
  const [title, setTitle] = useState(entry.title)
  const [caption, setCaption] = useState(() => deserializeMentions(entry.caption, users))
  const [tag, setTag] = useState<Tag>(entry.tag)
  const [media, setMedia] = useState<EditMedia[]>(() =>
    [...entry.photos]
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        key: p.id,
        kind: (p.kind ?? 'photo') as 'photo' | 'video',
        preview: p.kind === 'video' ? p.url : p.thumbUrl ?? p.url,
        existingId: p.id,
        status: 'ready' as const,
        pct: 100,
      })),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploading = media.some((m) => m.status === 'uploading')

  const removeMedia = (key: string) => {
    setMedia((prev) => {
      const t = prev.find((m) => m.key === key)
      if (t && !t.existingId && t.preview.startsWith('blob:')) URL.revokeObjectURL(t.preview)
      return prev.filter((m) => m.key !== key)
    })
  }

  const onPickFiles = async (files: FileList | null) => {
    if (!files || !files.length) return
    const remaining = MAX_MEDIA - media.length
    const arr = Array.from(files).slice(0, remaining)
    const tiles: EditMedia[] = arr.map((f) => ({
      key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: f.type.startsWith('video/') ? 'video' : 'photo',
      preview: URL.createObjectURL(f),
      status: 'uploading',
      pct: 0,
    }))
    setMedia((prev) => [...prev, ...tiles])
    await Promise.all(
      tiles.map(async (tile, i) => {
        try {
          const up = await uploadMedia(arr[i], {
            onProgress: (pct) => setMedia((prev) => prev.map((m) => (m.key === tile.key ? { ...m, pct } : m))),
          })
          setMedia((prev) => prev.map((m) => (m.key === tile.key ? { ...m, uploaded: up, status: 'ready', pct: 100 } : m)))
        } catch {
          setMedia((prev) => prev.map((m) => (m.key === tile.key ? { ...m, status: 'error' } : m)))
        }
      }),
    )
  }

  const save = async () => {
    if (!title.trim()) {
      setError('Title cannot be empty.')
      return
    }
    if (uploading) return
    setBusy(true)
    setError(null)
    const photos = media
      .filter((m) => m.status === 'ready')
      .map((m) =>
        m.existingId
          ? { id: m.existingId }
          : {
              kind: m.uploaded!.kind,
              url: m.uploaded!.url,
              thumbUrl: m.uploaded!.thumbUrl,
              width: m.uploaded!.width,
              height: m.uploaded!.height,
              duration: m.uploaded!.duration,
            },
      )
    try {
      await editEntry(entry.id, { title: title.trim(), caption: caption.trim(), tag, photos })
      onSaved()
    } catch {
      setBusy(false)
      setError('Could not save. Please try again.')
    }
  }

  return (
    <Modal open onClose={onClose} size="md">
      <div className="p-5">
        <h2 className="font-display text-xl mb-4">Edit post</h2>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-base px-3 py-2 rounded-sm mb-3">
            {error}
          </div>
        )}

        <label className="block text-xs font-medium text-ink-3 mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue mb-3"
        />

        <label className="block text-xs font-medium text-ink-3 mb-1.5">Caption / story</label>
        <MentionInput
          value={caption}
          onChange={setCaption}
          multiline
          placeholder="What happened, who was there… (type @ to mention)"
          className="w-full text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue mb-3 h-24 resize-none"
        />

        {/* Media editor */}
        <label className="block text-xs font-medium text-ink-3 mb-1.5">
          Photos &amp; videos {media.length > 0 && <span className="text-ink-3">({media.length})</span>}
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onPickFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 mb-1.5">
          {media.map((m) => (
            <div key={m.key} className="relative aspect-square rounded-sm overflow-hidden bg-ink/5">
              {m.kind === 'video' ? (
                <video src={m.preview} className="w-full h-full object-cover" muted playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img src={m.preview} className="w-full h-full object-cover" />
              )}
              {m.kind === 'video' && (
                <span className="absolute bottom-0.5 left-0.5 text-white text-[10px] drop-shadow">▶</span>
              )}
              {m.status === 'uploading' && (
                <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-white text-[10px]">
                  {m.pct}%
                </div>
              )}
              {m.status === 'error' && (
                <div className="absolute inset-0 bg-rose-700/80 flex items-center justify-center text-white text-[9px] px-1 text-center">
                  failed
                </div>
              )}
              <button
                type="button"
                onClick={() => removeMedia(m.key)}
                aria-label="Remove media"
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-rose-600"
              >
                ×
              </button>
            </div>
          ))}
          {media.length < MAX_MEDIA && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-sm border-2 border-dashed border-line text-ink-3 hover:border-g-blue hover:text-g-blue flex flex-col items-center justify-center text-lg"
              aria-label="Add photos or videos"
            >
              +
              <span className="text-[9px] leading-none">Add</span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-3 mb-4">
          Tap × to remove. Removed media is deleted from the post when you save. A post can have no media at all.
        </p>

        <label className="block text-xs font-medium text-ink-3 mb-1.5">Tag</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-4">
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={cn(
                'px-2 py-1.5 rounded-sm border text-xs font-medium transition',
                tag === t
                  ? 'bg-g-blue-l text-g-blue-d border-[#85B7EB]'
                  : 'bg-surface text-ink-3 border-line hover:border-g-blue',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-sm border border-line text-base">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || uploading || !title.trim()}
            className="px-4 py-2 rounded-sm bg-g-blue text-white text-base font-medium hover:bg-g-blue-d disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Saving…' : uploading ? 'Uploading…' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
