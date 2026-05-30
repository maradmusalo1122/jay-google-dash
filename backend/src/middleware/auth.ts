import type { NextFunction, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'
import { COOKIE_NAME, verifySession } from '@/lib/jwt'
import type { User } from '@prisma/client'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: User
    }
  }
}

/**
 * If a valid session cookie is present, look up the user and attach to req.
 * Does NOT block when missing — that's `requireAuth`'s job.
 */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return next()
  const payload = verifySession(token)
  if (!payload) return next()
  const user = await prisma.user.findUnique({ where: { id: payload.uid } })
  if (user) req.currentUser = user
  next()
}

/** Require any authenticated, approved user. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const u = req.currentUser
  if (!u) return res.status(401).json({ error: 'not_authenticated' })
  if (u.status === 'pending') return res.status(403).json({ error: 'pending_approval' })
  if (u.status === 'disabled') return res.status(403).json({ error: 'disabled' })
  next()
}

/** Require an admin. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const u = req.currentUser
  if (!u) return res.status(401).json({ error: 'not_authenticated' })
  if (u.role !== 'admin') return res.status(403).json({ error: 'admin_only' })
  next()
}
