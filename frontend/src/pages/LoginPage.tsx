import { useNavigate } from 'react-router-dom'
import GoogleLogo from '@/components/GoogleLogo'
import GoogleWordmark from '@/components/GoogleWordmark'
import { useAuth } from '@/lib/auth'
import { clearAllPersisted } from '@/lib/persist'

/**
 * Login page — pixel-faithful to the prototype.
 *
 * Real Google OAuth (passport-google-oauth20 / GIS) lands in the next
 * milestone. For now the CTA signs in as the admin user so the full app —
 * including the admin Dashboard — is testable without backend.
 *
 * To test the pending-approval flow, use the dev "Preview pending screen"
 * link below the button.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSignIn = () => {
    signIn() // logs in as admin (Abhishek) by default
    navigate('/feed')
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[340px] bg-surface border border-line rounded-lg px-6 py-10 text-center">
        <div className="flex flex-col items-center mb-6">
          <GoogleLogo size={56} />
          <h1 className="font-display text-2xl mt-3">NBS SAPAC Chronicle</h1>
          <p className="text-xs text-ink-3 italic mt-1">A living record of who we are.</p>
        </div>

        <h2 className="font-display text-lg mb-1.5">Welcome back</h2>
        <p className="text-sm text-ink-3 leading-relaxed mb-5">
          Sign in with your Google NBS account to access the team memory vault.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-sm border border-line-strong bg-surface hover:bg-surface-soft transition text-md font-medium"
        >
          <GoogleWordmark />
          <span className="text-ink">Continue with Google</span>
        </button>

        <p className="text-xs text-ink-3 mt-3">
          @google.com accounts only &middot; NBS SAPAC team
        </p>

        {/* Dev affordances — visible only in test mode */}
        <div className="border-t border-line mt-5 pt-3 space-y-1.5">
          <p className="text-[10px] text-ink-3 uppercase tracking-wider">Dev shortcuts</p>
          <button
            type="button"
            onClick={() => { signIn('u-priya'); navigate('/feed') }}
            className="block w-full text-[11px] text-ink-2 hover:text-g-blue"
          >
            Log in as Priya (Member, no Dashboard)
          </button>
          <button
            type="button"
            onClick={() => { signIn('u-tina'); navigate('/feed') }}
            className="block w-full text-[11px] text-ink-2 hover:text-g-blue"
          >
            Log in as Tina (Member, SG office)
          </button>
          <button
            type="button"
            onClick={() => navigate('/pending')}
            className="block w-full text-[11px] text-ink-2 hover:text-g-blue"
          >
            Preview pending-approval page
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Wipe all local data and reload? This restores the demo seed.')) {
                clearAllPersisted()
                window.location.reload()
              }
            }}
            className="block w-full text-[11px] text-rose-600 hover:text-rose-700"
          >
            Reset all data (back to seed)
          </button>
        </div>
      </div>
    </div>
  )
}
