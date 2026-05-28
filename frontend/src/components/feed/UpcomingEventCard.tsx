import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import TagChip from '@/components/ui/TagChip'
import UserAvatar from '@/components/ui/UserAvatar'
import ContributorAvatars from './ContributorAvatars'
import CommentRow from './CommentRow'
import PeopleListModal from './PeopleListModal'
import MentionText from './MentionText'
import { cn } from '@/lib/cn'
import type { Entry, ReactionType, User } from '@/types'
import { countdownLabel, formatNameList, formatShortDate } from '@/lib/format'

interface Props {
  entry: Entry
  onOpenPhoto: (entry: Entry) => void
  onShareLinkedIn: (entry: Entry) => void
}

export default function UpcomingEventCard({ entry, onOpenPhoto, onShareLinkedIn }: Props) {
  const { hasReaction, toggleReaction, reactions, getUser } = useStore()
  const { currentUser } = useAuth()
  const [peopleModal, setPeopleModal] = useState<{ title: string; users: User[] } | null>(null)

  const going = currentUser ? hasReaction(entry.id, currentUser.id, 'going') : false
  const interested = currentUser ? hasReaction(entry.id, currentUser.id, 'interested') : false
  const hero = entry.photos.find((p) => p.id === entry.heroPhotoId) ?? entry.photos[0]
  const isPast = entry.eventDate ? new Date(entry.eventDate) < new Date() : false

  const rsvpUsers = (type: ReactionType): User[] =>
    reactions
      .filter((r) => r.entryId === entry.id && r.type === type)
      .map((r) => getUser(r.userId))
      .filter((u): u is User => !!u)

  const goingUsers = rsvpUsers('going')
  const interestedUsers = rsvpUsers('interested')

  return (
    <article id={`entry-${entry.id}`} className="bg-surface border border-line rounded-lg overflow-hidden mb-4 ring-1 ring-g-yellow/30 scroll-mt-24">
      {/* Distinct upcoming-event header (no Google stripe) */}
      <div className="bg-gradient-to-r from-amber-50 to-white px-4 py-2.5 flex items-center justify-between gap-2 border-b border-amber-100">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          UPCOMING EVENT
        </span>
        {entry.eventDate && !isPast && (
          <span className="text-xs text-amber-800 font-medium">{countdownLabel(entry.eventDate)}</span>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-ink leading-tight">{entry.title}</h3>
          {entry.eventDate && (
            <div className="text-xs text-ink-3 mt-1">
              {formatShortDate(entry.eventDate)}
              {entry.venue && (
                <>
                  {' · '}
                  <span>{entry.venue}</span>
                </>
              )}
            </div>
          )}
          {entry.venueMapUrl && (
            <a
              href={entry.venueMapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-g-blue hover:underline mt-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
              </svg>
              Open in Google Maps
            </a>
          )}
        </div>
        <TagChip tag={entry.tag} />
      </div>

      {/* Hero photo */}
      {hero && (
        <button
          type="button"
          onClick={() => onOpenPhoto(entry)}
          className="block w-full"
        >
          <img
            src={hero.url}
            alt={hero.label ?? entry.title}
            className="w-full max-h-[360px] object-cover"
          />
        </button>
      )}

      {/* Caption */}
      <p className="px-4 pt-3 pb-2 text-base text-ink-2 leading-relaxed">
        <MentionText body={entry.caption} />
      </p>

      {/* RSVP summary */}
      <div className="px-4 pb-2 text-xs text-ink-3">
        ✋ {entry.goingCount} going &middot; 👀 {entry.interestedCount} interested &middot; 💬 {entry.commentCount} {entry.commentCount === 1 ? 'comment' : 'comments'}
      </div>

      {/* Attendee rows — clickable to open the full list */}
      {(goingUsers.length > 0 || interestedUsers.length > 0) && (
        <div className="px-4 pb-3 space-y-1.5">
          {goingUsers.length > 0 && (
            <AttendeeRow
              label="Going"
              users={goingUsers}
              accentColor="#34A853"
              onOpenAll={() =>
                setPeopleModal({ title: `Going to ${entry.title}`, users: goingUsers })
              }
            />
          )}
          {interestedUsers.length > 0 && (
            <AttendeeRow
              label="Interested"
              users={interestedUsers}
              accentColor="#FBBC05"
              onOpenAll={() =>
                setPeopleModal({ title: `Interested in ${entry.title}`, users: interestedUsers })
              }
            />
          )}
        </div>
      )}

      {/* Actions — RSVP + LinkedIn */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-line flex-wrap">
        <button
          type="button"
          onClick={() => currentUser && toggleReaction(entry.id, currentUser.id, 'going')}
          className={cn(
            'text-sm px-3 py-1.5 rounded-pill border font-medium transition',
            going
              ? 'bg-g-green text-white border-g-green'
              : 'bg-surface text-ink border-line-strong hover:border-g-green hover:text-g-green',
          )}
        >
          {going ? '✓ Going' : 'Going'}
        </button>
        <button
          type="button"
          onClick={() => currentUser && toggleReaction(entry.id, currentUser.id, 'interested')}
          className={cn(
            'text-sm px-3 py-1.5 rounded-pill border font-medium transition',
            interested
              ? 'bg-g-yellow text-ink border-g-yellow'
              : 'bg-surface text-ink-3 border-line-strong hover:border-g-yellow hover:text-ink',
          )}
        >
          {interested ? '★ Interested' : 'Interested'}
        </button>
        <button
          type="button"
          onClick={() => onShareLinkedIn(entry)}
          className="text-sm px-3 py-1.5 rounded-pill border border-line-strong text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] font-medium transition inline-flex items-center gap-1.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.7a1.8 1.8 0 110-3.6 1.8 1.8 0 010 3.6zM20 19h-3v-5.6c0-3.4-4-3.1-4 0V19h-3V8h3v1.8c1.4-2.6 7-2.8 7 2.5V19z"/>
          </svg>
          Share to LinkedIn
        </button>
        <ContributorAvatars
          ids={entry.contributorIds}
          label="organising"
          modalTitle="Organisers"
          subject={entry.title}
        />
      </div>

      <CommentRow entryId={entry.id} />

      <PeopleListModal
        open={!!peopleModal}
        onClose={() => setPeopleModal(null)}
        title={peopleModal?.title ?? ''}
        users={peopleModal?.users ?? []}
      />
    </article>
  )
}

interface AttendeeRowProps {
  label: string
  users: User[]
  accentColor: string
  onOpenAll: () => void
}

function AttendeeRow({ label, users, accentColor, onOpenAll }: AttendeeRowProps) {
  const MAX_AVATARS = 4
  const visible = users.slice(0, MAX_AVATARS)
  const overflow = users.length - visible.length
  const namesText = formatNameList(users.map((u) => u.firstName))
  return (
    <button
      type="button"
      onClick={onOpenAll}
      title={`View all ${users.length} ${label.toLowerCase()}`}
      className="flex items-center gap-2 min-w-0 flex-wrap text-left w-full hover:bg-surface-soft rounded-md px-1.5 -mx-1.5 py-1 transition cursor-pointer"
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-pill flex-shrink-0"
        style={{ color: accentColor, backgroundColor: `${accentColor}15` }}
      >
        {label}
      </span>
      <div className="flex items-center flex-shrink-0">
        {visible.map((u, i) => (
          <span key={u.id} style={{ marginLeft: i === 0 ? 0 : -6 }}>
            <UserAvatar user={u} size="sm" ring />
          </span>
        ))}
        {overflow > 0 && (
          <span
            style={{ marginLeft: -6 }}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-soft text-ink-3 text-[9px] font-semibold leading-none border-2 border-surface"
          >
            +{overflow}
          </span>
        )}
      </div>
      <span className="text-xs text-ink-2 min-w-0 break-words">
        {namesText} <span className="text-ink-3">· View all</span>
      </span>
    </button>
  )
}
