import { Router, type Request, type Response } from 'express'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'

const router = Router()

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const quarters = await prisma.quarter.findMany({
    orderBy: { startDate: 'desc' },
  })
  res.json({ quarters })
})

export default router
