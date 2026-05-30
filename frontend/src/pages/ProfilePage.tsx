import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import UserAvatar from '@/components/ui/UserAvatar'
import Toast from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import PhotoLightbox from '@/components/ui/PhotoLightbox'
import MentionText from '@/components/feed/MentionText'
import { formatMonthYear, formatShortDate, relativeTime } from '@/lib/format'
import { parseMentions } from '@/lib/mentions'
import type { Entry, Office, User } from '@/types'
import { cn } from '@/lib/cn'

const OFFICES: Office[] = ['IN', 'SG']
const TEAMS = [
  'People Pillar',
  'DFO Network',
  'Affiliate Partnerships',
  'Engagement',
  'Operations',
]
const AVATAR_COLORS = [
  '#4285F4', '#EA4335', '#FBBC05', '#34A853',
  '#185FA5', '#D4537E', '#7F77DD', '#0A6B50',
  '#EF9F27', '#534AB7', '#993556',
]

type Tab = 'posts' | 'activity' | 'mentions' | 'about'

/**
 * Social-media-style profile page.
 *   /me      → current user (full edit controls)
 *   /u/:id   → any user (read-only if not self)
 */
export default function ProfilePage() {
  const { id: paramId } = useParams<{ id?: string }>()
  const { currentUser, signOut } = useAuth()
  const { users, entries, comments, reactions, updateUser } = useStore()
  const navigate = useNavigate()

  const target = paramId ? users.find((u) => u.id === paramId) : currentUser
  const isSelf = !!currentUser && !!target && currentUser.id === target.id

  const [tab, setTab] = useState<Tab>('posts')
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(() => {
    setTab('posts')
  }, [target?.id])

  if (!currentUser) return null

  if (!target) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl">🔎</div>
        <h1 className="font-display text-2xl mt-3">User not found</h1>
        <p className="text-base text-ink-3 mt-1">This person may have left the team or the link is stale.</p>
        <button
          type="button"
          onClick={() => navigate('/feed')}
          className="mt-4 px-4 py-2 rounded-sm border border-line text-base hover:bg-surface-soft"
        >
          Back to feed
        </button>
      </div>
    )
  }

  return (
    <div className="-mx-4 sm:-mx-6 -mt-5">
      <ProfileHero
        target={target}
        isSelf={isSelf}
        onEdit={() => setEditOpen(true)}
        onSignOut={async () => {
          await signOut()
          navigate('/login')
        }}
        onCopyEmail={() => {
          navigator.clipboard?.writeText(target.email).then(
            () => setToast('Email copied to clipboard'),
            () => setToast('Copy failed — long-press the email instead'),
          )
        }}
        onViewPhoto={(src) => setLightboxSrc(src)}
      />

      <div className="px-4 sm:px-6">
        <ProfileStats target={target} entries={entries} comments={comments} reactions={reactions} />
        <ProfileTabs tab={tab} setTab={setTab} />
        <div className="mt-4">
          {tab === 'posts' && <PostsTab target={target} entries={entries} />}
          {tab === 'activity' && (
            <ActivityTab target={target} entries={entries} comments={comments} reactions={reactions} />
          )}
          {tab === 'mentions' && (
            <MentionsTab target={target} entries={entries} comments={comments} users={users} />
          )}
          {tab === 'about' && <AboutTab target={target} entries={entries} />}
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        target={target}
        onSave={(patch) => {
          updateUser(target.id, patch)
          setEditOpen(false)
          setToast('Profile saved')
        }}
      />

      <PhotoLightbox src={lightboxSrc} alt={target.name} onClose={() => setLightboxSrc(null)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 *  HERO
 * ──────────────────────────────────────────────────────────── */
function ProfileHero({
  target,
  isSelf,
  onEdit,
  onSignOut,
  onCopyEmail,
  onViewPhoto,
}: {
  target: User
  isSelf: boolean
  onEdit: () => void
  onSignOut: () => void
  onCopyEmail: () => void
  onViewPhoto: (src: string) => void
}) {
  const canViewAvatar = !!target.avatarPhoto
  const canViewCover = !!target.coverPhoto
  return (
    <div className="bg-surface border-b border-line">
      <div className="google-stripe">
        <span /><span /><span /><span />
      </div>

      {/* Cover — uploaded image OR subtle gradient using avatar colour.
          Clickable when an actual photo is uploaded so you can view it full-size. */}
      <button
        type="button"
        onClick={canViewCover ? () => onViewPhoto(target.coverPhoto!) : undefined}
        disabled={!canViewCover}
        aria-label={canViewCover ? 'View cover photo' : undefined}
        className={cn(
          'block w-full h-32 sm:h-44 relative bg-cover bg-center text-left',
          canViewCover && 'cursor-zoom-in group',
        )}
        style={
          target.coverPhoto
            ? { backgroundImage: `url(${target.coverPhoto})` }
            : {
                background: `linear-gradient(180deg, ${target.avatarColor}38 0%, ${target.avatarColor}14 55%, #FFFFFF 100%)`,
              }
        }
      >
        {!target.coverPhoto && (
          <div
            className="absolute right-8 top-6 w-24 h-24 rounded-full opacity-35 blur-3xl pointer-events-none"
            style={{ background: target.avatarColor }}
          />
        )}
        {canViewCover && (
          <span className="absolute bottom-3 right-3 text-xs text-white bg-black/40 backdrop-blur px-2 py-1 rounded-pill opacity-0 group-hover:opacity-100 transition pointer-events-none">
            Click to view
          </span>
        )}
      </button>

      <div className="px-4 sm:px-6 pb-5 -mt-14 sm:-mt-16">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          {/* Avatar wrapper: thick opaque white border, solid white fill,
              soft drop shadow. Border IS the ring — part of the avatar's
              own circle, so no parent bleed-through. */}
          <button
            type="button"
            onClick={canViewAvatar ? () => onViewPhoto(target.avatarPhoto!) : undefined}
            disabled={!canViewAvatar}
            aria-label={canViewAvatar ? 'View profile photo' : undefined}
            className={cn(
              'rounded-full bg-white border-[6px] border-white flex-shrink-0 relative z-10 overflow-hidden',
              canViewAvatar && 'cursor-zoom-in hover:brightness-105 transition',
            )}
            style={{ boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
          >
            <UserAvatar user={target} size="xl" />
          </button>

          <div className="flex gap-2 mb-1">
            {isSelf ? (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-base px-3.5 py-1.5 rounded-pill border border-line-strong text-ink hover:bg-surface-soft transition inline-flex items-center gap-1.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit profile
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-base px-3.5 py-1.5 rounded-pill border border-line text-ink-3 hover:text-ink hover:border-ink-3 transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onCopyEmail}
                  className="text-base px-3.5 py-1.5 rounded-pill bg-g-blue text-white font-medium hover:bg-g-blue-d transition inline-flex items-center gap-1.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <path d="M22 6l-10 7L2 6"/>
                  </svg>
                  Copy email
                </button>
                <a
                  href={`mailto:${target.email}`}
                  className="text-base px-3.5 py-1.5 rounded-pill border border-line-strong text-ink hover:bg-surface-soft transition"
                >
                  Email
                </a>
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 className="font-display text-2xl sm:text-3xl text-ink leading-tight">{target.name}</h1>
          <p className="text-base text-ink-3 mt-0.5">{target.email}</p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-xs px-2 py-0.5 rounded-pill bg-g-blue-l text-g-blue-d font-medium">
              {target.role === 'admin' ? 'Admin' : 'Member'}
            </span>
            {target.status === 'pending' && (
              <span className="text-xs px-2 py-0.5 rounded-pill bg-amber-100 text-amber-800 font-medium">
                Pending approval
              </span>
            )}
            {target.status === 'disabled' && (
              <span className="text-xs px-2 py-0.5 rounded-pill bg-rose-100 text-rose-800 font-medium">
                Disabled
              </span>
            )}
            {target.office && (
              <span className="text-xs px-2 py-0.5 rounded-pill bg-surface-soft text-ink-2 font-medium inline-flex items-center gap-1">
                <span aria-hidden>{target.office === 'IN' ? '🇮🇳' : '🇸🇬'}</span>
                {target.office === 'IN' ? 'India' : 'Singapore'}
              </span>
            )}
            {target.team && (
              <span className="text-xs px-2 py-0.5 rounded-pill bg-surface-soft text-ink-2 font-medium">
                {target.team}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Joined {formatMonthYear(target.createdAt)}
            </span>
            {target.lastActiveAt && (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-g-green" aria-hidden />
                Active {relativeTime(target.lastActiveAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 *  STATS
 * ──────────────────────────────────────────────────────────── */
function ProfileStats({
  target,
  entries,
  comments,
  reactions,
}: {
  target: User
  entries: Entry[]
  comments: { userId: string }[]
  reactions: { userId: string; type: string }[]
}) {
  const my = entries.filter((e) => e.authorId === target.id)
  const postsCount = my.filter((e) => e.type === 'post').length
  const eventsCount = my.filter((e) => e.type === 'upcoming_event').length
  const photosCount = my.reduce((sum, e) => sum + e.photos.length, 0)
  const commentsCount = comments.filter((c) => c.userId === target.id).length
  const goingCount = reactions.filter((r) => r.userId === target.id && r.type === 'going').length

  const stats: Array<{ n: number; label: string }> = [
    { n: postsCount, label: 'Posts' },
    { n: eventsCount, label: 'Events' },
    { n: photosCount, label: 'Photos' },
    { n: goingCount, label: 'Going' },
    { n: commentsCount, label: 'Comments' },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-surface border border-line rounded-md px-3 py-2.5 text-center hover:border-g-blue transition"
        >
          <div className="font-display text-2xl text-ink leading-none">{s.n}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-3 mt-1 font-medium">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 *  TABS
 * ──────────────────────────────────────────────────────────── */
function ProfileTabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'posts', label: 'Posts' },
    { id: 'activity', label: 'Activity' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'about', label: 'About' },
  ]
  return (
    <div className="mt-5 border-b border-line flex overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={cn(
            'px-4 py-2.5 text-base whitespace-nowrap border-b-2 transition font-sans',
            t.id === tab
              ? 'text-g-blue border-g-blue font-medium'
              : 'text-ink-3 border-transparent hover:text-ink',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function PostsTab({ target, entries }: { target: User; entries: Entry[] }) {
  const mine = entries
    .filter((e) => e.authorId === target.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (mine.length === 0) {
    return (
      <EmptyState
        emoji="📭"
        title={`${target.firstName} hasn't posted yet`}
        body="When they share moments, they'll show up here."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {mine.map((e) => {
        const hero = e.photos.find((p) => p.id === e.heroPhotoId) ?? e.photos[0]
        const isUpcoming = e.type === 'upcoming_event'
        return (
          <Link
            key={e.id}
            to="/feed"
            onClick={() => {
              requestAnimationFrame(() => {
                document.getElementById(`entry-${e.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              })
            }}
            className="bg-surface border border-line rounded-md overflow-hidden hover:border-g-blue transition group"
          >
            {hero && (
              <div className="aspect-[16/9] overflow-hidden bg-surface-soft">
                <img
                  src={hero.thumbUrl ?? hero.url}
                  alt={e.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
            )}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display text-md text-ink leading-tight">{e.title}</h3>
                {isUpcoming && (
                  <span className="text-[10px] font-semibold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-pill flex-shrink-0">
                    Upcoming
                  </span>
                )}
              </div>
              <div className="text-xs text-ink-3">
                {e.eventDate ? formatShortDate(e.eventDate) : formatShortDate(e.createdAt)} ·{' '}
                {e.photos.length} {e.photos.length === 1 ? 'photo' : 'photos'} ·{' '}
                ❤ {e.likeCount} · 💬 {e.commentCount}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function ActivityTab({
  target,
  entries,
  comments,
  reactions,
}: {
  target: User
  entries: Entry[]
  comments: { id: string; userId: string; entryId: string; body: string; createdAt: string }[]
  reactions: { userId: string; entryId: string; type: string; createdAt: string }[]
}) {
  const items = useMemo(() => {
    type Item = {
      id: string
      icon: string
      verb: string
      entryId: string
      body?: string
      createdAt: string
    }
    const out: Item[] = []
    entries
      .filter((e) => e.authorId === target.id)
      .forEach((e) => {
        out.push({
          id: `e-${e.id}`,
          icon: e.type === 'upcoming_event' ? '📅' : '📝',
          verb: e.type === 'upcoming_event' ? 'created the event' : 'posted',
          entryId: e.id,
          body: e.title,
          createdAt: e.createdAt,
        })
      })
    comments
      .filter((c) => c.userId === target.id)
      .forEach((c) => {
        out.push({
          id: `c-${c.id}`,
          icon: '💬',
          verb: 'commented on',
          entryId: c.entryId,
          body: c.body,
          createdAt: c.createdAt,
        })
      })
    reactions
      .filter((r) => r.userId === target.id)
      .forEach((r, i) => {
        out.push({
          id: `r-${r.entryId}-${r.userId}-${r.type}-${i}`,
          icon: r.type === 'like' ? '❤️' : r.type === 'going' ? '✋' : '👀',
          verb: r.type === 'like' ? 'liked' : r.type === 'going' ? 'RSVPed Going to' : 'marked Interested in',
          entryId: r.entryId,
          createdAt: r.createdAt,
        })
      })
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [target.id, entries, comments, reactions])

  if (items.length === 0) {
    return <EmptyState emoji="🌱" title="No activity yet" body={`${target.firstName} hasn't done anything on the Chronicle yet.`} />
  }

  return (
    <div className="bg-surface border border-line rounded-md divide-y divide-line">
      {items.slice(0, 50).map((item) => {
        const entry = entries.find((e) => e.id === item.entryId)
        return (
          <div key={item.id} className="px-4 py-2.5 flex items-start gap-3">
            <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-base text-ink-2 leading-snug">
                <span className="font-medium text-ink">{target.firstName}</span> {item.verb}{' '}
                {entry ? (
                  <Link
                    to="/feed"
                    onClick={() =>
                      requestAnimationFrame(() =>
                        document.getElementById(`entry-${entry.id}`)?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        }),
                      )
                    }
                    className="text-g-blue hover:underline"
                  >
                    {entry.title}
                  </Link>
                ) : (
                  <span className="text-ink-3 italic">(deleted)</span>
                )}
              </div>
              {item.body && item.verb === 'commented on' && (
                <div className="text-xs text-ink-3 mt-0.5 line-clamp-2 italic">"{item.body}"</div>
              )}
              <div className="text-[10px] text-ink-3 mt-0.5">{relativeTime(item.createdAt)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MentionsTab({
  target,
  entries,
  comments,
  users,
}: {
  target: User
  entries: Entry[]
  comments: { id: string; userId: string; entryId: string; body: string; createdAt: string }[]
  users: User[]
}) {
  const found = useMemo(() => {
    type Item = {
      id: string
      where: 'comment' | 'caption'
      body: string
      actorId: string
      entryId: string
      createdAt: string
    }
    const out: Item[] = []
    comments.forEach((c) => {
      const ms = parseMentions(c.body, users)
      if (ms.some((m) => m.userId === target.id) && c.userId !== target.id) {
        out.push({
          id: `c-${c.id}`,
          where: 'comment',
          body: c.body,
          actorId: c.userId,
          entryId: c.entryId,
          createdAt: c.createdAt,
        })
      }
    })
    entries.forEach((e) => {
      const ms = parseMentions(e.caption, users)
      if (ms.some((m) => m.userId === target.id) && e.authorId !== target.id) {
        out.push({
          id: `e-${e.id}`,
          where: 'caption',
          body: e.caption,
          actorId: e.authorId,
          entryId: e.id,
          createdAt: e.createdAt,
        })
      }
    })
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [target.id, entries, comments, users])

  if (found.length === 0) {
    return (
      <EmptyState
        emoji="@"
        title={`No mentions of ${target.firstName} yet`}
        body="When someone @-tags this person in a comment or post, those show up here."
      />
    )
  }

  return (
    <div className="space-y-2">
      {found.map((item) => {
        const actor = users.find((u) => u.id === item.actorId)
        const entry = entries.find((e) => e.id === item.entryId)
        return (
          <div key={item.id} className="bg-surface border border-line rounded-md p-3">
            <div className="flex items-start gap-2.5">
              {actor && <UserAvatar user={actor} size="md" />}
              <div className="flex-1 min-w-0">
                <div className="text-base text-ink-2 leading-snug">
                  <Link to={`/u/${actor?.id}`} className="font-medium text-ink hover:underline">
                    {actor?.firstName ?? 'Someone'}
                  </Link>{' '}
                  mentioned {target.firstName} in a {item.where} on{' '}
                  {entry && (
                    <Link
                      to="/feed"
                      onClick={() =>
                        requestAnimationFrame(() =>
                          document.getElementById(`entry-${entry.id}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          }),
                        )
                      }
                      className="text-g-blue hover:underline"
                    >
                      {entry.title}
                    </Link>
                  )}
                </div>
                <div className="text-base text-ink-2 mt-1.5 line-clamp-3 italic border-l-2 border-line pl-2">
                  <MentionText body={item.body} />
                </div>
                <div className="text-[10px] text-ink-3 mt-1.5">{relativeTime(item.createdAt)}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AboutTab({ target, entries }: { target: User; entries: Entry[] }) {
  const my = entries.filter((e) => e.authorId === target.id)
  const tagBreakdown = my.reduce<Record<string, number>>((acc, e) => {
    acc[e.tag] = (acc[e.tag] ?? 0) + 1
    return acc
  }, {})
  const topTags = Object.entries(tagBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-md p-5">
        <h2 className="font-display text-lg mb-3">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-base">
          <Detail label="Full name" value={target.name} />
          <Detail label="Email" value={target.email} />
          <Detail label="Role" value={target.role === 'admin' ? 'Admin' : 'Member'} />
          <Detail
            label="Office"
            value={target.office === 'IN' ? 'India 🇮🇳' : target.office === 'SG' ? 'Singapore 🇸🇬' : '—'}
          />
          <Detail label="Team" value={target.team ?? '—'} />
          <Detail label="Joined" value={formatShortDate(target.createdAt)} />
          <Detail label="Last active" value={target.lastActiveAt ? relativeTime(target.lastActiveAt) : '—'} />
        </dl>
      </div>

      {topTags.length > 0 && (
        <div className="bg-surface border border-line rounded-md p-5">
          <h2 className="font-display text-lg mb-3">What {target.firstName} posts about</h2>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([t, n]) => (
              <span
                key={t}
                className="text-base px-3 py-1.5 rounded-pill bg-surface-soft text-ink-2"
              >
                <span className="font-medium text-ink">{t}</span>
                <span className="text-ink-3 ml-1">· {n}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-3">{label}</dt>
      <dd className="text-ink mt-0.5">{value}</dd>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
 *  EDIT MODAL — name, photo, cover, color, office, team
 * ──────────────────────────────────────────────────────────── */
function EditProfileModal({
  open,
  onClose,
  target,
  onSave,
}: {
  open: boolean
  onClose: () => void
  target: User
  onSave: (patch: Partial<User>) => void
}) {
  const [name, setName] = useState(target.name)
  const [office, setOffice] = useState<string>(target.office ?? '')
  const [team, setTeam] = useState<string>(target.team ?? '')
  const [avatarColor, setAvatarColor] = useState(target.avatarColor)
  const [avatarPhoto, setAvatarPhoto] = useState<string | undefined>(target.avatarPhoto)
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(target.coverPhoto)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(target.name)
      setOffice(target.office ?? '')
      setTeam(target.team ?? '')
      setAvatarColor(target.avatarColor)
      setAvatarPhoto(target.avatarPhoto)
      setCoverPhoto(target.coverPhoto)
      setError(null)
    }
  }, [open, target])

  const avatarFileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File, maxMb: number, setter: (dataUrl: string) => void) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please pick an image file.')
      return
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Image must be under ${maxMb} MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setter(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name cannot be empty.')
      return
    }
    const parts = trimmed.split(/\s+/)
    const firstName = parts[0]
    const initials =
      parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()

    onSave({
      name: trimmed,
      firstName,
      avatarInitials: initials,
      avatarColor,
      avatarPhoto,
      coverPhoto,
      office: (office as Office) || undefined,
      team: team || undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-5 sm:p-6">
        <h2 className="font-display text-xl mb-1">Edit profile</h2>
        <p className="text-xs text-ink-3 mb-4">
          Profile and cover photos are stored in your browser for this session. Cloud upload arrives with the backend.
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-base px-3 py-2 rounded-sm mb-3">
            {error}
          </div>
        )}

        {/* COVER */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-ink-3 mb-1.5">Cover photo</label>
          <div
            className="relative h-28 sm:h-32 rounded-md overflow-hidden border border-line bg-cover bg-center"
            style={
              coverPhoto
                ? { backgroundImage: `url(${coverPhoto})` }
                : {
                    background: `linear-gradient(135deg, ${avatarColor}33 0%, ${avatarColor}11 60%, var(--cream, #FAFAF7) 100%)`,
                  }
            }
          >
            <div className="absolute right-2 bottom-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                className="text-xs px-2.5 py-1 rounded-pill bg-ink/80 text-white backdrop-blur hover:bg-ink"
              >
                {coverPhoto ? 'Replace' : 'Upload'}
              </button>
              {coverPhoto && (
                <button
                  type="button"
                  onClick={() => setCoverPhoto(undefined)}
                  className="text-xs px-2.5 py-1 rounded-pill bg-ink/80 text-white backdrop-blur hover:bg-rose-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) readFile(f, 5, setCoverPhoto)
              e.target.value = ''
            }}
          />
        </div>

        {/* AVATAR */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-ink-3 mb-1.5">Profile photo</label>
          <div className="flex items-center gap-3">
            <div
              className="rounded-full p-0.5 bg-surface ring-1 ring-line"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}
            >
              {avatarPhoto ? (
                <img src={avatarPhoto} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full text-lg font-semibold"
                  style={(() => {
                    const m = avatarColor.match(/^#([0-9a-f]{6})$/i)
                    if (!m) return { backgroundColor: avatarColor, color: '#fff' }
                    const num = parseInt(m[1], 16)
                    const r = (num >> 16) & 0xff
                    const g = (num >> 8) & 0xff
                    const b = num & 0xff
                    const mix = (c: number) => Math.round(c + (255 - c) * 0.82)
                    return {
                      backgroundColor: `rgb(${mix(r)},${mix(g)},${mix(b)})`,
                      color: avatarColor,
                    }
                  })()}
                >
                  {(() => {
                    const parts = name.trim().split(/\s+/)
                    return parts.length === 1
                      ? parts[0].slice(0, 2).toUpperCase()
                      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                  })()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-sm border border-line-strong hover:bg-surface-soft"
              >
                {avatarPhoto ? 'Replace photo' : 'Upload photo'}
              </button>
              {avatarPhoto && (
                <button
                  type="button"
                  onClick={() => setAvatarPhoto(undefined)}
                  className="text-xs px-3 py-1.5 rounded-sm border border-line text-ink-3 hover:text-rose-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) readFile(f, 2, setAvatarPhoto)
              e.target.value = ''
            }}
          />

          {/* Colour swatches — used as fallback when no photo */}
          <div className="mt-3">
            <p className="text-[10px] text-ink-3 mb-1.5">
              Accent colour {avatarPhoto ? '(used when your photo isn\'t shown)' : '(used in your avatar + cover)'}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  aria-label={`Color ${c}`}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition',
                    avatarColor === c ? 'border-ink scale-110' : 'border-transparent hover:scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* NAME */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-ink-3 mb-1.5">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue"
          />
          <p className="text-[10px] text-ink-3 mt-1">
            First word becomes your @mention handle — currently{' '}
            <span className="text-ink-2 font-medium">@{name.trim().split(/\s+/)[0] || 'firstname'}</span>
          </p>
        </div>

        {/* OFFICE + TEAM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1.5">Office</label>
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="w-full text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue"
            >
              <option value="">Choose office</option>
              {OFFICES.map((o) => (
                <option key={o} value={o}>{o === 'IN' ? 'India' : 'Singapore'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-3 mb-1.5">Team</label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full text-md px-3 py-2 rounded-sm border border-line bg-surface outline-none focus:border-g-blue"
            >
              <option value="">Choose team</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-line text-base"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-sm bg-g-blue text-white text-base font-medium hover:bg-g-blue-d"
          >
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  )
}

function EmptyState({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-3xl">{emoji}</div>
      <h3 className="font-display text-lg mt-2 text-ink">{title}</h3>
      <p className="text-base text-ink-3 mt-1">{body}</p>
    </div>
  )
}
