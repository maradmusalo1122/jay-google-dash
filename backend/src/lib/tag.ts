import type { Tag as PrismaTag } from '@prisma/client'

/**
 * Tag has two faces:
 *   - Database / Prisma: snake_case enum keys (team_event, learning, ...)
 *   - JSON / Frontend display: human strings ("Team event", "Learning", ...)
 *
 * These helpers translate between them at the API boundary so the frontend
 * never has to know about the enum keys.
 */
export const DISPLAY_TAG: Record<PrismaTag, string> = {
  team_event: 'Team event',
  learning: 'Learning',
  team_win: 'Team win',
  external: 'External',
  life_outside: 'Life outside work',
  vibe: 'Just a vibe',
}

export const PRISMA_TAG = Object.fromEntries(
  Object.entries(DISPLAY_TAG).map(([k, v]) => [v, k]),
) as Record<string, PrismaTag>

export function toPrismaTag(display: string): PrismaTag | null {
  return PRISMA_TAG[display] ?? null
}

export function toDisplayTag(p: PrismaTag): string {
  return DISPLAY_TAG[p]
}
