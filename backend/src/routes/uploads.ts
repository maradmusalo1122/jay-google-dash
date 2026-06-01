/**
 * /api/uploads — accepts a photo or video file, saves it to disk, returns a URL.
 *
 *  POST /api/uploads        multipart, field name "file"
 *  → { url, thumbUrl?, kind, width?, height?, duration? }
 *
 * Storage layout (configurable via UPLOAD_DIR / UPLOAD_PUBLIC_PATH):
 *   {UPLOAD_DIR}/2026/06/<cuid>.<ext>
 *   served under {UPLOAD_PUBLIC_PATH}/2026/06/<cuid>.<ext>  (by nginx in prod)
 *
 * Image files are passed through sharp:
 *   - resized to max 1920px on the long edge (only if larger)
 *   - re-encoded as JPEG @ 0.85 quality (or WebP if already webp)
 *   - thumb generated at 480px max long edge
 *
 * Videos are saved as-is. Thumbnails would need ffmpeg — skipped for now.
 */
import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { requireAuth } from '../middleware/auth'

const router = Router()

// ── Config ──────────────────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/nbschronicle-uploads'
const UPLOAD_PUBLIC_PATH = process.env.UPLOAD_PUBLIC_PATH || '/uploads'

const PHOTO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])
const VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov (iPhone)
  'video/x-m4v',
])

const PHOTO_MAX_BYTES = 25 * 1024 * 1024 // 25 MB before resize
const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100 MB

// Use memory storage so we can stream → sharp without a temp file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX_BYTES },
})

// ── Helpers ─────────────────────────────────────────────────────────────
function cuid(): string {
  // small cuid-ish — no external dep
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  )
}

function monthFolder(): string {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function ensureDir(p: string) {
  if (!existsSync(p)) await mkdir(p, { recursive: true })
}

// ── Route ───────────────────────────────────────────────────────────────
router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'no_file' })

  const isPhoto = PHOTO_MIME.has(file.mimetype)
  const isVideo = VIDEO_MIME.has(file.mimetype)

  if (!isPhoto && !isVideo) {
    return res.status(415).json({
      error: 'unsupported_type',
      detail: `${file.mimetype} not allowed. Use jpg/png/webp/gif or mp4/webm/mov.`,
    })
  }

  if (isPhoto && file.size > PHOTO_MAX_BYTES) {
    return res.status(413).json({ error: 'photo_too_large', detail: 'Max 25 MB before resize' })
  }
  if (isVideo && file.size > VIDEO_MAX_BYTES) {
    return res.status(413).json({ error: 'video_too_large', detail: 'Max 100 MB' })
  }

  try {
    const folder = monthFolder()
    const diskFolder = join(UPLOAD_DIR, folder)
    await ensureDir(diskFolder)

    const id = cuid()

    if (isPhoto) {
      // Pick the encoder: keep webp as webp, everything else → jpeg
      const isWebp = file.mimetype === 'image/webp'
      const ext = isWebp ? 'webp' : 'jpg'
      const filename = `${id}.${ext}`
      const thumbFilename = `${id}.thumb.${ext}`

      // Probe metadata for width/height + EXIF auto-rotate
      const pipeline = sharp(file.buffer, { failOn: 'none' }).rotate()
      const meta = await pipeline.metadata()

      // Full image: resize if too big
      const full = pipeline.clone().resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      const fullBuf = isWebp
        ? await full.webp({ quality: 85 }).toBuffer()
        : await full.jpeg({ quality: 85, mozjpeg: true }).toBuffer()

      // Thumb
      const thumb = pipeline.clone().resize({
        width: 480,
        height: 480,
        fit: 'inside',
        withoutEnlargement: true,
      })
      const thumbBuf = isWebp
        ? await thumb.webp({ quality: 80 }).toBuffer()
        : await thumb.jpeg({ quality: 80, mozjpeg: true }).toBuffer()

      await writeFile(join(diskFolder, filename), fullBuf)
      await writeFile(join(diskFolder, thumbFilename), thumbBuf)

      // Compute final dimensions (after rotate, before resize result — easier just to use input meta + clamp)
      const longEdge = 1920
      let width = meta.width || 0
      let height = meta.height || 0
      if (width > longEdge || height > longEdge) {
        const scale = longEdge / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      return res.json({
        kind: 'photo',
        url: `${UPLOAD_PUBLIC_PATH}/${folder}/${filename}`,
        thumbUrl: `${UPLOAD_PUBLIC_PATH}/${folder}/${thumbFilename}`,
        width,
        height,
      })
    }

    // Video — save as-is. We could transcode + extract a poster frame with ffmpeg,
    // but that's a much heavier dependency. For MVP, browsers handle mp4/webm fine
    // and the <video> element renders the first frame as a poster on its own.
    const extMap: Record<string, string> = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/x-m4v': 'm4v',
    }
    const ext = extMap[file.mimetype] || 'mp4'
    const filename = `${id}.${ext}`
    await writeFile(join(diskFolder, filename), file.buffer)

    return res.json({
      kind: 'video',
      url: `${UPLOAD_PUBLIC_PATH}/${folder}/${filename}`,
      // No thumbUrl — frontend can use the first frame via <video preload>
    })
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[uploads] error', e)
    return res.status(500).json({ error: 'upload_failed', detail: e?.message || 'unknown' })
  }
})

export default router
