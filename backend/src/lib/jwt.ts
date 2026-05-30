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
  return {
    httpOnly: true,
    secure: isProd,           // HTTPS-only in prod
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',  // cross-site needs 'none' when frontend on Vercel + backend on Render
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/',
  }
}
