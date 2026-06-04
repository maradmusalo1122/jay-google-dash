import { useMemo, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import TagChip from '@/components/ui/TagChip'
import ContributorAvatars from './ContributorAvatars'
import CommentRow, { type CommentRowHandle } from './CommentRow'
import MentionText from './MentionText'
import PostMediaCarousel from './PostMediaCarousel'
import PostActions from './PostActions'
import Toast from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import type { Entry } from '@/types'
import { formatShortDate } from '@/lib/format'
import { sharePost } from '@/lib/share'

interface Props {
  entry: Entry
  onOpenPhoto: (entry: Entry, index?: number) => void
}

export default function PostCard({ entry, onOpenPhoto }: Props) {
  const { hasReaction, toggleReaction } = useStore()
  const { currentUser } = useAuth()
  const commentRowRef = useRef<CommentRowHandle>(null)
  const [toast, setToast] = useState<string | null>(null)

  const liked = currentUser ? hasReaction(entry.id, currentUser.id, 'like') : false

  const handleShare = async () => {
    const result = await sharePost(entry)
    if (result === 'copied') setToast('Link copied — paste it in WhatsApp, email, anywhere')
    else if (result === 'failed') setToast('Could not share. Try Copy link from the ⋯ menu.')
  }

  // Order photos with the hero first, then the rest by their stored order.
  const orderedPhotos = useMemo(() => {
    const list = [...entry.photos].sort((a, b) => a.order - b.order)
    const heroIdx = list.findIndex((p) => p.id === entry.heroPhotoId)
    if (heroIdx > 0) {
      const [h] = list.splice(heroIdx, 1)
      list.unshift(h)
    }
    return list
  }, [entry.photos, entry.heroPhotoId])

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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <TagChip tag={entry.tag} />
          <PostActions entry={entry} onNotify={setToast} />
        </div>
      </div>

      {/* Inline media carousel — swipe, arrows, dots, counter */}
      {orderedPhotos.length > 0 && (
        <PostMediaCarousel
          photos={orderedPhotos}
          title={entry.title}
          onOpenLightbox={(idx) => onOpenPhoto(entry, idx)}
        />
      )}

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
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-sm text-ink-3 hover:bg-surface-soft px-2 py-1 rounded-sm"
        >
          <span aria-hidden>↗</span>
          <span>Share</span>
        </button>
        <ContributorAvatars
          ids={entry.contributorIds}
          label="contributed"
          modalTitle="Contributors"
          subject={entry.title}
        />
      </div>

      <CommentRow ref={commentRowRef} entryId={entry.id} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </article>
  )
}
