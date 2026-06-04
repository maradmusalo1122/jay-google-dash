import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me'
const TTL = '30d'

export interface SessionPayload {
  uid: string  // user id
}

export function signSession(uid: string): string {
  return jwt.sign({ uid }, SECRET, { expiresIn: TTL })
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as SessionPayload
    if (typeof decoded?.uid !== 'string') return null
    return decoded
  } catch {
    return null
  }
}

export const COOKIE_NAME = 'sapac_session'

/** Cookie options matching the app's auth flow. */
export function cookieOptions(maxAgeDays = 30) {
  const isProd = process.env.NODE_ENV === 'production'
  // Explicit override so we can serve over plain HTTP (e.g. an IP-only
  // deployment with no TLS). A Secure cookie is never sent over HTTP, which
  // would silently break login. Set COOKIE_SECURE=false in that case.
  // When unset, fall back to the NODE_ENV default (Secure in production).
  const secure =
    process.env.COOKIE_SECURE != null ? process.env.COOKIE_SECURE === 'true' : isProd
  return {
    httpOnly: true,
    secure,
    // SameSite=None REQUIRES Secure. When the frontend and the /api proxy are
    // served from the same origin, 'lax' is correct and works over plain HTTP.
    sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/',
  }
}
