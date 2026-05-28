import Avatar from './Avatar'
import type { User } from '@/types'

interface Props {
  user: Pick<User, 'avatarInitials' | 'avatarColor' | 'avatarPhoto'> & { name?: string; firstName?: string }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  className?: string
}

/**
 * Convenience wrapper around <Avatar> that pulls initials, colour, and photo
 * from a User object. Use this anywhere a user's avatar is shown so a future
 * profile-photo upload automatically propagates.
 */
export default function UserAvatar({ user, size = 'md', ring, className }: Props) {
  return (
    <Avatar
      initials={user.avatarInitials}
      color={user.avatarColor}
      photo={user.avatarPhoto}
      size={size}
      ring={ring}
      className={className}
    />
  )
}
