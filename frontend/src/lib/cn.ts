/**
 * Tiny classname joiner — no clsx dependency needed at this scale.
 * Filters out falsy values so `cn('a', cond && 'b')` works.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
