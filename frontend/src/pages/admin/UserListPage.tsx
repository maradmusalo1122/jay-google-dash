import { useState } from 'react'
import { useStore } from '@/lib/store'
import UserAvatar from '@/components/ui/UserAvatar'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export default function UserListPage() {
  const { users } = useStore()
  const [q, setQ] = useState('')

  const filtered = users.filter((u) => {
    if (!q.trim()) return true
    const k = q.toLowerCase()
    return u.name.toLowerCase().includes(k) || u.email.toLowerCase().includes(k)
  })

  return (
    <div>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or email…"
        className="w-full max-w-sm text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue mb-4"
      />

      {/* Desktop table */}
      <div className="hidden md:block bg-surface border border-line rounded-md overflow-hidden">
        <table className="w-full text-base">
          <thead className="bg-surface-soft text-xs text-ink-3 uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Office</th>
              <th className="text-left px-4 py-2 font-medium">Team</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={u} size="sm" />
                    <span className="text-ink">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-ink-3">{u.email}</td>
                <td className="px-4 py-2.5 text-ink-3">{u.office ?? '—'}</td>
                <td className="px-4 py-2.5 text-ink-3">{u.team ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <StatusPill kind={u.role === 'admin' ? 'admin' : 'member'} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill kind={u.status} />
                </td>
                <td className="px-4 py-2.5 text-ink-3">
                  {u.lastActiveAt ? relativeTime(u.lastActiveAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="bg-surface border border-line rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <UserAvatar user={u} size="md" />
              <div className="min-w-0 flex-1">
                <div className="text-md font-medium text-ink truncate">{u.name}</div>
                <div className="text-xs text-ink-3 truncate">{u.email}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <StatusPill kind={u.role === 'admin' ? 'admin' : 'member'} />
              <StatusPill kind={u.status} />
              {u.office && <Tag>{u.office}</Tag>}
              {u.team && <Tag>{u.team}</Tag>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-pill bg-surface-soft text-ink-3">
      {children}
    </span>
  )
}

function StatusPill({ kind }: { kind: 'admin' | 'member' | 'pending' | 'approved' | 'disabled' }) {
  const styles: Record<string, string> = {
    admin: 'bg-g-blue-l text-g-blue-d',
    member: 'bg-surface-soft text-ink-3',
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    disabled: 'bg-rose-100 text-rose-800',
  }
  return (
    <span className={cn('inline-flex text-xs px-2 py-0.5 rounded-pill font-medium', styles[kind])}>
      {kind}
    </span>
  )
}
