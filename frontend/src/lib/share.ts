import type { Entry } from '@/types'

/** Deep link that opens a specific post inside the app (signed-in teammates only). */
export function postUrl(id: string): string {
  return `${window.location.origin}/feed?post=${id}`
}

/**
 * Share a post. On mobile this opens the native share sheet (WhatsApp, Mail,
 * Messages, etc.). Where that's unavailable (most desktops), it copies the link.
 */
export async function sharePost(
  entry: Pick<Entry, 'id' | 'title'>,
): Promise<'shared' | 'copied' | 'failed' | 'cancelled'> {
  const url = postUrl(entry.id)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: entry.title, text: `${entry.title} — NBS SAPAC Chronicle`, url })
      return 'shared'
    } catch {
      return 'cancelled' // user dismissed the sheet
    }
  }
  return (await copyPostLink(entry.id)) ? 'copied' : 'failed'
}

export async function copyPostLink(id: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(postUrl(id))
    return true
  } catch {
    return false
  }
}
