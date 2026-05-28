import { useStore } from '@/lib/store'
import UserAvatar from '@/components/ui/UserAvatar'
import { relativeTime } from '@/lib/format'
import Toast from '@/components/ui/Toast'
import { useState } from 'react'

export default function ApproveRegistrationPage() {
  const { users, setUserStatus } = useStore()
  const [toast, setToast] = useState<string | null>(null)
  const pending = users.filter((u) => u.status === 'pending')

  return (
    <div>
      {pending.length === 0 ? (
        <div className="bg-surface border border-line rounded-md p-8 text-center">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-md text-ink-2">Nobody's waiting. All caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((u) => (
            <div key={u.id} className="bg-surface border border-line rounded-md p-4 flex items-center gap-3 flex-wrap">
              <UserAvatar user={u} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="text-md font-medium text-ink">{u.name}</div>
                <div className="text-xs text-ink-3">{u.email}</div>
                <div className="text-xs text-ink-3 mt-1">
                  Requested {relativeTime(u.createdAt)}
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setUserStatus(u.id, 'disabled')
                    setToast(`Rejected ${u.firstName}`)
                  }}
                  className="text-base px-3 py-1.5 rounded-sm border border-line text-ink-3 hover:text-rose-700 hover:border-rose-300 transition"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserStatus(u.id, 'approved')
                    setToast(`${u.firstName} approved — they can now sign in.`)
                  }}
                  className="text-base px-3 py-1.5 rounded-sm bg-g-green text-white font-medium hover:opacity-90 transition"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
