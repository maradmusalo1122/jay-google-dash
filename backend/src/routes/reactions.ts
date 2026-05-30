import { Router, type Request, type Response } from 'express'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'

const router = Router()

// Bulk: all reactions across all entries. Same reason as bulk comments —
// the frontend needs them to render the Going/Interested rows + Activity log.
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const reactions = await prisma.reaction.findMany()
  res.json({ reactions })
})

export default router
