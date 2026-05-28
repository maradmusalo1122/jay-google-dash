import { useState } from 'react'
import UserAvatar from '@/components/ui/UserAvatar'
import { useStore } from '@/lib/store'
import { formatNameList } from '@/lib/format'
import PeopleListModal from './PeopleListModal'

interface Props {
  ids: string[]
  label?: string
  /** Used as subtitle in the "View all" modal — usually the entry title. */
  subject?: string
  /** Title for the people modal. Defaults to capitalised `label`. */
  modalTitle?: string
}

const MAX_VISIBLE_AVATARS = 4

export default function ContributorAvatars({
  ids,
  label = 'contributed',
  subject,
  modalTitle,
}: Props) {
  const { getUser } = useStore()
  const [open, setOpen] = useState(false)
  const users = ids
    .map(getUser)
    .filter((u): u is NonNullable<ReturnType<typeof getUser>> => !!u)

  if (users.length === 0) return null

  const visibleAvatars = users.slice(0, MAX_VISIBLE_AVATARS)
  const overflow = users.length - visibleAvatars.length
  const namesText = formatNameList(users.map((u) => u.firstName))
  const finalModalTitle =
    modalTitle ?? (label.charAt(0).toUpperCase() + label.slice(1))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`View all (${users.length})`}
        className="flex items-center ml-auto gap-2 min-w-0 hover:bg-surface-soft rounded-pill px-1.5 -mx-1.5 py-0.5 transition cursor-pointer"
      >
        <div className="flex items-center flex-shrink-0">
          {visibleAvatars.map((u, i) => (
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
        <span className="text-xs text-ink-3 min-w-0 truncate">
          <span className="text-ink-2 font-medium">{namesText}</span> {label}
        </span>
      </button>

      <PeopleListModal
        open={open}
        onClose={() => setOpen(false)}
        title={finalModalTitle}
        subtitle={subject}
        users={users}
      />
    </>
  )
}
