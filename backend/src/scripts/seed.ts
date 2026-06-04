/**
 * Base seed for a fresh launch.
 *
 *   npm run seed
 *
 * NON-destructive: pure upserts. It only ensures the essentials exist so a
 * brand-new deployment is usable:
 *   - one live quarter (Q2 '26)
 *   - the admin account (chopraabhishek@google.com)
 *
 * It does NOT create any demo posts, events, or fake teammates. Real teammates
 * join by signing in with Google; the admin approves them.
 *
 * To wipe an existing database back to this clean state (removing demo/old
 * content and users), use the destructive helper:  npm run reset:fresh
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LIVE_QUARTER = {
  id: 'q2-2026',
  label: "Q2 '26",
  startDate: new Date('2026-04-01'),
  endDate: new Date('2026-06-30'),
  status: 'live' as const,
}

const ADMIN = {
  id: 'u-abhishek',
  email: 'chopraabhishek@google.com',
  name: 'Abhishek Chopra',
  firstName: 'Abhishek',
  avatarInitials: 'AC',
  avatarColor: '#4285F4',
  office: 'IN',
  team: 'People Pillar',
  role: 'admin' as const,
  status: 'approved' as const,
  createdAt: new Date('2025-08-01'),
}

async function main() {
  console.log('[seed] ensuring live quarter…')
  await prisma.quarter.upsert({
    where: { id: LIVE_QUARTER.id },
    update: { status: 'live' },
    create: LIVE_QUARTER,
  })

  console.log('[seed] ensuring admin account…')
  await prisma.user.upsert({
    where: { id: ADMIN.id },
    // Don't clobber a real googleId if the admin has already signed in.
    update: { email: ADMIN.email, role: 'admin', status: 'approved' },
    create: { ...ADMIN, googleId: `seed:${ADMIN.id}` },
  })

  console.log('[seed] done — clean launch base (live quarter + admin).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
