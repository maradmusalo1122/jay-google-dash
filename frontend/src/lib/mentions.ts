import type { User } from '@/types'

/**
 * Mention pipeline — three text forms:
 *
 *   ┌──────────────┐   serialize    ┌────────────────────┐    parse    ┌──────────────┐
 *   │ display form │ ─────────────> │ stored form        │ ──────────> │ render parts │
 *   │ "Hi @Abhi"   │ <───────────── │ "Hi <@u-abhishek>" │             │ chip + text  │
 *   └──────────────┘   deserialize  └────────────────────┘             └──────────────┘
 *
 * The stored form uses a stable `<@userId>` token so it survives renames.
 * The legacy `@firstname` form (from seed data + before this change) is still
 * understood at parse time, so nothing breaks if it's lying around.
 */

const ID_TOKEN_RE = /<@([\w-]+)>/g
// `@Firstname` — must be at start of string or preceded by whitespace.
const LEGACY_HANDLE_RE = /(^|\s)@([A-Za-z][\w-]*)/g

export interface MentionMatch {
  userId: string
  firstName: string  // resolved at PARSE time so it reflects the user's current name
  start: number      // offset in the source string passed to parseMentions
  end: number
}

/**
 * Parse mentions from any stored body. Recognises both:
 *   - <@u-abhishek>   (canonical token, rename-safe)
 *   - @Abhishek       (legacy plain text, resolved by current firstName)
 *
 * Returns the *current* firstName for each, so rendering automatically picks
 * up any rename.
 */
export function parseMentions(body: string, users: User[]): MentionMatch[] {
  const matches: MentionMatch[] = []
  const re = /<@([\w-]+)>|(^|\s)@([A-Za-z][\w-]*)/g
  for (let m = re.exec(body); m !== null; m = re.exec(body)) {
    if (m[1]) {
      // <@id>
      const id = m[1]
      const user = users.find((u) => u.id === id)
      if (user) {
        matches.push({
          userId: user.id,
          firstName: user.firstName,
          start: m.index,
          end: m.index + m[0].length,
        })
      }
    } else if (m[3]) {
      // legacy @firstname — m[2] is the leading whitespace (or empty)
      const prefix = m[2] ?? ''
      const handle = m[3]
      const handleStart = m.index + prefix.length
      const user = users.find(
        (u) => u.firstName.toLowerCase() === handle.toLowerCase() && u.status === 'approved',
      )
      if (user) {
        matches.push({
          userId: user.id,
          firstName: user.firstName,
          start: handleStart,
          end: handleStart + 1 + handle.length, // include the '@' + handle
        })
      }
    }
  }
  return matches
}

/**
 * Convert displayed `@firstname` mentions into stable `<@id>` tokens.
 * Anything that doesn't resolve to a known approved user is left as-is.
 */
export function serializeMentions(displayText: string, users: User[]): string {
  return displayText.replace(LEGACY_HANDLE_RE, (match, prefix: string, name: string) => {
    const user = users.find(
      (u) => u.firstName.toLowerCase() === name.toLowerCase() && u.status === 'approved',
    )
    if (!user) return match
    return `${prefix}<@${user.id}>`
  })
}

/**
 * Convert stored `<@id>` tokens back to display `@firstname` form, using each
 * user's *current* firstName. Used when populating the input for editing.
 */
export function deserializeMentions(storedText: string, users: User[]): string {
  return storedText.replace(ID_TOKEN_RE, (match, id: string) => {
    const user = users.find((u) => u.id === id)
    if (!user) return match
    return `@${user.firstName}`
  })
}

/**
 * For the autocomplete dropdown: if the caret is mid-way through typing an
 * @mention, return the partial query (text between @ and caret) and the @ index.
 *
 *   "Hi @Ti|"   → { query: "Ti", start: 3 }
 *   "Hi @|"     → { query: "",   start: 3 }
 *   "email@x"   → null (no whitespace/start-of-string before @)
 */
export function getMentionTypeahead(
  body: string,
  cursor: number,
): { query: string; start: number } | null {
  let i = cursor - 1
  while (i >= 0) {
    const ch = body[i]
    if (ch === '@') {
      const prev = i > 0 ? body[i - 1] : ''
      if (prev && !/\s/.test(prev)) return null
      const query = body.slice(i + 1, cursor)
      if (/^[A-Za-z][\w-]*$|^$/.test(query)) {
        return { query, start: i }
      }
      return null
    }
    if (!/[\w-]/.test(ch)) return null
    i--
  }
  return null
}
