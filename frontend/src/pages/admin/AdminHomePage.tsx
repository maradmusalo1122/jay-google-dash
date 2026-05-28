import { useStore } from '@/lib/store'
import StatCard from '@/components/ui/StatCard'
import { Link } from 'react-router-dom'

export default function AdminHomePage() {
  const { users, entries } = useStore()
  const pending = users.filter((u) => u.status === 'pending')
  const approved = users.filter((u) => u.status === 'approved')
  const upcoming = entries.filter((e) => e.type === 'upcoming_event')

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <StatCard number={approved.length} label="Approved members" />
        <StatCard number={pending.length} label="Pending approval" />
        <StatCard number={entries.length} label="Total entries" />
        <StatCard number={upcoming.length} label="Upcoming events" />
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-md text-amber-900">
                {pending.length} {pending.length === 1 ? 'person' : 'people'} waiting to join
              </div>
              <div className="text-base text-amber-800 mt-1">
                Review and approve so they can use the Chronicle.
              </div>
            </div>
            <Link
              to="/admin/approve"
              className="text-base px-4 py-2 rounded-sm bg-amber-600 text-white font-medium hover:bg-amber-700 transition flex-shrink-0"
            >
              Review
            </Link>
          </div>
        </div>
      )}

      <div className="bg-surface border border-line rounded-md p-5">
        <h2 className="font-display text-lg mb-2">Quick actions</h2>
        <ul className="text-base text-ink-2 space-y-2 list-disc list-inside">
          <li><Link to="/admin/users" className="text-g-blue hover:underline">View all users</Link></li>
          <li><Link to="/admin/content" className="text-g-blue hover:underline">Moderate posted content</Link></li>
          <li><Link to="/admin/activity" className="text-g-blue hover:underline">See recent activity</Link></li>
        </ul>
      </div>
    </div>
  )
}
