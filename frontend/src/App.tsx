import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { StoreProvider } from './lib/store'

import LoginPage from './pages/LoginPage'
import WaitingPage from './pages/WaitingPage'
import AppShell from './components/shell/AppShell'
import FeedPage from './pages/FeedPage'
import ExplorePage from './pages/ExplorePage'
import ArchivePage from './pages/ArchivePage'
import AddEntryPage from './pages/AddEntryPage'
import ProfilePage from './pages/ProfilePage'
import PublicEventPage from './pages/PublicEventPage'

import AdminLayout from './pages/admin/AdminLayout'
import AdminHomePage from './pages/admin/AdminHomePage'
import UserListPage from './pages/admin/UserListPage'
import ActivityLogPage from './pages/admin/ActivityLogPage'
import EditContentPage from './pages/admin/EditContentPage'
import ApproveRegistrationPage from './pages/admin/ApproveRegistrationPage'

export default function App() {
  return (
    // Auth wraps Store: Store fetches everything on sign-in, so it depends
    // on knowing who's signed in.
    <AuthProvider>
      <StoreProvider>
        <Routes>
          {/* Public — no shell, no auth */}
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pending" element={<WaitingPage />} />
          <Route path="/event/:slug" element={<PublicEventPage />} />

          {/* Authenticated app */}
          <Route element={<AppShell />}>
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/add" element={<AddEntryPage />} />
            <Route path="/me" element={<ProfilePage />} />
            <Route path="/u/:id" element={<ProfilePage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="users" element={<UserListPage />} />
              <Route path="activity" element={<ActivityLogPage />} />
              <Route path="content" element={<EditContentPage />} />
              <Route path="approve" element={<ApproveRegistrationPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </StoreProvider>
    </AuthProvider>
  )
}
