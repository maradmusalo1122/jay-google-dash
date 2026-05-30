/**
 * Tiny typed fetch wrapper.
 *
 * - Base URL from VITE_API_URL (falls back to /api for local Vite proxy)
 * - Always sends cookies (credentials: 'include') so the session cookie
 *   from /api/auth/* flows on subsequent requests
 * - Throws a structured error so callers can branch on status/code
 */

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  status: number
  code?: string
  detail?: unknown
  constructor(status: number, message: string, code?: string, detail?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.detail = detail
  }
}

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function request<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })

  let data: any = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const code = (data && typeof data === 'object' && data.error) || undefined
    const detail = (data && typeof data === 'object' && data.detail) || undefined
    throw new ApiError(res.status, `HTTP ${res.status} ${res.statusText}`, code, detail)
  }
  return data as T
}

export const api = {
  get: <T = unknown>(path: string, opts?: Omit<RequestOpts, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T = unknown>(path: string, opts?: Omit<RequestOpts, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}

/** Returns true if we have a backend URL configured (production mode). */
export const isLive = (): boolean => !!BASE || import.meta.env.PROD
