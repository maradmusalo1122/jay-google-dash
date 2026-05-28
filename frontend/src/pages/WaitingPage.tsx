import { useNavigate } from 'react-router-dom'
import GoogleLogo from '@/components/GoogleLogo'

/**
 * Waiting page — shown when a user has signed in via Google but an admin
 * has not yet approved their account (user.status === 'pending').
 *
 * On theme with the Login page: same card style, same brand mark.
 */
export default function WaitingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[380px] bg-surface border border-line rounded-lg px-6 py-10 text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <GoogleLogo size={56} />
            {/* Pending dot: a small yellow status mark over the brand */}
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-g-yellow border-2 border-surface"
              aria-hidden
            />
          </div>
          <h1 className="font-display text-2xl mt-3">Almost in</h1>
          <p className="text-xs text-ink-3 italic mt-1">Your access is being reviewed.</p>
        </div>

        <p className="text-sm text-ink-3 leading-relaxed mb-5">
          An admin will approve your account shortly. You'll get access as soon
          as that happens — no need to refresh or sign in again.
        </p>

        <div className="rounded-sm bg-surface-soft border border-line px-4 py-3 text-left mb-5">
          <p className="text-xs font-medium text-ink-2 mb-1">What happens next</p>
          <ul className="text-xs text-ink-3 space-y-1 list-disc list-inside marker:text-ink-3">
            <li>An admin reviews your sign-in</li>
            <li>You'll be redirected here automatically once approved</li>
            <li>You can then complete your profile (office, team)</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-xs text-ink-3 underline hover:text-ink-2"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
