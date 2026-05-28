import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

const subTabs = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'User List' },
  { to: '/admin/activity', label: 'Activity Log' },
  { to: '/admin/content', label: 'Edit Content' },
  { to: '/admin/approve', label: 'Approve Registration' },
]

export default function AdminLayout() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/feed" replace />

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">Admin Dashboard</h1>
      <p className="text-base text-ink-3 mb-4">
        Manage the team, moderate content, approve new joiners.
      </p>

      <div className="bg-surface border border-line rounded-md flex overflow-x-auto mb-4">
        {subTabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'text-base px-4 py-2.5 whitespace-nowrap border-b-2 transition',
                isActive
                  ? 'text-g-blue border-g-blue font-medium'
                  : 'text-ink-3 border-transparent hover:text-ink',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
