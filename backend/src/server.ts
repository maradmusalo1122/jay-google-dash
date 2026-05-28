import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.PORT ?? 4000)
const ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: ORIGIN, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'sapac-chronicle-backend',
    version: '0.1.0',
    time: new Date().toISOString(),
  })
})

// ── Auth (stubs — real Google OAuth lands in next milestone) ─
app.get('/api/auth/me', (_req: Request, res: Response) => {
  res.status(401).json({ error: 'not_authenticated' })
})

// ── Boot ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[sapac] api listening on http://localhost:${PORT}`)
})
