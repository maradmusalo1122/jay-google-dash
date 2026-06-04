/**
 * Reset the database to a freshly-launched state.
 *
 *   npm run reset:fresh
 *
 * DESTRUCTIVE. It wipes all content (posts, events, photos, comments,
 * reactions, notifications, activity) and every user EXCEPT the admin, and
 * keeps only the current live quarter. Use this once when moving from demo /
 * seed data to a clean launch. After this, the platform is empty: the admin
 * signs in and approves real teammates as they join via Google.
 *
 * What it KEEPS / guarantees:
 *   - the admin account (chopraabhishek@google.com), role admin, approved
 *   - one live quarter (Q2 '26) so people can post immediately
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'chopraabhishek@google.com'
const LIVE_QUARTER_ID = 'q2-2026'

async function main() {
  console.log('[reset] clearing reactions, comments, notifications, activity…')
  await prisma.reaction.deleteMany({})
  await prisma.comment.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.activityLog.deleteMany({})

  console.log('[reset] deleting all entries (cascades to photos)…')
  await prisma.entry.deleteMany({})
  await prisma.photo.deleteMany({}) // belt-and-suspenders for any orphans

  console.log('[reset] removing all users except the admin…')
  await prisma.user.deleteMany({ where: { email: { not: ADMIN_EMAIL } } })

  console.log('[reset] keeping only the live quarter…')
  await prisma.quarter.deleteMany({ where: { id: { not: LIVE_QUARTER_ID } } })

  // Guarantee the admin + live quarter exist (in case this runs on a blank DB).
  await prisma.quarter.upsert({
    where: { id: LIVE_QUARTER_ID },
    update: { status: 'live' },
    create: {
      id: LIVE_QUARTER_ID,
      label: "Q2 '26",
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      status: 'live',
    },
  })
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'admin', status: 'approved' },
    create: {
      id: 'u-abhishek',
      googleId: 'seed:u-abhishek',
      email: ADMIN_EMAIL,
      name: 'Abhishek Chopra',
      firstName: 'Abhishek',
      avatarInitials: 'AC',
      avatarColor: '#4285F4',
      office: 'IN',
      team: 'People Pillar',
      role: 'admin',
      status: 'approved',
      createdAt: new Date('2025-08-01'),
    },
  })

  const [users, entries, quarters] = await Promise.all([
    prisma.user.count(),
    prisma.entry.count(),
    prisma.quarter.count(),
  ])
  console.log(`[reset] done. users=${users} entries=${entries} quarters=${quarters}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
