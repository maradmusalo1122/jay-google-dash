import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GoogleLogo from '@/components/GoogleLogo'
import GoogleWordmark from '@/components/GoogleWordmark'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

// Friendly text for the ?error= codes the Google OAuth callback can redirect with.
const OAUTH_ERRORS: Record<string, string> = {
  domain_mismatch: 'Please sign in with your @google.com work account.',
  oauth_failed: 'Google sign-in did not complete. Please try again.',
  missing_code: 'Google sign-in was cancelled. Please try again.',
  no_id_token: 'Google did not return your identity. Please try again.',
  bad_payload: 'Google did not share an email for this account.',
  google_oauth_not_configured: 'Google sign-in is not set up yet on the server.',
}

/**
 * Login page.
 *  - "Continue with Google" → real OAuth (restricted to @google.com)
 *  - Dev shortcut → POST /api/auth/dev-signin (only works while the backend
 *    has ALLOW_DEV_SIGNIN=true)
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, startGoogleOAuth } = useAuth()
  const [busy, setBusy] = useState(false)

  const errCode = searchParams.get('error')
  const [error, setError] = useState<string | null>(
    errCode ? OAUTH_ERRORS[errCode] ?? 'Sign-in failed. Please try again.' : null,
  )
  // A brand-new teammate who just signed in but is awaiting admin approval.
  const isPending = searchParams.get('pending') === '1'

  const handleDevSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn('u-abhishek')
      navigate('/feed')
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError('Dev sign-in is disabled on the server.')
      } else if (e instanceof ApiError && e.status === 404) {
        setError('Admin account not found.')
      } else {
        setError('Sign-in failed. Is the backend reachable?')
      }
    } finally {
      setBusy(false)
    }
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

        {isPending && (
          <div className="mb-4 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-left">
            <p className="text-xs font-medium text-amber-900">You&rsquo;re almost in</p>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Your Google account was verified. An admin needs to approve you before you can see the Chronicle. You&rsquo;ll get access as soon as they do.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={startGoogleOAuth}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-sm border border-line-strong bg-surface hover:bg-surface-soft transition text-md font-medium disabled:opacity-60"
        >
          <GoogleWordmark />
          <span className="text-ink">Continue with Google</span>
        </button>

        <p className="text-xs text-ink-3 mt-3">
          @google.com accounts only &middot; NBS SAPAC team
        </p>

        {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}

        {/* Dev shortcut — only works while the backend allows dev sign-in */}
        <div className="border-t border-line mt-5 pt-3 space-y-1.5">
          <p className="text-[10px] text-ink-3 uppercase tracking-wider">Dev shortcuts</p>
          <button
            type="button"
            disabled={busy}
            onClick={handleDevSignIn}
            className="block w-full text-[11px] text-ink-2 hover:text-g-blue disabled:opacity-60"
          >
            Log in as Abhishek (Admin)
          </button>
        </div>
      </div>
    </div>
  )
}
