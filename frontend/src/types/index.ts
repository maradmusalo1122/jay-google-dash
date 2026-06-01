// Single source of truth for shared domain types.
// Mirrors backend/prisma/schema.prisma (will stay in sync).

export type Office = 'IN' | 'SG'
export type Role = 'member' | 'admin'
export type UserStatus = 'pending' | 'approved' | 'disabled'
export type QuarterStatus = 'live' | 'archived'
export type EntryType = 'post' | 'upcoming_event'

export type Tag =
  | 'Team event'
  | 'Learning'
  | 'Team win'
  | 'External'
  | 'Life outside work'
  | 'Just a vibe'

export type ReactionType = 'like' | 'going' | 'interested'

export interface User {
  id: string
  email: string
  name: string
  firstName: string
  avatarInitials: string
  avatarColor: string
  /** Optional uploaded profile picture (data URL or hosted image URL). */
  avatarPhoto?: string
  /** Optional uploaded cover image (data URL or hosted image URL). */
  coverPhoto?: string
  office?: Office
  team?: string
  role: Role
  status: UserStatus
  createdAt: string
  lastActiveAt?: string
}

export interface Quarter {
  id: string
  label: string
  startDate: string
  endDate: string
  status: QuarterStatus
}

export type MediaKind = 'photo' | 'video'

export interface Photo {
  id: string
  kind?: MediaKind            // optional for backward-compat with legacy data
  url: string                 // photo: image URL · video: video URL
  thumbUrl?: string           // photo: thumbnail · video: poster frame
  label?: string
  order: number
  duration?: number           // seconds, only for videos
  width?: number
  height?: number
}

export interface Comment {
  id: string
  entryId: string
  userId: string
  body: string
  createdAt: string
}

export interface Reaction {
  entryId: string
  userId: string
  type: ReactionType
  createdAt: string
}

export type NotificationKind = 'mention_comment' | 'mention_caption'

export interface Notification {
  id: string
  userId: string        // recipient
  type: NotificationKind
  actorId: string       // who triggered it
  entryId: string
  commentId?: string
  excerpt: string       // short preview of the mention's body
  createdAt: string
  read: boolean
}

export interface Entry {
  id: string
  quarterId: string
  authorId: string
  type: EntryType
  title: string
  caption: string
  tag: Tag
  eventName?: string
  eventDate?: string // ISO
  venue?: string
  venueMapUrl?: string
  publicSlug?: string
  photos: Photo[]
  heroPhotoId?: string
  contributorIds: string[]
  createdAt: string
  // Denormalised counts kept in sync via app code
  likeCount: number
  commentCount: number
  goingCount: number
  interestedCount: number
}

// Colour tokens applied to tag chips (matches prototype palette).
export const TAG_STYLES: Record<Tag, { bg: string; fg: string }> = {
  'Team event': { bg: '#E1F5EE', fg: '#0A6B50' },
  Learning: { bg: '#FAEEDA', fg: '#854F0B' },
  'Team win': { bg: '#E8F0FE', fg: '#185FA5' },
  External: { bg: '#EEEDFE', fg: '#534AB7' },
  'Life outside work': { bg: '#FBEAF0', fg: '#72243E' },
  'Just a vibe': { bg: '#F1F5F9', fg: '#475569' },
}

export const ALL_TAGS: Tag[] = [
  'Team event',
  'Learning',
  'Team win',
  'External',
  'Life outside work',
  'Just a vibe',
]
