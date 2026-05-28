import { Link } from 'react-router-dom'
import Modal from '@/components/ui/Modal'
import UserAvatar from '@/components/ui/UserAvatar'
import type { User } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  users: User[]
}

/**
 * Reusable list of people, opened from any avatar/name row
 * (Going, Interested, Contributors, Organisers, ...).
 * Shows full name + email + office + team — everything needed to know who.
 */
export default function PeopleListModal({ open, onClose, title, subtitle, users }: Props) {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl text-ink leading-tight">
              {title} <span className="text-ink-3 font-sans text-base">({users.length})</span>
            </h2>
            {subtitle && <p className="text-xs text-ink-3 mt-1 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-2xl text-ink-3 hover:text-ink leading-none px-2 -mt-1"
          >
            ×
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-base text-ink-3 text-center py-6">Nobody yet.</p>
        ) : (
          <ul className="divide-y divide-line max-h-[60vh] overflow-y-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            {users.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/u/${u.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 hover:bg-surface-soft -mx-5 sm:-mx-6 px-5 sm:px-6 transition"
                >
                  <UserAvatar user={u} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="text-md font-medium text-ink truncate">{u.name}</div>
                    <div className="text-xs text-ink-3 truncate">{u.email}</div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {u.office && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-g-blue-l text-g-blue-d font-medium">
                          {u.office === 'IN' ? 'India' : 'Singapore'}
                        </span>
                      )}
                      {u.team && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-surface-soft text-ink-3">
                          {u.team}
                        </span>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-amber-100 text-amber-800 font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
