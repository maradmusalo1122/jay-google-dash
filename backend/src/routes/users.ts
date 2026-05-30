import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requireAuth } from '@/middleware/auth'

const router = Router()

// All users (any signed-in user can browse the team directory)
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
  res.json({ users })
})

// One user
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ error: 'not_found' })
  res.json({ user })
})

// Update self (or any user if admin)
const UpdateUserBody = z.object({
  name: z.string().min(1).max(120).optional(),
  firstName: z.string().min(1).max(60).optional(),
  avatarInitials: z.string().min(1).max(4).optional(),
  avatarColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  avatarPhoto: z.string().max(2_000_000).nullable().optional(),
  coverPhoto: z.string().max(2_000_000).nullable().optional(),
  office: z.enum(['IN', 'SG']).nullable().optional(),
  team: z.string().max(120).nullable().optional(),
})

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const isSelf = me.id === req.params.id
  if (!isSelf && me.role !== 'admin') return res.status(403).json({ error: 'forbidden' })

  const parsed = UpdateUserBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'bad_input', detail: parsed.error.flatten() })

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      avatarPhoto: parsed.data.avatarPhoto === null ? null : parsed.data.avatarPhoto ?? undefined,
      coverPhoto: parsed.data.coverPhoto === null ? null : parsed.data.coverPhoto ?? undefined,
      office: parsed.data.office === null ? null : parsed.data.office ?? undefined,
      team: parsed.data.team === null ? null : parsed.data.team ?? undefined,
    },
  })
  res.json({ user })
})

// Admin: change user status (approve / reject / disable)
const StatusBody = z.object({ status: z.enum(['pending', 'approved', 'disabled']) })

router.post('/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const parsed = StatusBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'bad_input' })
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  })
  res.json({ user })
})

export default router
