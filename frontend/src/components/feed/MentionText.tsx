import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { parseMentions } from '@/lib/mentions'

interface Props {
  body: string
  className?: string
}

/**
 * Renders `body` with `@firstName` tokens replaced by clickable, styled chips
 * that link to the mentioned user's profile (/u/:id). Anything not resolvable
 * to an approved user is left as plain text.
 */
export default function MentionText({ body, className }: Props) {
  const { users } = useStore()
  const mentions = parseMentions(body, users)

  if (mentions.length === 0) {
    return <span className={className}>{body}</span>
  }

  const parts: React.ReactNode[] = []
  let cursor = 0

  mentions.forEach((m, i) => {
    if (m.start > cursor) {
      parts.push(<Fragment key={`t${i}`}>{body.slice(cursor, m.start)}</Fragment>)
    }
    const user = users.find((u) => u.id === m.userId)
    parts.push(
      <Link
        key={`m${i}`}
        to={`/u/${m.userId}`}
        className="text-g-blue-d bg-g-blue-l rounded px-1 font-medium hover:underline hover:bg-[#D5E3FB] transition no-underline"
        title={user ? `${user.name} — view profile` : `@${m.firstName}`}
      >
        @{m.firstName}
      </Link>,
    )
    cursor = m.end
  })

  if (cursor < body.length) {
    parts.push(<Fragment key="tail">{body.slice(cursor)}</Fragment>)
  }

  return <span className={className}>{parts}</span>
}
