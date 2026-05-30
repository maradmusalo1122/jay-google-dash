import { useNavigate } from 'react-router-dom'
import GoogleLogo from '@/components/GoogleLogo'
import UserAvatar from '@/components/ui/UserAvatar'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'
import NotificationBell from './NotificationBell'

export default function Topbar() {
  const { currentUser, signOut } = useAuth()
  const { quarters, selectedQuarterId, setSelectedQuarter } = useStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-line">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 flex-wrap">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2.5"
        >
          <GoogleLogo size={30} />
          <div className="text-left leading-tight">
            <div className="font-display text-base text-ink">NBS SAPAC Chronicle</div>
            <div className="text-[10px] text-ink-3">India &middot; Singapore &middot; Every moment</div>
          </div>
        </button>

        {/* Quarter pills */}
        <div className="flex gap-1.5 order-3 sm:order-2 w-full sm:w-auto overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          {quarters.map((q) => {
            const isActive = q.id === selectedQuarterId
            const isLive = q.status === 'live'
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedQuarter(q.id)}
                className={cn(
                  'text-xs px-3 py-1 rounded-pill border whitespace-nowrap font-medium transition',
                  isActive
                    ? 'bg-g-blue-l text-g-blue-d border-[#85B7EB]'
                    : 'bg-surface-soft text-ink-3 border-line-strong hover:border-g-blue hover:text-g-blue',
                )}
              >
                {q.label}
                {isLive && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-g-green ml-1.5 align-middle" />
                )}
              </button>
            )
          })}
        </div>

        {/* User chip + notifications */}
        {currentUser && (
          <div className="flex items-center gap-2 order-2 sm:order-3">
            <NotificationBell />
            <button
              type="button"
              onClick={() => navigate('/me')}
              className="flex items-center gap-2 pr-2.5 pl-1 py-1 rounded-pill border border-line hover:bg-surface-soft transition"
            >
              <UserAvatar user={currentUser} size="md" />
              <span className="text-xs text-ink-2 hidden sm:inline">
                {currentUser.firstName}
              </span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[11px] text-ink-3 underline hover:text-ink-2 hidden sm:inline"
            >
              sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
