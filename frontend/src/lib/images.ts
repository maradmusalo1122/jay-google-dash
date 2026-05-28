/**
 * Reliable seeded placeholder images via picsum.photos.
 * Same `seed` = same image across reloads, so the mock feed feels stable.
 */
export function photoUrl(seed: string, w = 1200, h = 800): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

export function thumbUrl(seed: string): string {
  return photoUrl(seed, 480, 360)
}
