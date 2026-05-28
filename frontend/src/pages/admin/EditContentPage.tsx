import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import TagChip from '@/components/ui/TagChip'
import { formatShortDate } from '@/lib/format'
import { ALL_TAGS, type Entry, type Tag } from '@/types'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { deserializeMentions } from '@/lib/mentions'

export default function EditContentPage() {
  const { entries, getUser, editEntry, deleteEntry, users } = useStore()
  const [editing, setEditing] = useState<Entry | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <div>
      <p className="text-base text-ink-3 mb-4">
        Edit or delete any entry on the platform. No "edited" badge will appear on the
        post — actions are recorded in the Activity Log only.
      </p>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-base text-ink-3 text-center py-8">No entries to moderate.</p>
        ) : (
          entries.map((e) => {
            const author = getUser(e.authorId)
            const hero = e.photos.find((p) => p.id === e.heroPhotoId) ?? e.photos[0]
            return (
              <div key={e.id} className="bg-surface border border-line rounded-md p-3 flex gap-3 items-start">
                {hero && (
                  <img
                    src={hero.thumbUrl ?? hero.url}
                    alt=""
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-sm flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="text-md font-medium text-ink leading-tight">{e.title}</div>
                    <TagChip tag={e.tag} />
                  </div>
                  <div className="text-xs text-ink-3 mt-1">
                    {e.type === 'upcoming_event' ? '📅 Upcoming · ' : ''}
                    by {author?.firstName ?? 'unknown'} · {formatShortDate(e.createdAt)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditing(e)}
                      className="text-base text-g-blue hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${e.title}"? This cannot be undone.`)) {
                          deleteEntry(e.id)
                          setToast('Entry deleted')
                        }
                      }}
                      className="text-base text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <EditModal
        entry={editing}
        users={users}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) editEntry(editing.id, patch)
          setEditing(null)
          setToast('Entry updated')
        }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function EditModal({
  entry,
  users,
  onClose,
  onSave,
}: {
  entry: Entry | null
  users: ReturnType<typeof useStore>['users']
  onClose: () => void
  onSave: (patch: Partial<Pick<Entry, 'title' | 'caption' | 'tag'>>) => void
}) {
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [tag, setTag] = useState<Tag>('Team event')

  // Resync form whenever a different entry is opened (or modal opens/closes).
  // Captions get deserialized from <@id> → @firstname for editing.
  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setCaption(deserializeMentions(entry.caption, users))
      setTag(entry.tag)
    }
  }, [entry?.id, users])

  return (
    <Modal open={!!entry} onClose={onClose} size="md">
      <div className="p-5">
        <h2 className="font-display text-xl mb-4">Edit entry</h2>
        <label className="block text-xs font-medium text-ink-3 mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue mb-3"
        />
        <label className="block text-xs font-medium text-ink-3 mb-1.5">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue mb-3 h-24 resize-none"
        />
        <label className="block text-xs font-medium text-ink-3 mb-1.5">Tag</label>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-line text-base"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ title: title.trim(), caption: caption.trim(), tag })}
            disabled={!title.trim() || !caption.trim()}
            className="px-4 py-2 rounded-sm bg-g-blue text-white text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
