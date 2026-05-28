import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'

const tabs = [
  { to: '/feed', label: 'Chronicle feed' },
  { to: '/explore', label: 'Explore' },
  { to: '/archive', label: 'Archive' },
]

export default function NavRow() {
  const { currentUser } = useAuth()
  const { isViewingLive, setSelectedQuarter, liveQuarter } = useStore()
  const navigate = useNavigate()
  const isAdmin = currentUser?.role === 'admin'

  // "+ Add entry" is only valid when looking at the live quarter (matches
  // prototype behaviour). If you click it while viewing an archived quarter,
  // we flip back to live first then route to /add.
  const handleAddClick = (e: React.MouseEvent) => {
    if (!isViewingLive) {
      e.preventDefault()
      setSelectedQuarter(liveQuarter.id)
      navigate('/add')
    }
  }

  return (
    <nav className="bg-surface border-b border-line">
      <div className="flex px-4 sm:px-6 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                'text-base px-4 py-3 border-b-2 whitespace-nowrap transition font-sans',
                isActive
                  ? 'text-g-blue border-g-blue font-medium'
                  : 'text-ink-3 border-transparent hover:text-ink',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
        <NavLink
          to="/add"
          onClick={handleAddClick}
          title={isViewingLive ? '' : `Uploads only open for the live quarter (${liveQuarter.label})`}
          className={({ isActive }) =>
            cn(
              'text-base px-4 py-3 border-b-2 whitespace-nowrap transition font-sans',
              isActive
                ? 'text-g-blue border-g-blue font-medium'
                : 'text-ink-3 border-transparent hover:text-ink',
              !isViewingLive && 'opacity-50',
            )
          }
        >
          + Add entry
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'text-base px-4 py-3 border-b-2 whitespace-nowrap transition font-sans',
                isActive
                  ? 'text-g-blue border-g-blue font-medium'
                  : 'text-ink-3 border-transparent hover:text-ink',
              )
            }
          >
            Dashboard
          </NavLink>
        )}
      </div>
    </nav>
  )
}
