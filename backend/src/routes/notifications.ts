import { Router, type Request, type Response } from 'express'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'

const router = Router()

// Current user's notifications (newest first)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.currentUser!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json({ notifications })
})

router.post('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } })
  if (!n) return res.status(404).json({ error: 'not_found' })
  if (n.userId !== me.id) return res.status(403).json({ error: 'forbidden' })
  await prisma.notification.update({ where: { id: n.id }, data: { read: true } })
  res.json({ ok: true })
})

router.post('/read-all', requireAuth, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.currentUser!.id, read: false },
    data: { read: true },
  })
  res.json({ ok: true })
})

export default router
