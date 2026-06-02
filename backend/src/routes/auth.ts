import { Router, type Request, type Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { COOKIE_NAME, cookieOptions, signSession } from '@/lib/jwt'
import { requireAuth } from '@/middleware/auth'

const router = Router()

// Restrict sign-in to one Google Workspace domain. Set GOOGLE_HOSTED_DOMAIN=""
// (empty) to allow ANY Google account — handy for testing. `??` (not `||`) so an
// explicit empty string is respected instead of falling back to the default.
const HOSTED_DOMAIN = (process.env.GOOGLE_HOSTED_DOMAIN ?? 'google.com').trim()
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || ''
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173'
// APP_ORIGIN can be a comma-separated allowlist (used for CORS). OAuth redirects
// need ONE concrete URL, so take the first entry and strip any trailing slash.
const APP_URL = APP_ORIGIN.split(',')[0].trim().replace(/\/$/, '')
const ALLOW_DEV_SIGNIN = process.env.ALLOW_DEV_SIGNIN === 'true' || process.env.NODE_ENV !== 'production'

const googleClient =
  GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
    ? new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
    : null

/**
 * GET /api/auth/me — returns the current user (or null if not signed in).
 * Doesn't 401 on missing — clients use this to check session state.
 */
router.get('/me', (req: Request, res: Response) => {
  if (!req.currentUser) return res.json({ user: null })
  res.json({ user: req.currentUser })
})

/**
 * POST /api/auth/signout — clear the session cookie.
 */
router.post('/signout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

// ──────────────────────────────────────────────────────────────
//  DEV SIGN-IN (mock, for testing without Google OAuth set up)
//  Only available when NODE_ENV !== 'production' or ALLOW_DEV_SIGNIN=true
// ──────────────────────────────────────────────────────────────

const DevSignInBody = z.object({ userId: z.string() })

router.post('/dev-signin', async (req: Request, res: Response) => {
  if (!ALLOW_DEV_SIGNIN) {
    return res.status(403).json({ error: 'dev_signin_disabled' })
  }
  const parsed = DevSignInBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'bad_input' })

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
  if (!user) return res.status(404).json({ error: 'user_not_found' })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  })

  res.cookie(COOKIE_NAME, signSession(user.id), cookieOptions())
  res.json({ user })
})

// ──────────────────────────────────────────────────────────────
//  REAL GOOGLE OAUTH
// ──────────────────────────────────────────────────────────────

/**
 * GET /api/auth/google — kick off Google OAuth, redirect to Google.
 */
router.get('/google', (_req: Request, res: Response) => {
  if (!googleClient) return res.status(500).json({ error: 'google_oauth_not_configured' })
  const url = googleClient.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    // Only hint the domain to Google when we actually restrict to one.
    ...(HOSTED_DOMAIN ? { hd: HOSTED_DOMAIN } : {}),
    prompt: 'select_account',
  })
  res.redirect(url)
})

/**
 * GET /api/auth/google/callback — Google redirects here with ?code=
 * Exchange for tokens, verify the id_token's hosted-domain, upsert the user,
 * issue our session cookie, redirect back to the app.
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  if (!googleClient) return res.status(500).send('Google OAuth not configured')
  const code = req.query.code as string | undefined
  if (!code) return res.redirect(`${APP_URL}/login?error=missing_code`)

  try {
    const { tokens } = await googleClient.getToken(code)
    const idToken = tokens.id_token
    if (!idToken) return res.redirect(`${APP_URL}/login?error=no_id_token`)

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email || !payload.sub) {
      return res.redirect(`${APP_URL}/login?error=bad_payload`)
    }
    // Enforce the workspace domain only when one is configured.
    if (HOSTED_DOMAIN && payload.hd !== HOSTED_DOMAIN) {
      return res.redirect(`${APP_URL}/login?error=domain_mismatch`)
    }

    const email = payload.email.toLowerCase()
    const name = payload.name || email.split('@')[0]
    const firstName = (payload.given_name || name.split(' ')[0]).trim()
    const initials = name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    // Link the Google identity to a teammate BY EMAIL. This matters because:
    //   1. Existing members (incl. the seed admin) already have their email on
    //      file with a placeholder googleId. Matching by email links the real
    //      Google account and PRESERVES their role/status (so the admin stays an
    //      admin). Matching by googleId would instead hit the unique-email
    //      constraint and fail.
    //   2. Brand-new teammates (email not on file) are created as "pending" and
    //      wait for an admin to approve them.
    const existing = await prisma.user.findUnique({ where: { email } })
    let user
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: payload.sub,
          lastActiveAt: new Date(),
          avatarPhoto: existing.avatarPhoto ?? (payload.picture || undefined),
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          googleId: payload.sub,
          email,
          name,
          firstName,
          avatarInitials: initials,
          avatarColor: '#4285F4',
          avatarPhoto: payload.picture || undefined,
          role: 'member',
          status: 'pending',
          lastActiveAt: new Date(),
        },
      })
    }

    res.cookie(COOKIE_NAME, signSession(user.id), cookieOptions())
    // New, not-yet-approved teammates land on a friendly "pending" screen.
    const dest = user.status === 'pending' ? '/login?pending=1' : '/'
    res.redirect(`${APP_URL}${dest}`)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[auth] google callback error', e)
    res.redirect(`${APP_URL}/login?error=oauth_failed`)
  }
})

// Convenience for the frontend: list dev users so the login page can
// offer a quick-pick (only when dev signin is allowed).
router.get('/dev-users', requireDevSignin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { status: 'approved' },
    orderBy: { role: 'asc' },
    select: { id: true, name: true, firstName: true, email: true, role: true, avatarInitials: true, avatarColor: true },
  })
  res.json({ users })
})

function requireDevSignin(_req: Request, res: Response, next: () => void) {
  if (!ALLOW_DEV_SIGNIN) return res.status(403).json({ error: 'dev_signin_disabled' }) as unknown as void
  next()
}

// Silences unused warning for requireAuth (kept exported for future use).
void requireAuth

export default router
