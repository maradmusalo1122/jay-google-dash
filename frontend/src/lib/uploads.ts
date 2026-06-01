/**
 * Upload a single photo or video file to the backend.
 * Returns the server-side URL + metadata that can go straight into a Photo record.
 *
 * Use:
 *   const media = await uploadMedia(file, { onProgress: p => setPct(p) })
 *   // media = { kind, url, thumbUrl?, width?, height? }
 */

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export interface UploadedMedia {
  kind: 'photo' | 'video'
  url: string
  thumbUrl?: string
  width?: number
  height?: number
  duration?: number
}

export interface UploadOpts {
  onProgress?: (pct: number) => void
  signal?: AbortSignal
}

export async function uploadMedia(file: File, opts: UploadOpts = {}): Promise<UploadedMedia> {
  const form = new FormData()
  form.append('file', file)

  // Use XHR so we can hook into upload-progress events (fetch doesn't expose them yet)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/api/uploads`)
    xhr.withCredentials = true
    if (xhr.upload && opts.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) opts.onProgress!(Math.round((e.loaded / e.total) * 100))
      })
    }
    xhr.addEventListener('load', () => {
      try {
        const body = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as UploadedMedia)
        else reject(new Error(body?.error || `HTTP ${xhr.status}`))
      } catch (e) {
        reject(e)
      }
    })
    xhr.addEventListener('error', () => reject(new Error('network_error')))
    xhr.addEventListener('abort', () => reject(new Error('aborted')))
    if (opts.signal) {
      opts.signal.addEventListener('abort', () => xhr.abort())
    }
    xhr.send(form)
  })
}
