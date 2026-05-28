/**
 * Thin localStorage wrappers used to survive page refreshes in mock mode.
 * All writes are best-effort — quota errors are caught.
 *
 * Bump the `V` constants when changing persisted shapes so older payloads
 * are ignored instead of crashing.
 */

const STATE_KEY = 'sapac:state:v1'
const AUTH_KEY = 'sapac:auth:userId:v1'

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export function loadJSON<T>(key: string): T | null {
  if (!isStorageAvailable()) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveJSON(key: string, value: unknown): boolean {
  if (!isStorageAvailable()) return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  if (!isStorageAvailable()) return
  try {
    localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}

export const KEYS = {
  state: STATE_KEY,
  auth: AUTH_KEY,
}

/** Wipe everything we've persisted — handy dev affordance + sign-out option. */
export function clearAllPersisted(): void {
  removeKey(STATE_KEY)
  removeKey(AUTH_KEY)
}
