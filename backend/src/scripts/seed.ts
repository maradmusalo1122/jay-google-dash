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

/* ────────────────────────────────────────────────────────────
 *  CURATED MEDIA LIBRARY
 *  Themed photos & video for the seed feed. All URLs are public
 *  CDN endpoints (Unsplash, Picsum, Google's sample video bucket).
 *  Photos are addressed by ID so they're stable across reseeds.
 * ──────────────────────────────────────────────────────────── */

function un(id: string, w = 1600) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`
}
function pic(id: number | string, w = 1600, h = 900) {
  // Use specific picsum image ID (stable) rather than random seed
  return typeof id === 'number'
    ? `https://picsum.photos/id/${id}/${w}/${h}`
    : `https://picsum.photos/seed/${encodeURIComponent(id)}/${w}/${h}`
}

/**
 * Short, royalty-free sample clip hosted by test-videos.co.uk (10s, 1MB).
 * Used in the Surat Mixer post to showcase video rendering in the gallery.
 * Picked because:
 *   - Google's gtv-videos-bucket is now 403-locked
 *   - test-videos.co.uk has been a reliable public sample host for years
 *   - Tiny payload (1MB) → instant load
 */
const VIDEOS = {
  sampleClip: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
}

interface SeedPhoto { kind?: 'photo' | 'video'; url: string; thumbUrl?: string; label?: string; order: number }

/** Helper: build a multi-photo set from a list of [url, label] pairs. */
function set(items: Array<[string, string?]>): SeedPhoto[] {
  return items.map(([url, label], i) => ({
    kind: 'photo' as const,
    url,
    thumbUrl: url.includes('unsplash.com')
      ? url.replace(/w=\d+/, 'w=480')
      : url.replace('/1600/900', '/480/270'),
    label,
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
  photos: SeedPhoto[]
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
    // Mumbai skyline at night — Bandra-Kurla / Marine Drive vibe for the hero
    photos: set([
      [un('1570168007204-dfb528c6958f'), 'Sofitel Mumbai BKC at night'],
    ]),
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
    photos: set([
      [un('1508964942454-1a56651d54ac'), 'Marina Bay Sands'],
    ]),
    contributorIds: ['u-jasmine'], createdAt: new Date('2026-05-24T08:00:00Z'),
  },

  // ── Q2 2026 — posts ──
  {
    id: 'e-surat-mixer', quarterId: 'q2-2026', authorId: 'u-nikhil', type: 'post',
    title: 'Google Affiliate Partnership Mixer — Surat',
    caption: 'Surat showed up. 40+ new publishers, deep conversations about content monetisation, and three product demos that landed exactly right. Big thanks to the local team for the warm welcome. Short clip from the opening reel below 👇',
    tag: 'team_event', eventName: 'Affiliate Partnership Mixer', eventDate: new Date('2026-05-22T18:00:00Z'),
    photos: [
      // 5 photos + a 15s clip at position 2 (showcases video rendering in the gallery)
      ...set([
        [un('1559136555-9303baea8ebd'), 'Welcome desk + Google branding'],
        [un('1511578314322-379afb476865'), 'Opening keynote — packed room'],
      ]),
      {
        kind: 'video', order: 2,
        url: VIDEOS.sampleClip,
        thumbUrl: un('1505373877841-8d25f7d46678', 480),
        label: '10-second clip from the opening',
      },
      ...set([
        [un('1540575467063-178a50c2df87'), 'Q&A session'],
        [un('1591115765373-5207764f72e7'), 'Networking over drinks'],
        [un('1559339352-11d035aa65de'), 'Dinner — long-table'],
      ]).map((p, i) => ({ ...p, order: 3 + i })),
    ],
    contributorIds: ['u-nikhil', 'u-priya', 'u-ramneek'], createdAt: new Date('2026-05-23T11:00:00Z'),
  },
  {
    id: 'e-social-beat', quarterId: 'q2-2026', authorId: 'u-ramneek', type: 'post',
    title: 'Social Beat Summit — Ramneek on Stage',
    caption: 'Ramneek led the panel on affiliate growth for SMBs. The audience asked the smart questions, and the after-panel queue lasted longer than the panel itself. Proud moment for the team.',
    tag: 'team_win', eventName: 'Social Beat Marketing Summit', eventDate: new Date('2026-04-18T14:00:00Z'),
    photos: set([
      [un('1505373877841-8d25f7d46678'), 'Ramneek on stage'],
      [un('1517048676732-d65bc937f952'), 'Panel discussion'],
      [un('1559223607-a43c990c692c'), 'Audience hands up'],
      [un('1475721027785-f74eccf877e2'), 'After-panel queue'],
    ]),
    contributorIds: ['u-ramneek', 'u-priya'], createdAt: new Date('2026-04-19T09:00:00Z'),
  },
  {
    id: 'e-niketa-wedding', quarterId: 'q2-2026', authorId: 'u-jasmine', type: 'post',
    title: "Niketa's Wedding 🎉",
    caption: "Half the team flew in for Niketa's wedding. Three days of celebration, sangeet that ran past midnight, and a baraat that the hotel will remember. Wishing her and Karan the best.",
    tag: 'life_outside', eventName: 'Team milestone', eventDate: new Date('2026-04-08T17:00:00Z'),
    photos: set([
      [un('1583939411023-14783179e581'), 'The mandap'],
      [un('1591604466107-ec97de577aff'), 'The couple'],
      [un('1535025183041-0991a977e25b'), 'Floral arrangements'],
      [un('1519741497674-611481863552'), 'NBS table at the reception'],
    ]),
    contributorIds: ['u-jasmine', 'u-tina', 'u-abhishek'], createdAt: new Date('2026-04-10T20:00:00Z'),
  },

  // ── Q1 2026 (archived) ──
  {
    id: 'e-engage-dinner', quarterId: 'q1-2026', authorId: 'u-abhishek', type: 'post',
    title: 'ENGAGE 2026 — Team Dinner',
    caption: 'ENGAGE 2026, Macau. The India and Singapore teams around one table — strategy sessions by day, laughter by night. This is what the NBS SAPAC family looks like.',
    tag: 'team_event', eventName: 'ENGAGE 2026', eventDate: new Date('2026-03-06T19:00:00Z'),
    photos: set([
      [un('1414235077428-338989a2e8c0'), 'The whole SAPAC family at the table'],
      [un('1559339352-11d035aa65de'), 'Toast'],
      [un('1517248135467-4c7edcad34c4'), 'India + SG together'],
      [un('1543269865-cbf427effbad'), 'Strategy session — laptops out'],
      [un('1525625293386-3f8f99389edd'), 'Macau by night'],
    ]),
    contributorIds: ['u-abhishek', 'u-jasmine', 'u-priya', 'u-nikhil'], createdAt: new Date('2026-03-07T08:00:00Z'),
  },
  {
    id: 'e-engage-banner', quarterId: 'q1-2026', authorId: 'u-priya', type: 'post',
    title: 'ENGAGE 2026 — The Banner Shot',
    caption: 'Macau called. We answered. All of us. ENGAGE 2026 wrapped with this shot — the NBS SAPAC banner held high by two countries, one team.',
    tag: 'team_event', eventName: 'ENGAGE 2026', eventDate: new Date('2026-03-07T12:00:00Z'),
    photos: set([
      [un('1556761175-5973dc0f32e7'), 'The banner shot'],
      [un('1582213782179-e0d53f98f2ca'), 'Behind the scenes — setting up'],
      [un('1531058020387-3be344556be6'), 'Crowd reaction'],
      [un('1573164713619-24c711fe7878'), 'Group selfie after'],
    ]),
    contributorIds: ['u-priya', 'u-jasmine', 'u-abhishek'], createdAt: new Date('2026-03-08T10:00:00Z'),
  },
  {
    id: 'e-adtech-conf', quarterId: 'q1-2026', authorId: 'u-aditya', type: 'post',
    title: 'AdTech Marketing Conference',
    caption: 'Two days of AdTech, three NBS sessions, one big takeaway: the industry is hungry for stronger publisher tooling. Plenty of homework brought back to the team.',
    tag: 'external', eventName: 'AdTech Marketing Conference', eventDate: new Date('2026-03-21T09:00:00Z'),
    photos: set([
      [un('1515187029135-18ee286d815b'), 'NBS booth'],
      [un('1511578314322-379afb476865'), 'Conference floor'],
      [un('1531058020387-3be344556be6'), 'Audience'],
      [un('1497366216548-37526070297c'), 'Day 2 closing'],
    ]),
    contributorIds: ['u-aditya', 'u-tina'], createdAt: new Date('2026-03-22T15:00:00Z'),
  },

  // ── Q4 2025 (archived) ──
  {
    id: 'e-webinar', quarterId: 'q4-2025', authorId: 'u-jasmine', type: 'post',
    title: 'Affiliate Ecomm Growth Playbook Webinar',
    caption: 'Jasmine, Aditya and Tina took the stage with DFO Network — breaking down the Affiliate Ecomm Growth Playbook for the shopping season. Recording is on the drive.',
    tag: 'team_win', eventName: 'DFO Network', eventDate: new Date('2025-11-14T15:00:00Z'),
    photos: set([
      [un('1591115765373-5207764f72e7'), 'On the webinar — 3-up layout'],
      [un('1517048676732-d65bc937f952'), 'Walking through the playbook'],
      [un('1543269865-cbf427effbad'), 'Q&A flood at the end'],
      [un('1573164713619-24c711fe7878'), 'The team debrief after'],
    ]),
    contributorIds: ['u-jasmine', 'u-aditya', 'u-tina'], createdAt: new Date('2025-11-15T09:00:00Z'),
  },
  {
    id: 'e-berkeley', quarterId: 'q4-2025', authorId: 'u-gunjeeta', type: 'post',
    title: 'UC Berkeley — Google Business Leadership Program',
    caption: 'Nikhil, Gunjeeta and teammates graduating from the Google Business Leadership Program at UC Berkeley. Certificates in hand, energy through the roof.',
    tag: 'learning', eventName: 'UC Berkeley', eventDate: new Date('2025-11-22T17:00:00Z'),
    photos: set([
      [un('1571260899304-425eee4c7efc'), 'Berkeley campus'],
      [un('1607237138185-eedd9c632b0b'), 'Graduation day — caps in air'],
      [un('1556761175-5973dc0f32e7'), 'NBS cohort'],
      [pic(219), 'Campus architecture'],
    ]),
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
          kind: p.kind ?? 'photo',
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
