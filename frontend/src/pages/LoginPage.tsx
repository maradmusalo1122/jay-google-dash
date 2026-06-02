import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GoogleLogo from '@/components/GoogleLogo'
import GoogleWordmark from '@/components/GoogleWordmark'
import { useAuth } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'

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
 * Login page — pixel-faithful to the prototype.
 *
 * Two sign-in paths:
 *  - "Continue with Google" → real OAuth (redirects to /api/auth/google)
 *  - "Dev shortcuts" → POST /api/auth/dev-signin (only enabled while
 *    backend has ALLOW_DEV_SIGNIN=true)
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, startGoogleOAuth } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? (OAUTH_ERRORS[searchParams.get('error')!] ?? 'Sign-in failed. Please try again.') : null,
  )
  // A brand-new teammate who just signed in but is awaiting admin approval.
  const isPending = searchParams.get('pending') === '1'

  const handleSignIn = async (userId: string = 'u-abhishek') => {
    setBusy(true)
    setError(null)
    try {
      await signIn(userId)
      navigate('/feed')
    } catch (e) {
      if (e instanceof ApiError && e.status === 403 && e.code === 'dev_signin_disabled') {
        setError('Dev sign-in is disabled — use "Continue with Google".')
      } else if (e instanceof ApiError && e.status === 404) {
        setError('Demo user not found. Did the seed run?')
      } else {
        setError('Sign-in failed. Backend reachable?')
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

        {error && (
          <p className="text-xs text-rose-600 mt-3">{error}</p>
        )}

        {/* Dev affordances — only work while the backend allows dev sign-in */}
        <div className="border-t border-line mt-5 pt-3 space-y-1.5">
          <p className="text-[10px] text-ink-3 uppercase tracking-wider">Dev shortcuts</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSignIn('u-abhishek')}
            className="block w-full text-[11px] text-ink-2 hover:text-g-blue disabled:opacity-60"
          >
            Log in as Abhishek (Admin)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSignIn('u-priya')}
            className="block w-full text-[11px] text-ink-2 hover:text-g-blue disabled:opacity-60"
          >
            Log in as Priya (Member, no Dashboard)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSignIn('u-tina')}
            className="block w-full text-[11px] text-ink-2 hover:text-g-blue disabled:opacity-60"
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
        </div>

        {/* Backend status hint for testing */}
        <BackendHealth />
      </div>
    </div>
  )
}

function BackendHealth() {
  const [status, setStatus] = useState<'?' | 'ok' | 'down'>('?')
  useState(() => {
    api.get('/api/health').then(() => setStatus('ok')).catch(() => setStatus('down'))
  })
  if (status === '?') return null
  return (
    <p className={`text-[10px] mt-3 ${status === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
      backend: {status === 'ok' ? 'reachable' : 'unreachable'}
    </p>
  )
}
