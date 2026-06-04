import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import Topbar from './Topbar'
import NavRow from './NavRow'

/**
 * Layout for authenticated routes: Topbar + NavRow + scrollable content.
 * Waits for the async session check to settle before deciding to bounce.
 */
export default function AppShell() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center text-ink-3 text-sm">
        Loading…
      </div>
    )
  }
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.status === 'pending') return <Navigate to="/pending" replace />

  return (
    <div className="min-h-full flex flex-col">
      {/* Topbar + tabs stay pinned together so navigation is always reachable,
          however far the user has scrolled. Wrapping both keeps the tabs
          directly under the logo bar even when the Topbar wraps on mobile. */}
      <div className="sticky top-0 z-50 shadow-sm">
        <Topbar />
        <NavRow />
      </div>
      <main className="flex-1 w-full">
        <div className="max-w-page mx-auto px-4 sm:px-6 py-5">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
