import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import UserAvatar from '@/components/ui/UserAvatar'
import MentionInput, { type MentionInputHandle } from './MentionInput'
import MentionText from './MentionText'
import { deserializeMentions } from '@/lib/mentions'
import { relativeTime } from '@/lib/format'

interface Props {
  entryId: string
}

export interface CommentRowHandle {
  focus: () => void
}

const CommentRow = forwardRef<CommentRowHandle, Props>(function CommentRow({ entryId }, ref) {
  const { currentUser } = useAuth()
  const { getEntryComments, addComment, editComment, deleteComment, getUser, users } = useStore()
  const [body, setBody] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const inputRef = useRef<MentionInputHandle>(null)
  const comments = getEntryComments(entryId)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  const submit = () => {
    if (!currentUser) return
    if (!body.trim()) return
    addComment(entryId, currentUser.id, body)
    setBody('')
  }

  const startEdit = (commentId: string, storedBody: string) => {
    setEditingId(commentId)
    // Convert <@id> tokens back to @firstname for editing.
    setEditBody(deserializeMentions(storedBody, users))
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditBody('')
  }
  const saveEdit = () => {
    if (!editingId) return
    editComment(editingId, editBody)
    cancelEdit()
  }

  const visible = expanded ? comments : comments.slice(-2)
  const hidden = comments.length - visible.length
  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="border-t border-line">
      {comments.length > 0 && (
        <div className="px-4 pt-3 pb-2 space-y-2.5">
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs text-ink-3 hover:text-ink-2 underline"
            >
              View {hidden} earlier {hidden === 1 ? 'comment' : 'comments'}
            </button>
          )}
          {visible.map((c) => {
            const author = getUser(c.userId)
            const isOwn = currentUser?.id === c.userId
            const canEdit = isOwn
            const canDelete = isOwn || isAdmin
            const isEditing = editingId === c.id

            return (
              <div key={c.id} className="flex gap-2 items-start group">
                {author && (
                  <Link
                    to={`/u/${author.id}`}
                    className="flex-shrink-0"
                    title={`View ${author.name}'s profile`}
                  >
                    <UserAvatar user={author} size="sm" />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div>
                      <MentionInput
                        value={editBody}
                        onChange={setEditBody}
                        multiline
                        autoFocus
                        className="w-full text-base px-3 py-1.5 rounded-md border border-line bg-surface outline-none focus:border-g-blue resize-none min-h-[60px]"
                      />
                      <div className="flex gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={!editBody.trim()}
                          className="text-xs px-3 py-1 rounded-pill bg-g-blue text-white font-medium disabled:opacity-40 hover:bg-g-blue-d transition"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-xs px-3 py-1 rounded-pill border border-line text-ink-3 hover:text-ink"
                        >
                          Cancel
                        </button>
                        <span className="text-[10px] text-ink-3 self-center ml-1 hidden sm:inline">
                          Type @ to mention · Esc to cancel
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-base text-ink leading-snug">
                        {author ? (
                          <Link
                            to={`/u/${author.id}`}
                            className="font-medium hover:underline"
                            title={`View ${author.name}'s profile`}
                          >
                            {author.firstName}
                          </Link>
                        ) : (
                          <span className="font-medium">Someone</span>
                        )}{' '}
                        <MentionText body={c.body} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-ink-3">{relativeTime(c.createdAt)}</span>
                        {canEdit && (
                          <>
                            <span className="text-[10px] text-ink-3" aria-hidden>·</span>
                            <button
                              type="button"
                              onClick={() => startEdit(c.id, c.body)}
                              className="text-[10px] text-ink-3 hover:text-g-blue transition sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              Edit
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <>
                            <span className="text-[10px] text-ink-3" aria-hidden>·</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Delete this comment?')) deleteComment(c.id)
                              }}
                              className="text-[10px] text-ink-3 hover:text-rose-600 transition sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex gap-2 px-4 py-2.5 border-t border-line items-end">
        <div className="flex-1 min-w-0">
          <MentionInput
            ref={inputRef}
            value={body}
            onChange={setBody}
            onSubmit={submit}
            submitOnEnter
            placeholder="Add a comment... (type @ to mention)"
            className="w-full text-base px-3 py-1.5 rounded-pill border border-line bg-surface-soft outline-none focus:border-g-blue"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim()}
          className="text-sm px-3.5 py-1.5 rounded-pill bg-g-blue text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-g-blue-d transition flex-shrink-0"
        >
          Post
        </button>
      </div>
    </div>
  )
})

export default CommentRow
