/**
 * Idempotent seed for Neon. Run once after `prisma migrate deploy`.
 *
 *   npm run seed     (calls `tsx src/scripts/seed.ts`)
 *
 * Safe to run multiple times — uses upsert on stable IDs.
 */
import 'dotenv/config'
import { PrismaClient, type Tag as TagType } from '@prisma/client'

const prisma = new PrismaClient()

// Quarters
const QUARTERS = [
  { id: 'q4-2025', label: "Q4 '25", startDate: new Date('2025-10-01'), endDate: new Date('2025-12-31'), status: 'archived' as const },
  { id: 'q1-2026', label: "Q1 '26", startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31'), status: 'archived' as const },
  { id: 'q2-2026', label: "Q2 '26", startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30'), status: 'live' as const },
]

// Users
const USERS = [
  { id: 'u-abhishek', email: 'abhishek@google.com', name: 'Abhishek Chopra', firstName: 'Abhishek', avatarInitials: 'AC', avatarColor: '#4285F4', office: 'IN', team: 'People Pillar', role: 'admin' as const, status: 'approved' as const, createdAt: new Date('2025-08-01') },
  { id: 'u-priya', email: 'priyasharma@google.com', name: 'Priya Sharma', firstName: 'Priya', avatarInitials: 'PS', avatarColor: '#EA4335', office: 'IN', team: 'DFO Network', role: 'member' as const, status: 'approved' as const, createdAt: new Date('2025-08-12') },
  { id: 'u-nikhil', email: 'nikhilsingh@google.com', name: 'Nikhil Singh', firstName: 'Nikhil', avatarInitials: 'NS', avatarColor: '#34A853', office: 'IN', team: 'Affiliate Partnerships', role: 'member' as const, status: 'approved' as const, createdAt: new Date('2025-09-01') },
  { id: 'u-ramneek', email: 'ramneekk@google.com', name: 'Ramneek Kaur', firstName: 'Ramneek', avatarInitials: 'RK', avatarColor: '#FBBC05', office: 'IN', team: 'Affiliate Partnerships', role: 'member' as const, status: 'approved' as const, createdAt: new Date('2025-09-15') },
  { id: 'u-jasmine', email: 'jasminewang@google.com', name: 'Jasmine Wang', firstName: 'Jasmine', avatarInitials: 'JW', avatarColor: '#185FA5', office: 'SG', team: 'DFO Network', role: 'member' as const, status: 'approved' as const, createdAt: new Date('2025-10-01') },
  { id: 'u-aditya', email: 'adityaseth@google.com', name: 'Aditya Seth', firstName: 'Aditya', avatarInitials: 'AS', avatarColor: '#534AB7', office: 'IN', team: 'DFO Network', role: 'member' as const, status: 'approved' as const, createdAt: new Date('2025-10-15') },
  { id: 'u-tina', email: 'tinayao@google.com', name: 'Tina Yao', firstName: 'Tina', avatarInitials: 'TY', avatarColor: '#0A6B50', office: 'SG', team: 'DFO Network', role: 'member' as const, status: 'approved' as const, createdAt: new Date('2025-11-01') },
  { id: 'u-gunjeeta', email: 'gunjeetar@google.com', name: 'Gunjeeta Reddy', firstName: 'Gunjeeta', avatarInitials: 'GR', avatarColor: '#D4537E', office: 'IN', team: 'Affiliate Partnerships', role: 'member' as const, status: 'approved' as const, createdAt: new Date('2025-11-15') },
  { id: 'u-sneha', email: 'snehapatil@google.com', name: 'Sneha Patil', firstName: 'Sneha', avatarInitials: 'SP', avatarColor: '#EF9F27', role: 'member' as const, status: 'pending' as const, createdAt: new Date('2026-05-26') },
  { id: 'u-vikram', email: 'vikramj@google.com', name: 'Vikram Joshi', firstName: 'Vikram', avatarInitials: 'VJ', avatarColor: '#7F77DD', role: 'member' as const, status: 'pending' as const, createdAt: new Date('2026-05-27') },
]

function pic(seed: string, w = 1200, h = 800) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}
function pics(base: string, n: number, labels: string[] = []) {
  return Array.from({ length: n }, (_, i) => ({
    url: pic(`${base}-${i}`),
    thumbUrl: pic(`${base}-${i}`, 480, 360),
    label: labels[i],
    order: i,
  }))
}

const ENTRIES: Array<{
  id: string
  quarterId: string
  authorId: string
  type: 'post' | 'upcoming_event'
  title: string
  caption: string
  tag: TagType
  eventName?: string
  eventDate?: Date
  venue?: string
  venueMapUrl?: string
  publicSlug?: string
  contributorIds: string[]
  photos: Array<{ url: string; thumbUrl?: string; label?: string; order: number }>
  createdAt: Date
}> = [
  // ── Q2 2026 — upcoming events ──
  {
    id: 'e-mumbai-mixer', quarterId: 'q2-2026', authorId: 'u-ramneek', type: 'upcoming_event',
    title: 'Affiliate Partnership Mixer — Mumbai',
    caption: 'Our Mumbai Affiliate Partnership Mixer is back. An evening with new publishers in the city — drinks, dinner, and conversations about what NBS can help with this quarter. RSVP if you can make it.',
    tag: 'team_event', eventDate: new Date('2026-06-12T18:30:00Z'),
    venue: 'Sofitel Mumbai BKC, Bandra-Kurla Complex',
    venueMapUrl: 'https://maps.google.com/?q=Sofitel+Mumbai+BKC',
    publicSlug: 'affiliate-mixer-mumbai-jun-2026',
    photos: pics('mumbai-mixer-hero', 1, ['Sofitel Mumbai BKC']),
    contributorIds: ['u-ramneek'], createdAt: new Date('2026-05-26T12:00:00Z'),
  },
  {
    id: 'e-sg-dinner', quarterId: 'q2-2026', authorId: 'u-jasmine', type: 'upcoming_event',
    title: 'SEA Networking Dinner — Singapore',
    caption: 'A casual dinner for SEA team and our new SG publishers. Quick intros, a couple of NBS product walkthroughs, and a proper meal. Bringing the India-SG split closer one dinner at a time.',
    tag: 'external', eventDate: new Date('2026-06-25T19:00:00Z'),
    venue: 'Burnt Ends, 7 Dempsey Road, Singapore',
    venueMapUrl: 'https://maps.google.com/?q=Burnt+Ends+Singapore+Dempsey',
    publicSlug: 'sea-networking-dinner-jun-2026',
    photos: pics('sg-dinner-hero', 1, ['Burnt Ends']),
    contributorIds: ['u-jasmine'], createdAt: new Date('2026-05-24T08:00:00Z'),
  },

  // ── Q2 2026 — posts ──
  {
    id: 'e-surat-mixer', quarterId: 'q2-2026', authorId: 'u-nikhil', type: 'post',
    title: 'Google Affiliate Partnership Mixer — Surat',
    caption: 'Surat showed up. 40+ new publishers, deep conversations about content monetisation, and three product demos that landed exactly right. Big thanks to the local team for the warm welcome.',
    tag: 'team_event', eventName: 'Affiliate Partnership Mixer', eventDate: new Date('2026-05-22T18:00:00Z'),
    photos: pics('surat-mixer', 5, ['Welcome desk', 'Opening keynote', 'Group photo', 'Q&A session', 'Dinner']),
    contributorIds: ['u-nikhil', 'u-priya', 'u-ramneek'], createdAt: new Date('2026-05-23T11:00:00Z'),
  },
  {
    id: 'e-social-beat', quarterId: 'q2-2026', authorId: 'u-ramneek', type: 'post',
    title: 'Social Beat Summit — Ramneek on Stage',
    caption: 'Ramneek led the panel on affiliate growth for SMBs. The audience asked the smart questions, and the after-panel queue lasted longer than the panel itself. Proud moment for the team.',
    tag: 'team_win', eventName: 'Social Beat Marketing Summit', eventDate: new Date('2026-04-18T14:00:00Z'),
    photos: pics('social-beat', 3, ['On stage', 'Panel discussion', 'After-panel network']),
    contributorIds: ['u-ramneek', 'u-priya'], createdAt: new Date('2026-04-19T09:00:00Z'),
  },
  {
    id: 'e-niketa-wedding', quarterId: 'q2-2026', authorId: 'u-jasmine', type: 'post',
    title: "Niketa's Wedding 🎉",
    caption: "Half the team flew in for Niketa's wedding. Three days of celebration, sangeet that ran past midnight, and a baraat that the hotel will remember. Wishing her and Karan the best.",
    tag: 'life_outside', eventName: 'Team milestone', eventDate: new Date('2026-04-08T17:00:00Z'),
    photos: pics('niketa-wedding', 4, ['The couple', 'Sangeet night', 'NBS table', 'After the ceremony']),
    contributorIds: ['u-jasmine', 'u-tina', 'u-abhishek'], createdAt: new Date('2026-04-10T20:00:00Z'),
  },

  // ── Q1 2026 (archived) ──
  {
    id: 'e-engage-dinner', quarterId: 'q1-2026', authorId: 'u-abhishek', type: 'post',
    title: 'ENGAGE 2026 — Team Dinner',
    caption: 'ENGAGE 2026, Macau. The India and Singapore teams around one table — strategy sessions by day, laughter by night. This is what the NBS SAPAC family looks like.',
    tag: 'team_event', eventName: 'ENGAGE 2026', eventDate: new Date('2026-03-06T19:00:00Z'),
    photos: pics('engage-dinner', 4, ['The whole SAPAC family', 'Toast', 'India + SG together', 'Late night']),
    contributorIds: ['u-abhishek', 'u-jasmine', 'u-priya', 'u-nikhil'], createdAt: new Date('2026-03-07T08:00:00Z'),
  },
  {
    id: 'e-engage-banner', quarterId: 'q1-2026', authorId: 'u-priya', type: 'post',
    title: 'ENGAGE 2026 — The Banner Shot',
    caption: 'Macau called. We answered. All of us. ENGAGE 2026 wrapped with this shot — the NBS SAPAC banner held high by two countries, one team.',
    tag: 'team_event', eventName: 'ENGAGE 2026', eventDate: new Date('2026-03-07T12:00:00Z'),
    photos: pics('engage-banner', 2, ['The banner', 'Behind the scenes']),
    contributorIds: ['u-priya', 'u-jasmine', 'u-abhishek'], createdAt: new Date('2026-03-08T10:00:00Z'),
  },
  {
    id: 'e-adtech-conf', quarterId: 'q1-2026', authorId: 'u-aditya', type: 'post',
    title: 'AdTech Marketing Conference',
    caption: 'Two days of AdTech, three NBS sessions, one big takeaway: the industry is hungry for stronger publisher tooling. Plenty of homework brought back to the team.',
    tag: 'external', eventName: 'AdTech Marketing Conference', eventDate: new Date('2026-03-21T09:00:00Z'),
    photos: pics('adtech', 3, ['NBS booth', 'Conference floor', 'Day 2 closing']),
    contributorIds: ['u-aditya', 'u-tina'], createdAt: new Date('2026-03-22T15:00:00Z'),
  },

  // ── Q4 2025 (archived) ──
  {
    id: 'e-webinar', quarterId: 'q4-2025', authorId: 'u-jasmine', type: 'post',
    title: 'Affiliate Ecomm Growth Playbook Webinar',
    caption: 'Jasmine, Aditya and Tina took the stage with DFO Network — breaking down the Affiliate Ecomm Growth Playbook for the shopping season. Recording is on the drive.',
    tag: 'team_win', eventName: 'DFO Network', eventDate: new Date('2025-11-14T15:00:00Z'),
    photos: pics('webinar', 2, ['On the webinar', 'The team after']),
    contributorIds: ['u-jasmine', 'u-aditya', 'u-tina'], createdAt: new Date('2025-11-15T09:00:00Z'),
  },
  {
    id: 'e-berkeley', quarterId: 'q4-2025', authorId: 'u-gunjeeta', type: 'post',
    title: 'UC Berkeley — Google Business Leadership Program',
    caption: 'Nikhil, Gunjeeta and teammates graduating from the Google Business Leadership Program at UC Berkeley. Certificates in hand, energy through the roof.',
    tag: 'learning', eventName: 'UC Berkeley', eventDate: new Date('2025-11-22T17:00:00Z'),
    photos: pics('berkeley', 3, ['Graduation day', 'NBS cohort', 'Campus tour']),
    contributorIds: ['u-nikhil', 'u-gunjeeta'], createdAt: new Date('2025-11-23T07:00:00Z'),
  },
]

// Comments — body uses <@id> mention tokens (rename-safe)
const COMMENTS = [
  { id: 'c-1', entryId: 'e-surat-mixer', userId: 'u-priya', body: 'The energy was unreal. Will copy this format for the next one.', createdAt: new Date('2026-05-23T13:00:00Z') },
  { id: 'c-2', entryId: 'e-surat-mixer', userId: 'u-abhishek', body: 'Great work team. Notes from the demos pls?', createdAt: new Date('2026-05-23T15:30:00Z') },
  { id: 'c-3', entryId: 'e-surat-mixer', userId: 'u-jasmine', body: 'SG team wants in for the next one 🙋‍♀️', createdAt: new Date('2026-05-24T03:00:00Z') },
  { id: 'c-4', entryId: 'e-niketa-wedding', userId: 'u-abhishek', body: 'Wishing them both the best ❤️', createdAt: new Date('2026-04-10T20:30:00Z') },
  { id: 'c-5', entryId: 'e-niketa-wedding', userId: 'u-priya', body: 'That sangeet 🔥🔥🔥', createdAt: new Date('2026-04-11T06:00:00Z') },
  { id: 'c-6', entryId: 'e-mumbai-mixer', userId: 'u-priya', body: 'Coming in from Bengaluru — anyone wants to share a cab from the hotel?', createdAt: new Date('2026-05-26T13:00:00Z') },
  { id: 'c-7', entryId: 'e-mumbai-mixer', userId: 'u-aditya', body: 'Yes! Will DM you.', createdAt: new Date('2026-05-26T14:15:00Z') },
  { id: 'c-8', entryId: 'e-mumbai-mixer', userId: 'u-abhishek', body: 'Sofitel is great. Looking forward to it!', createdAt: new Date('2026-05-27T07:00:00Z') },
  { id: 'c-9', entryId: 'e-sg-dinner', userId: 'u-tina', body: 'Burnt Ends 👀 great pick', createdAt: new Date('2026-05-24T10:00:00Z') },
  { id: 'c-10', entryId: 'e-sg-dinner', userId: 'u-nikhil', body: 'Flying in for this. Will land afternoon of the 25th.', createdAt: new Date('2026-05-25T08:00:00Z') },
  { id: 'c-11', entryId: 'e-engage-dinner', userId: 'u-tina', body: 'Best three days of the year. Already counting down to ENGAGE 2027.', createdAt: new Date('2026-03-08T11:00:00Z') },
  { id: 'c-12', entryId: 'e-engage-banner', userId: 'u-nikhil', body: 'Frame this one.', createdAt: new Date('2026-03-08T12:00:00Z') },
]

function likes(entryId: string, userIds: string[], baseTime: Date) {
  return userIds.map((uid, i) => ({
    entryId, userId: uid, type: 'like' as const,
    createdAt: new Date(baseTime.getTime() + i * 60_000),
  }))
}

const REACTIONS = [
  // Mumbai mixer RSVPs
  { entryId: 'e-mumbai-mixer', userId: 'u-priya', type: 'going' as const, createdAt: new Date('2026-05-26T13:00:00Z') },
  { entryId: 'e-mumbai-mixer', userId: 'u-aditya', type: 'going' as const, createdAt: new Date('2026-05-26T14:00:00Z') },
  { entryId: 'e-mumbai-mixer', userId: 'u-abhishek', type: 'going' as const, createdAt: new Date('2026-05-27T07:00:00Z') },
  { entryId: 'e-mumbai-mixer', userId: 'u-nikhil', type: 'going' as const, createdAt: new Date('2026-05-26T15:30:00Z') },
  { entryId: 'e-mumbai-mixer', userId: 'u-gunjeeta', type: 'going' as const, createdAt: new Date('2026-05-26T16:45:00Z') },
  { entryId: 'e-mumbai-mixer', userId: 'u-ramneek', type: 'going' as const, createdAt: new Date('2026-05-26T12:30:00Z') },
  { entryId: 'e-mumbai-mixer', userId: 'u-tina', type: 'interested' as const, createdAt: new Date('2026-05-26T15:00:00Z') },
  { entryId: 'e-mumbai-mixer', userId: 'u-jasmine', type: 'interested' as const, createdAt: new Date('2026-05-26T17:00:00Z') },

  // SG dinner RSVPs
  { entryId: 'e-sg-dinner', userId: 'u-nikhil', type: 'going' as const, createdAt: new Date('2026-05-25T08:00:00Z') },
  { entryId: 'e-sg-dinner', userId: 'u-tina', type: 'going' as const, createdAt: new Date('2026-05-24T10:00:00Z') },
  { entryId: 'e-sg-dinner', userId: 'u-jasmine', type: 'going' as const, createdAt: new Date('2026-05-24T11:00:00Z') },
  { entryId: 'e-sg-dinner', userId: 'u-aditya', type: 'going' as const, createdAt: new Date('2026-05-25T09:00:00Z') },
  { entryId: 'e-sg-dinner', userId: 'u-abhishek', type: 'interested' as const, createdAt: new Date('2026-05-26T11:00:00Z') },
  { entryId: 'e-sg-dinner', userId: 'u-priya', type: 'interested' as const, createdAt: new Date('2026-05-26T12:00:00Z') },
  { entryId: 'e-sg-dinner', userId: 'u-ramneek', type: 'interested' as const, createdAt: new Date('2026-05-26T13:00:00Z') },

  // Likes
  ...likes('e-surat-mixer', ['u-abhishek', 'u-jasmine', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-ramneek'], new Date('2026-05-23T12:00:00Z')),
  ...likes('e-social-beat', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-nikhil', 'u-gunjeeta'], new Date('2026-04-19T11:00:00Z')),
  ...likes('e-niketa-wedding', ['u-abhishek', 'u-priya', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-nikhil', 'u-ramneek'], new Date('2026-04-10T21:00:00Z')),
  ...likes('e-engage-dinner', ['u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-ramneek', 'u-nikhil'], new Date('2026-03-07T10:00:00Z')),
  ...likes('e-engage-banner', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-nikhil', 'u-ramneek'], new Date('2026-03-08T11:00:00Z')),
  ...likes('e-adtech-conf', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-ramneek'], new Date('2026-03-22T16:00:00Z')),
  ...likes('e-webinar', ['u-abhishek', 'u-priya', 'u-tina', 'u-aditya', 'u-nikhil'], new Date('2025-11-15T10:00:00Z')),
  ...likes('e-berkeley', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-ramneek'], new Date('2025-11-23T08:00:00Z')),
]

async function main() {
  console.log('[seed] quarters…')
  for (const q of QUARTERS) {
    await prisma.quarter.upsert({ where: { id: q.id }, update: q, create: q })
  }

  console.log('[seed] users…')
  for (const u of USERS) {
    // Use email as the upsert key since real users come in via Google OAuth.
    // Seed users have no googleId; we mark them with the seed id.
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: { ...u, googleId: `seed:${u.id}` },
    })
  }

  console.log('[seed] entries…')
  for (const e of ENTRIES) {
    const { photos, contributorIds, ...rest } = e

    await prisma.entry.upsert({
      where: { id: e.id },
      update: {
        ...rest,
        contributors: { set: contributorIds.map((id) => ({ id })) },
      },
      create: {
        ...rest,
        contributors: { connect: contributorIds.map((id) => ({ id })) },
      },
    })

    // Replace photos
    await prisma.photo.deleteMany({ where: { entryId: e.id } })
    if (photos.length > 0) {
      await prisma.photo.createMany({
        data: photos.map((p) => ({
          entryId: e.id,
          url: p.url,
          thumbUrl: p.thumbUrl,
          label: p.label,
          order: p.order,
        })),
      })
      const first = await prisma.photo.findFirst({
        where: { entryId: e.id },
        orderBy: { order: 'asc' },
      })
      if (first) {
        await prisma.entry.update({ where: { id: e.id }, data: { heroPhotoId: first.id } })
      }
    }
  }

  console.log('[seed] comments…')
  await prisma.comment.deleteMany({ where: { id: { in: COMMENTS.map((c) => c.id) } } })
  for (const c of COMMENTS) {
    await prisma.comment.create({ data: c })
  }

  console.log('[seed] reactions…')
  await prisma.reaction.deleteMany({}) // wipe all and reseed for idempotency
  for (const r of REACTIONS) {
    await prisma.reaction.create({ data: r })
  }

  // Recount denormalised fields
  console.log('[seed] recounting entry counts…')
  for (const e of ENTRIES) {
    const [likeCount, goingCount, interestedCount, commentCount] = await Promise.all([
      prisma.reaction.count({ where: { entryId: e.id, type: 'like' } }),
      prisma.reaction.count({ where: { entryId: e.id, type: 'going' } }),
      prisma.reaction.count({ where: { entryId: e.id, type: 'interested' } }),
      prisma.comment.count({ where: { entryId: e.id, deletedAt: null } }),
    ])
    await prisma.entry.update({
      where: { id: e.id },
      data: { likeCount, goingCount, interestedCount, commentCount },
    })
  }

  console.log('[seed] done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
