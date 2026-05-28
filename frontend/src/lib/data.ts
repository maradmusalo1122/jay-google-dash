/**
 * Mock seed data for testing the UI end-to-end without a backend.
 * Will be removed once real APIs are wired up.
 *
 * Tone: realistic for the NBS SAPAC team — India/Singapore offices,
 * affiliate/ecommerce events, partner programs, etc.
 */

import type { Comment, Entry, Photo, Quarter, Reaction, User } from '@/types'
import { photoUrl, thumbUrl } from './images'

// ── USERS ────────────────────────────────────────────────────
export const SEED_USERS: User[] = [
  {
    id: 'u-abhishek',
    email: 'abhishek@google.com',
    name: 'Abhishek Chopra',
    firstName: 'Abhishek',
    avatarInitials: 'AC',
    avatarColor: '#4285F4',
    office: 'IN',
    team: 'People Pillar',
    role: 'admin',
    status: 'approved',
    createdAt: '2025-08-01T00:00:00Z',
    lastActiveAt: '2026-05-27T09:00:00Z',
  },
  {
    id: 'u-priya',
    email: 'priyasharma@google.com',
    name: 'Priya Sharma',
    firstName: 'Priya',
    avatarInitials: 'PS',
    avatarColor: '#EA4335',
    office: 'IN',
    team: 'DFO Network',
    role: 'member',
    status: 'approved',
    createdAt: '2025-08-12T00:00:00Z',
    lastActiveAt: '2026-05-26T18:30:00Z',
  },
  {
    id: 'u-nikhil',
    email: 'nikhilsingh@google.com',
    name: 'Nikhil Singh',
    firstName: 'Nikhil',
    avatarInitials: 'NS',
    avatarColor: '#34A853',
    office: 'IN',
    team: 'Affiliate Partnerships',
    role: 'member',
    status: 'approved',
    createdAt: '2025-09-01T00:00:00Z',
    lastActiveAt: '2026-05-27T07:15:00Z',
  },
  {
    id: 'u-ramneek',
    email: 'ramneekk@google.com',
    name: 'Ramneek Kaur',
    firstName: 'Ramneek',
    avatarInitials: 'RK',
    avatarColor: '#FBBC05',
    office: 'IN',
    team: 'Affiliate Partnerships',
    role: 'member',
    status: 'approved',
    createdAt: '2025-09-15T00:00:00Z',
    lastActiveAt: '2026-05-25T14:00:00Z',
  },
  {
    id: 'u-jasmine',
    email: 'jasminewang@google.com',
    name: 'Jasmine Wang',
    firstName: 'Jasmine',
    avatarInitials: 'JW',
    avatarColor: '#185FA5',
    office: 'SG',
    team: 'DFO Network',
    role: 'member',
    status: 'approved',
    createdAt: '2025-10-01T00:00:00Z',
    lastActiveAt: '2026-05-26T11:00:00Z',
  },
  {
    id: 'u-aditya',
    email: 'adityaseth@google.com',
    name: 'Aditya Seth',
    firstName: 'Aditya',
    avatarInitials: 'AS',
    avatarColor: '#534AB7',
    office: 'IN',
    team: 'DFO Network',
    role: 'member',
    status: 'approved',
    createdAt: '2025-10-15T00:00:00Z',
    lastActiveAt: '2026-05-24T16:45:00Z',
  },
  {
    id: 'u-tina',
    email: 'tinayao@google.com',
    name: 'Tina Yao',
    firstName: 'Tina',
    avatarInitials: 'TY',
    avatarColor: '#0A6B50',
    office: 'SG',
    team: 'DFO Network',
    role: 'member',
    status: 'approved',
    createdAt: '2025-11-01T00:00:00Z',
    lastActiveAt: '2026-05-23T09:30:00Z',
  },
  {
    id: 'u-gunjeeta',
    email: 'gunjeetar@google.com',
    name: 'Gunjeeta Reddy',
    firstName: 'Gunjeeta',
    avatarInitials: 'GR',
    avatarColor: '#D4537E',
    office: 'IN',
    team: 'Affiliate Partnerships',
    role: 'member',
    status: 'approved',
    createdAt: '2025-11-15T00:00:00Z',
    lastActiveAt: '2026-05-20T12:00:00Z',
  },
  {
    id: 'u-sneha',
    email: 'snehapatil@google.com',
    name: 'Sneha Patil',
    firstName: 'Sneha',
    avatarInitials: 'SP',
    avatarColor: '#EF9F27',
    role: 'member',
    status: 'pending',
    createdAt: '2026-05-26T10:00:00Z',
  },
  {
    id: 'u-vikram',
    email: 'vikramj@google.com',
    name: 'Vikram Joshi',
    firstName: 'Vikram',
    avatarInitials: 'VJ',
    avatarColor: '#7F77DD',
    role: 'member',
    status: 'pending',
    createdAt: '2026-05-27T07:00:00Z',
  },
]

// ── QUARTERS ─────────────────────────────────────────────────
export const SEED_QUARTERS: Quarter[] = [
  {
    id: 'q4-2025',
    label: "Q4 '25",
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    status: 'archived',
  },
  {
    id: 'q1-2026',
    label: "Q1 '26",
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    status: 'archived',
  },
  {
    id: 'q2-2026',
    label: "Q2 '26",
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'live',
  },
]

// ── HELPERS ──────────────────────────────────────────────────
function makePhotos(seedBase: string, n: number, labels: string[] = []): Photo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${seedBase}-p${i}`,
    url: photoUrl(`${seedBase}-${i}`),
    thumbUrl: thumbUrl(`${seedBase}-${i}`),
    label: labels[i],
    order: i,
  }))
}

// ── ENTRIES ──────────────────────────────────────────────────
export const SEED_ENTRIES: Entry[] = [
  // ─── Q2 2026 (LIVE) — Upcoming events ────────────────────
  {
    id: 'e-mumbai-mixer',
    quarterId: 'q2-2026',
    authorId: 'u-ramneek',
    type: 'upcoming_event',
    title: 'Affiliate Partnership Mixer — Mumbai',
    caption:
      'Our Mumbai Affiliate Partnership Mixer is back. An evening with new publishers in the city — drinks, dinner, and conversations about what NBS can help with this quarter. RSVP if you can make it.',
    tag: 'Team event',
    eventDate: '2026-06-12T18:30:00Z',
    venue: 'Sofitel Mumbai BKC, Bandra-Kurla Complex',
    venueMapUrl: 'https://maps.google.com/?q=Sofitel+Mumbai+BKC',
    publicSlug: 'affiliate-mixer-mumbai-jun-2026',
    photos: makePhotos('mumbai-mixer-hero', 1, ['Sofitel Mumbai BKC']),
    heroPhotoId: 'mumbai-mixer-hero-p0',
    contributorIds: ['u-ramneek'],
    createdAt: '2026-05-26T12:00:00Z',
    likeCount: 0,
    commentCount: 3,
    goingCount: 18,
    interestedCount: 7,
  },
  {
    id: 'e-sg-dinner',
    quarterId: 'q2-2026',
    authorId: 'u-jasmine',
    type: 'upcoming_event',
    title: 'SEA Networking Dinner — Singapore',
    caption:
      'A casual dinner for SEA team and our new SG publishers. Quick intros, a couple of NBS product walkthroughs, and a proper meal. Bringing the India-SG split closer one dinner at a time.',
    tag: 'External',
    eventDate: '2026-06-25T19:00:00Z',
    venue: 'Burnt Ends, 7 Dempsey Road, Singapore',
    venueMapUrl: 'https://maps.google.com/?q=Burnt+Ends+Singapore+Dempsey',
    publicSlug: 'sea-networking-dinner-jun-2026',
    photos: makePhotos('sg-dinner-hero', 1, ['Burnt Ends']),
    heroPhotoId: 'sg-dinner-hero-p0',
    contributorIds: ['u-jasmine'],
    createdAt: '2026-05-24T08:00:00Z',
    likeCount: 0,
    commentCount: 2,
    goingCount: 11,
    interestedCount: 5,
  },

  // ─── Q2 2026 (LIVE) — Posts ──────────────────────────────
  {
    id: 'e-surat-mixer',
    quarterId: 'q2-2026',
    authorId: 'u-nikhil',
    type: 'post',
    title: 'Google Affiliate Partnership Mixer — Surat',
    caption:
      'Surat showed up. 40+ new publishers, deep conversations about content monetisation, and three product demos that landed exactly right. Big thanks to the local team for the warm welcome.',
    tag: 'Team event',
    eventName: 'Affiliate Partnership Mixer',
    eventDate: '2026-05-22T18:00:00Z',
    photos: makePhotos('surat-mixer', 5, [
      'Welcome desk',
      'Opening keynote',
      'Group photo',
      'Q&A session',
      'Dinner',
    ]),
    heroPhotoId: 'surat-mixer-p0',
    contributorIds: ['u-nikhil', 'u-priya', 'u-ramneek'],
    createdAt: '2026-05-23T11:00:00Z',
    likeCount: 34,
    commentCount: 9,
    goingCount: 0,
    interestedCount: 0,
  },
  {
    id: 'e-social-beat',
    quarterId: 'q2-2026',
    authorId: 'u-ramneek',
    type: 'post',
    title: 'Social Beat Summit — Ramneek on Stage',
    caption:
      "Ramneek led the panel on affiliate growth for SMBs. The audience asked the smart questions, and the after-panel queue lasted longer than the panel itself. Proud moment for the team.",
    tag: 'Team win',
    eventName: 'Social Beat Marketing Summit',
    eventDate: '2026-04-18T14:00:00Z',
    photos: makePhotos('social-beat', 3, [
      'On stage',
      'Panel discussion',
      'After-panel network',
    ]),
    heroPhotoId: 'social-beat-p0',
    contributorIds: ['u-ramneek', 'u-priya'],
    createdAt: '2026-04-19T09:00:00Z',
    likeCount: 41,
    commentCount: 12,
    goingCount: 0,
    interestedCount: 0,
  },
  {
    id: 'e-niketa-wedding',
    quarterId: 'q2-2026',
    authorId: 'u-jasmine',
    type: 'post',
    title: "Niketa's Wedding 🎉",
    caption:
      'Half the team flew in for Niketa\'s wedding. Three days of celebration, sangeet that ran past midnight, and a baraat that the hotel will remember. Wishing her and Karan the best.',
    tag: 'Life outside work',
    eventName: 'Team milestone',
    eventDate: '2026-04-08T17:00:00Z',
    photos: makePhotos('niketa-wedding', 4, [
      'The couple',
      'Sangeet night',
      'NBS table',
      'After the ceremony',
    ]),
    heroPhotoId: 'niketa-wedding-p0',
    contributorIds: ['u-jasmine', 'u-tina', 'u-abhishek'],
    createdAt: '2026-04-10T20:00:00Z',
    likeCount: 67,
    commentCount: 24,
    goingCount: 0,
    interestedCount: 0,
  },

  // ─── Q1 2026 (ARCHIVED) ──────────────────────────────────
  {
    id: 'e-engage-dinner',
    quarterId: 'q1-2026',
    authorId: 'u-abhishek',
    type: 'post',
    title: 'ENGAGE 2026 — Team Dinner',
    caption:
      'ENGAGE 2026, Macau. The India and Singapore teams around one table — strategy sessions by day, laughter by night. This is what the NBS SAPAC family looks like.',
    tag: 'Team event',
    eventName: 'ENGAGE 2026',
    eventDate: '2026-03-06T19:00:00Z',
    photos: makePhotos('engage-dinner', 4, [
      'The whole SAPAC family',
      'Toast',
      'India + SG together',
      'Late night',
    ]),
    heroPhotoId: 'engage-dinner-p0',
    contributorIds: ['u-abhishek', 'u-jasmine', 'u-priya', 'u-nikhil'],
    createdAt: '2026-03-07T08:00:00Z',
    likeCount: 52,
    commentCount: 18,
    goingCount: 0,
    interestedCount: 0,
  },
  {
    id: 'e-engage-banner',
    quarterId: 'q1-2026',
    authorId: 'u-priya',
    type: 'post',
    title: 'ENGAGE 2026 — The Banner Shot',
    caption:
      'Macau called. We answered. All of us. ENGAGE 2026 wrapped with this shot — the NBS SAPAC banner held high by two countries, one team.',
    tag: 'Team event',
    eventName: 'ENGAGE 2026',
    eventDate: '2026-03-07T12:00:00Z',
    photos: makePhotos('engage-banner', 2, ['The banner', 'Behind the scenes']),
    heroPhotoId: 'engage-banner-p0',
    contributorIds: ['u-priya', 'u-jasmine', 'u-abhishek'],
    createdAt: '2026-03-08T10:00:00Z',
    likeCount: 74,
    commentCount: 31,
    goingCount: 0,
    interestedCount: 0,
  },
  {
    id: 'e-adtech-conf',
    quarterId: 'q1-2026',
    authorId: 'u-aditya',
    type: 'post',
    title: 'AdTech Marketing Conference',
    caption:
      'Two days of AdTech, three NBS sessions, one big takeaway: the industry is hungry for stronger publisher tooling. Plenty of homework brought back to the team.',
    tag: 'External',
    eventName: 'AdTech Marketing Conference',
    eventDate: '2026-03-21T09:00:00Z',
    photos: makePhotos('adtech', 3, [
      'NBS booth',
      'Conference floor',
      'Day 2 closing',
    ]),
    heroPhotoId: 'adtech-p0',
    contributorIds: ['u-aditya', 'u-tina'],
    createdAt: '2026-03-22T15:00:00Z',
    likeCount: 28,
    commentCount: 7,
    goingCount: 0,
    interestedCount: 0,
  },

  // ─── Q4 2025 (ARCHIVED) ──────────────────────────────────
  {
    id: 'e-webinar',
    quarterId: 'q4-2025',
    authorId: 'u-jasmine',
    type: 'post',
    title: 'Affiliate Ecomm Growth Playbook Webinar',
    caption:
      'Jasmine, Aditya and Tina took the stage with DFO Network — breaking down the Affiliate Ecomm Growth Playbook for the shopping season. Recording is on the drive.',
    tag: 'Team win',
    eventName: 'DFO Network',
    eventDate: '2025-11-14T15:00:00Z',
    photos: makePhotos('webinar', 2, ['On the webinar', 'The team after']),
    heroPhotoId: 'webinar-p0',
    contributorIds: ['u-jasmine', 'u-aditya', 'u-tina'],
    createdAt: '2025-11-15T09:00:00Z',
    likeCount: 24,
    commentCount: 6,
    goingCount: 0,
    interestedCount: 0,
  },
  {
    id: 'e-berkeley',
    quarterId: 'q4-2025',
    authorId: 'u-gunjeeta',
    type: 'post',
    title: 'UC Berkeley — Google Business Leadership Program',
    caption:
      'Nikhil, Gunjeeta and teammates graduating from the Google Business Leadership Program at UC Berkeley. Certificates in hand, energy through the roof.',
    tag: 'Learning',
    eventName: 'UC Berkeley',
    eventDate: '2025-11-22T17:00:00Z',
    photos: makePhotos('berkeley', 3, [
      'Graduation day',
      'NBS cohort',
      'Campus tour',
    ]),
    heroPhotoId: 'berkeley-p0',
    contributorIds: ['u-nikhil', 'u-gunjeeta'],
    createdAt: '2025-11-23T07:00:00Z',
    likeCount: 38,
    commentCount: 11,
    goingCount: 0,
    interestedCount: 0,
  },
]

// ── COMMENTS ─────────────────────────────────────────────────
export const SEED_COMMENTS: Comment[] = [
  // Surat
  { id: 'c-1', entryId: 'e-surat-mixer', userId: 'u-priya', body: 'The energy was unreal. Will copy this format for the next one.', createdAt: '2026-05-23T13:00:00Z' },
  { id: 'c-2', entryId: 'e-surat-mixer', userId: 'u-abhishek', body: 'Great work team. Notes from the demos pls?', createdAt: '2026-05-23T15:30:00Z' },
  { id: 'c-3', entryId: 'e-surat-mixer', userId: 'u-jasmine', body: 'SG team wants in for the next one 🙋‍♀️', createdAt: '2026-05-24T03:00:00Z' },
  // Niketa wedding
  { id: 'c-4', entryId: 'e-niketa-wedding', userId: 'u-abhishek', body: 'Wishing them both the best ❤️', createdAt: '2026-04-10T20:30:00Z' },
  { id: 'c-5', entryId: 'e-niketa-wedding', userId: 'u-priya', body: 'That sangeet 🔥🔥🔥', createdAt: '2026-04-11T06:00:00Z' },
  // Mumbai mixer (upcoming)
  { id: 'c-6', entryId: 'e-mumbai-mixer', userId: 'u-priya', body: 'Coming in from Bengaluru — anyone wants to share a cab from the hotel?', createdAt: '2026-05-26T13:00:00Z' },
  { id: 'c-7', entryId: 'e-mumbai-mixer', userId: 'u-aditya', body: 'Yes! Will DM you.', createdAt: '2026-05-26T14:15:00Z' },
  { id: 'c-8', entryId: 'e-mumbai-mixer', userId: 'u-abhishek', body: 'Sofitel is great. Looking forward to it!', createdAt: '2026-05-27T07:00:00Z' },
  // SG dinner (upcoming)
  { id: 'c-9', entryId: 'e-sg-dinner', userId: 'u-tina', body: "Burnt Ends 👀 great pick", createdAt: '2026-05-24T10:00:00Z' },
  { id: 'c-10', entryId: 'e-sg-dinner', userId: 'u-nikhil', body: 'Flying in for this. Will land afternoon of the 25th.', createdAt: '2026-05-25T08:00:00Z' },
  // ENGAGE
  { id: 'c-11', entryId: 'e-engage-dinner', userId: 'u-tina', body: 'Best three days of the year. Already counting down to ENGAGE 2027.', createdAt: '2026-03-08T11:00:00Z' },
  { id: 'c-12', entryId: 'e-engage-banner', userId: 'u-nikhil', body: 'Frame this one.', createdAt: '2026-03-08T12:00:00Z' },
]

// ── REACTIONS ────────────────────────────────────────────────
// Seed enough real reactions that counts feel populated AND match
// what's actually here. The current user can then toggle their own.
function likes(entryId: string, userIds: string[], baseTime: string): Reaction[] {
  return userIds.map((u, i) => ({
    entryId,
    userId: u,
    type: 'like' as const,
    createdAt: new Date(new Date(baseTime).getTime() + i * 60_000).toISOString(),
  }))
}

export const SEED_REACTIONS: Reaction[] = [
  // ─── Upcoming events: RSVPs ────────────────────────────────
  // Mumbai mixer — 6 going, 2 interested
  { entryId: 'e-mumbai-mixer', userId: 'u-priya', type: 'going', createdAt: '2026-05-26T13:00:00Z' },
  { entryId: 'e-mumbai-mixer', userId: 'u-aditya', type: 'going', createdAt: '2026-05-26T14:00:00Z' },
  { entryId: 'e-mumbai-mixer', userId: 'u-abhishek', type: 'going', createdAt: '2026-05-27T07:00:00Z' },
  { entryId: 'e-mumbai-mixer', userId: 'u-nikhil', type: 'going', createdAt: '2026-05-26T15:30:00Z' },
  { entryId: 'e-mumbai-mixer', userId: 'u-gunjeeta', type: 'going', createdAt: '2026-05-26T16:45:00Z' },
  { entryId: 'e-mumbai-mixer', userId: 'u-ramneek', type: 'going', createdAt: '2026-05-26T12:30:00Z' },
  { entryId: 'e-mumbai-mixer', userId: 'u-tina', type: 'interested', createdAt: '2026-05-26T15:00:00Z' },
  { entryId: 'e-mumbai-mixer', userId: 'u-jasmine', type: 'interested', createdAt: '2026-05-26T17:00:00Z' },

  // SG dinner — 4 going, 3 interested
  { entryId: 'e-sg-dinner', userId: 'u-nikhil', type: 'going', createdAt: '2026-05-25T08:00:00Z' },
  { entryId: 'e-sg-dinner', userId: 'u-tina', type: 'going', createdAt: '2026-05-24T10:00:00Z' },
  { entryId: 'e-sg-dinner', userId: 'u-jasmine', type: 'going', createdAt: '2026-05-24T11:00:00Z' },
  { entryId: 'e-sg-dinner', userId: 'u-aditya', type: 'going', createdAt: '2026-05-25T09:00:00Z' },
  { entryId: 'e-sg-dinner', userId: 'u-abhishek', type: 'interested', createdAt: '2026-05-26T11:00:00Z' },
  { entryId: 'e-sg-dinner', userId: 'u-priya', type: 'interested', createdAt: '2026-05-26T12:00:00Z' },
  { entryId: 'e-sg-dinner', userId: 'u-ramneek', type: 'interested', createdAt: '2026-05-26T13:00:00Z' },

  // ─── Posts: likes ──────────────────────────────────────────
  ...likes('e-surat-mixer', ['u-abhishek', 'u-jasmine', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-ramneek'], '2026-05-23T12:00:00Z'),
  ...likes('e-social-beat', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-nikhil', 'u-gunjeeta'], '2026-04-19T11:00:00Z'),
  ...likes('e-niketa-wedding', ['u-abhishek', 'u-priya', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-nikhil', 'u-ramneek'], '2026-04-10T21:00:00Z'),
  ...likes('e-engage-dinner', ['u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-ramneek', 'u-nikhil'], '2026-03-07T10:00:00Z'),
  ...likes('e-engage-banner', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-gunjeeta', 'u-nikhil', 'u-ramneek'], '2026-03-08T11:00:00Z'),
  ...likes('e-adtech-conf', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-ramneek'], '2026-03-22T16:00:00Z'),
  ...likes('e-webinar', ['u-abhishek', 'u-priya', 'u-tina', 'u-aditya', 'u-nikhil'], '2025-11-15T10:00:00Z'),
  ...likes('e-berkeley', ['u-abhishek', 'u-priya', 'u-jasmine', 'u-tina', 'u-aditya', 'u-ramneek'], '2025-11-23T08:00:00Z'),
]
