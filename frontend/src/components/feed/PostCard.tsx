import { useRef } from 'react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import TagChip from '@/components/ui/TagChip'
import ContributorAvatars from './ContributorAvatars'
import CommentRow, { type CommentRowHandle } from './CommentRow'
import MentionText from './MentionText'
import { cn } from '@/lib/cn'
import type { Entry } from '@/types'
import { formatShortDate } from '@/lib/format'

interface Props {
  entry: Entry
  onOpenPhoto: (entry: Entry) => void
}

export default function PostCard({ entry, onOpenPhoto }: Props) {
  const { hasReaction, toggleReaction } = useStore()
  const { currentUser } = useAuth()
  const commentRowRef = useRef<CommentRowHandle>(null)

  const liked = currentUser ? hasReaction(entry.id, currentUser.id, 'like') : false
  const hero = entry.photos.find((p) => p.id === entry.heroPhotoId) ?? entry.photos[0]
  const moreCount = entry.photos.length - 1

  return (
    <article id={`entry-${entry.id}`} className="bg-surface border border-line rounded-lg overflow-hidden mb-4 scroll-mt-24">
      {/* 4-colour Google stripe */}
      <div className="google-stripe">
        <span /><span /><span /><span />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-ink leading-tight">{entry.title}</h3>
          <div className="text-xs text-ink-3 mt-1">
            {entry.eventName ? `${entry.eventName} · ` : ''}
            {entry.eventDate ? formatShortDate(entry.eventDate) : ''}
          </div>
        </div>
        <TagChip tag={entry.tag} />
      </div>

      {/* Hero media (photo OR video) with optional +N overlay */}
      {hero && hero.kind === 'video' ? (
        <div className="relative bg-black">
          <video
            src={hero.url}
            poster={hero.thumbUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[440px] bg-black"
          />
          {moreCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenPhoto(entry)}
              className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-pill hover:bg-black/80"
            >
              +{moreCount} more
            </button>
          )}
        </div>
      ) : hero ? (
        <button
          type="button"
          onClick={() => onOpenPhoto(entry)}
          className="block w-full relative group"
        >
          <img
            src={hero.url}
            alt={hero.label ?? entry.title}
            className="w-full max-h-[440px] object-cover group-hover:scale-[1.01] transition"
          />
          {moreCount > 0 && (
            <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-pill">
              +{moreCount} more
            </span>
          )}
        </button>
      ) : null}

      {/* Caption */}
      <p className="px-4 pt-3 pb-2 text-base text-ink-2 leading-relaxed">
        <MentionText body={entry.caption} />
      </p>

      {/* Reaction summary */}
      <div className="px-4 pb-2 text-xs text-ink-3">
        ❤️ {entry.likeCount} {entry.likeCount === 1 ? 'reaction' : 'reactions'} &middot; 💬 {entry.commentCount} {entry.commentCount === 1 ? 'comment' : 'comments'}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-line flex-wrap">
        <button
          type="button"
          onClick={() => currentUser && toggleReaction(entry.id, currentUser.id, 'like')}
          className={cn(
            'flex items-center gap-1 text-sm px-2 py-1 rounded-sm transition',
            liked ? 'text-g-red' : 'text-ink-3 hover:bg-surface-soft',
          )}
        >
          <span aria-hidden>{liked ? '♥' : '♡'}</span>
          <span>Like</span>
        </button>
        <button
          type="button"
          onClick={() => commentRowRef.current?.focus()}
          className="text-sm text-ink-3 hover:bg-surface-soft px-2 py-1 rounded-sm"
        >
          💬 Comment
        </button>
        <ContributorAvatars
          ids={entry.contributorIds}
          label="contributed"
          modalTitle="Contributors"
          subject={entry.title}
        />
      </div>

      <CommentRow ref={commentRowRef} entryId={entry.id} />
    </article>
  )
}
