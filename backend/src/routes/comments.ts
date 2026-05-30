import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'
import { recountEntry } from './entries'

const router = Router()

// Bulk: all comments across all entries — used by the frontend to populate
// the Activity Log and Mentions tabs in one shot.
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const comments = await prisma.comment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ comments })
})

const EditBody = z.object({ body: z.string().min(1).max(2000) })

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
  if (!comment) return res.status(404).json({ error: 'not_found' })
  if (comment.userId !== me.id) return res.status(403).json({ error: 'forbidden' })

  const parsed = EditBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'bad_input' })

  const updated = await prisma.comment.update({
    where: { id: req.params.id },
    data: { body: parsed.data.body },
  })
  res.json({ comment: updated })
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
  if (!comment) return res.status(404).json({ error: 'not_found' })
  if (comment.userId !== me.id && me.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' })
  }
  await prisma.comment.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  })
  await recountEntry(comment.entryId)
  res.json({ ok: true })
})

export default router
