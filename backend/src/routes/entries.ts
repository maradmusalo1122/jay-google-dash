import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'
import { toDisplayTag, toPrismaTag } from '@/lib/tag'

const router = Router()

const DisplayTag = z.enum(['Team event', 'Learning', 'Team win', 'External', 'Life outside work', 'Just a vibe'])

const entryInclude = {
  photos: { orderBy: { order: 'asc' as const } },
  contributors: { select: { id: true } },
} as const

// List entries — optional ?quarterId=
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const quarterId = (req.query.quarterId as string | undefined) ?? undefined
  const entries = await prisma.entry.findMany({
    where: {
      deletedAt: null,
      ...(quarterId ? { quarterId } : {}),
    },
    include: entryInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ entries: entries.map(reshape) })
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const entry = await prisma.entry.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: entryInclude,
  })
  if (!entry) return res.status(404).json({ error: 'not_found' })
  res.json({ entry: reshape(entry) })
})

// Public — no auth required. Used by the /event/:slug landing page so
// LinkedIn (and the public web) can read it.
const publicRouter = Router()
publicRouter.get('/:slug', async (req: Request, res: Response) => {
  const entry = await prisma.entry.findFirst({
    where: { publicSlug: req.params.slug, type: 'upcoming_event', deletedAt: null },
    include: entryInclude,
  })
  if (!entry) return res.status(404).json({ error: 'not_found' })
  res.json({ entry: reshape(entry) })
})

const CreateEntryBody = z.object({
  type: z.enum(['post', 'upcoming_event']),
  title: z.string().min(1).max(200),
  caption: z.string().default(''),
  tag: DisplayTag,
  eventName: z.string().max(200).optional(),
  eventDate: z.string().datetime().optional(),
  venue: z.string().max(300).optional(),
  venueMapUrl: z.string().url().max(2000).optional(),
  publicSlug: z.string().max(120).optional(),
  contributorIds: z.array(z.string()).default([]),
  photos: z
    .array(
      z.object({
        kind: z.enum(['photo', 'video']).default('photo'),
        url: z.string().max(2_000_000),
        thumbUrl: z.string().max(2_000_000).optional(),
        label: z.string().max(120).optional(),
        order: z.number().int().nonnegative(),
        duration: z.number().int().nonnegative().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
      }),
    )
    .default([]),
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = CreateEntryBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'bad_input', detail: parsed.error.flatten() })
  }
  const body = parsed.data
  const me = req.currentUser!

  const liveQuarter = await prisma.quarter.findFirst({ where: { status: 'live' } })
  if (!liveQuarter) return res.status(400).json({ error: 'no_live_quarter' })

  // Always include the author in contributors
  const contribIds = Array.from(new Set([me.id, ...body.contributorIds]))

  const prismaTag = toPrismaTag(body.tag)
  if (!prismaTag) return res.status(400).json({ error: 'bad_tag' })

  const entry = await prisma.entry.create({
    data: {
      quarterId: liveQuarter.id,
      authorId: me.id,
      type: body.type,
      title: body.title,
      caption: body.caption,
      tag: prismaTag,
      eventName: body.eventName,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      venue: body.venue,
      venueMapUrl: body.venueMapUrl,
      publicSlug: body.publicSlug,
      contributors: { connect: contribIds.map((id) => ({ id })) },
      photos: body.photos.length
        ? {
            create: body.photos.map((p) => ({
              kind: p.kind,
              url: p.url,
              thumbUrl: p.thumbUrl,
              label: p.label,
              order: p.order,
              duration: p.duration,
              width: p.width,
              height: p.height,
            })),
          }
        : undefined,
    },
    include: entryInclude,
  })

  // Set heroPhotoId to first photo if any
  if (entry.photos.length > 0) {
    await prisma.entry.update({
      where: { id: entry.id },
      data: { heroPhotoId: entry.photos[0].id },
    })
  }

  const out = await prisma.entry.findUnique({ where: { id: entry.id }, include: entryInclude })
  res.status(201).json({ entry: reshape(out!) })
})

const UpdateEntryBody = z.object({
  title: z.string().min(1).max(200).optional(),
  caption: z.string().optional(),
  tag: DisplayTag.optional(),
})

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const existing = await prisma.entry.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'not_found' })
  if (existing.authorId !== me.id && me.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' })
  }
  const parsed = UpdateEntryBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'bad_input' })

  const data: { title?: string; caption?: string; tag?: ReturnType<typeof toPrismaTag> } = {}
  if (parsed.data.title !== undefined) data.title = parsed.data.title
  if (parsed.data.caption !== undefined) data.caption = parsed.data.caption
  if (parsed.data.tag !== undefined) {
    const pt = toPrismaTag(parsed.data.tag)
    if (!pt) return res.status(400).json({ error: 'bad_tag' })
    data.tag = pt
  }

  const entry = await prisma.entry.update({
    where: { id: req.params.id },
    data: data as { title?: string; caption?: string; tag?: NonNullable<ReturnType<typeof toPrismaTag>> },
    include: entryInclude,
  })
  res.json({ entry: reshape(entry) })
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const existing = await prisma.entry.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'not_found' })
  if (existing.authorId !== me.id && me.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' })
  }
  await prisma.entry.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  })
  res.json({ ok: true })
})

// ─── Reactions on an entry ────────────────────────────────────
const ReactionBody = z.object({ type: z.enum(['like', 'going', 'interested']) })

router.post('/:id/reactions', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const parsed = ReactionBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'bad_input' })
  const { type } = parsed.data
  const entryId = req.params.id

  const existing = await prisma.reaction.findUnique({
    where: { entryId_userId_type: { entryId, userId: me.id, type } },
  })

  if (existing) {
    // toggle off
    await prisma.reaction.delete({
      where: { entryId_userId_type: { entryId, userId: me.id, type } },
    })
  } else {
    // RSVPs are mutually exclusive (going XOR interested)
    if (type === 'going' || type === 'interested') {
      await prisma.reaction.deleteMany({
        where: { entryId, userId: me.id, type: { in: ['going', 'interested'] } },
      })
    }
    await prisma.reaction.create({ data: { entryId, userId: me.id, type } })
  }

  await recountEntry(entryId)
  const reactions = await prisma.reaction.findMany({ where: { entryId } })
  res.json({ reactions, removed: !!existing })
})

router.get('/:id/reactions', requireAuth, async (req: Request, res: Response) => {
  const reactions = await prisma.reaction.findMany({ where: { entryId: req.params.id } })
  res.json({ reactions })
})

// ─── Comments on an entry ─────────────────────────────────────
const CommentBody = z.object({ body: z.string().min(1).max(2000) })

router.get('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  const comments = await prisma.comment.findMany({
    where: { entryId: req.params.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ comments })
})

router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  const me = req.currentUser!
  const parsed = CommentBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'bad_input' })

  const comment = await prisma.comment.create({
    data: { entryId: req.params.id, userId: me.id, body: parsed.data.body },
  })

  await recountEntry(req.params.id)

  // Create notifications for @-mentioned users
  // (Mention parsing logic — extract <@id> and @firstname patterns)
  const mentionRe = /<@([\w-]+)>|(^|\s)@([A-Za-z][\w-]*)/g
  const mentionedIds = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = mentionRe.exec(parsed.data.body)) !== null) {
    if (m[1]) {
      mentionedIds.add(m[1])
    } else if (m[3]) {
      const user = await prisma.user.findFirst({
        where: { firstName: { equals: m[3], mode: 'insensitive' }, status: 'approved' },
      })
      if (user) mentionedIds.add(user.id)
    }
  }
  mentionedIds.delete(me.id)
  if (mentionedIds.size > 0) {
    const excerpt = parsed.data.body.length > 120 ? parsed.data.body.slice(0, 117) + '…' : parsed.data.body
    await prisma.notification.createMany({
      data: Array.from(mentionedIds).map((uid) => ({
        userId: uid,
        type: 'mention_comment' as const,
        actorId: me.id,
        entryId: req.params.id,
        commentId: comment.id,
        excerpt,
      })),
    })
  }

  res.status(201).json({ comment })
})

// ─── Helpers ──────────────────────────────────────────────────

async function recountEntry(entryId: string) {
  const [likes, going, interested, comments] = await Promise.all([
    prisma.reaction.count({ where: { entryId, type: 'like' } }),
    prisma.reaction.count({ where: { entryId, type: 'going' } }),
    prisma.reaction.count({ where: { entryId, type: 'interested' } }),
    prisma.comment.count({ where: { entryId, deletedAt: null } }),
  ])
  await prisma.entry.update({
    where: { id: entryId },
    data: { likeCount: likes, goingCount: going, interestedCount: interested, commentCount: comments },
  })
}

// Reshape DB shape into the JSON the frontend already expects:
// - flatten contributors[]{id} → contributorIds[]
// - map Prisma enum tag (team_event) → display tag ("Team event")
function reshape(e: any) {
  const { contributors, tag, ...rest } = e as { contributors?: Array<{ id: string }>; tag: import('@prisma/client').Tag } & Record<string, unknown>
  return {
    ...rest,
    tag: toDisplayTag(tag),
    contributorIds: contributors?.map((c) => c.id) ?? [],
  }
}

export { publicRouter, recountEntry }
export default router
