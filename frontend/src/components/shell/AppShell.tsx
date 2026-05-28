import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import Topbar from './Topbar'
import NavRow from './NavRow'

/**
 * Layout for authenticated routes: Topbar + NavRow + scrollable content.
 * If unauthenticated, bounces to /login. If pending, bounces to /pending.
 */
export default function AppShell() {
  const { currentUser } = useAuth()

  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.status === 'pending') return <Navigate to="/pending" replace />

  return (
    <div className="min-h-full flex flex-col">
      <Topbar />
      <NavRow />
      <main className="flex-1 w-full">
        <div className="max-w-page mx-auto px-4 sm:px-6 py-5">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
