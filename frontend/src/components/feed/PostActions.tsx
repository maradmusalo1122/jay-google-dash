import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import MentionInput from './MentionInput'
import { ALL_TAGS, type Entry, type Tag } from '@/types'
import { deserializeMentions } from '@/lib/mentions'
import { cn } from '@/lib/cn'

/**
 * The "⋯" menu shown on every post card.
 *  - Edit / Delete: only for the post's author or an admin (also enforced server-side).
 *  - Share / Copy link: anyone. The link opens the post inside the app, so only
 *    signed-in teammates can actually view it.
 */
export default function PostActions({ entry }: { entry: Entry }) {
  const { currentUser } = useAuth()
  const { deleteEntry } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const canManage = !!currentUser && (currentUser.id === entry.authorId || currentUser.role === 'admin')
  const shareUrl = `${window.location.origin}/feed?post=${entry.id}`

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const doShare = async () => {
    setOpen(false)
    const data = { title: entry.title, text: `${entry.title} — NBS SAPAC Chronicle`, url: shareUrl }
    // navigator.share opens the phone's native sheet (WhatsApp, Mail, etc.)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data)
      } catch {
        /* user cancelled the share sheet — ignore */
      }
      return
    }
    await copyLink('Sharing not supported here — link copied instead')
  }

  const copyLink = async (msg = 'Link copied — paste it in WhatsApp, email, anywhere') => {
    setOpen(false)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setToast(msg)
    } catch {
      setToast(shareUrl)
    }
  }

  const doDelete = () => {
    setOpen(false)
    if (!window.confirm(`Delete "${entry.title}"? This can't be undone.`)) return
    deleteEntry(entry.id)
      .then(() => setToast('Post deleted'))
      .catch(() => setToast('Could not delete the post'))
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
          {canManage && (
            <MenuItem onClick={() => { setOpen(false); setEditing(true) }}>
              <span aria-hidden>✏️</span> Edit post
            </MenuItem>
          )}
          <MenuItem onClick={doShare}>
            <span aria-hidden>🔗</span> Share…
          </MenuItem>
          <MenuItem onClick={() => copyLink()}>
            <span aria-hidden>📋</span> Copy link
          </MenuItem>
          {canManage && (
            <MenuItem onClick={doDelete} danger>
              <span aria-hidden>🗑️</span> Delete post
            </MenuItem>
          )}
        </div>
      )}

      {editing && (
        <EditPostModal
          entry={entry}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            setToast('Post updated')
          }}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
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

/* ── Edit modal (title / caption / tag) ─────────────────────────── */
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!title.trim()) {
      setError('Title cannot be empty.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await editEntry(entry.id, { title: title.trim(), caption: caption.trim(), tag })
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
            disabled={busy || !title.trim()}
            className="px-4 py-2 rounded-sm bg-g-blue text-white text-base font-medium hover:bg-g-blue-d disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
