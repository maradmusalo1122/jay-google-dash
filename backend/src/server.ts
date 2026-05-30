import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { attachUser } from './middleware/auth'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import quarterRoutes from './routes/quarters'
import entryRoutes, { publicRouter as publicEventRoutes } from './routes/entries'
import commentRoutes from './routes/comments'
import reactionRoutes from './routes/reactions'
import notificationRoutes from './routes/notifications'

const app = express()
const PORT = Number(process.env.PORT ?? 4000)
const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:5173'

// CORS — supports comma-separated APP_ORIGIN for prod/preview/local.
const allowedOrigins = APP_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true) // same-origin / curl
      if (allowedOrigins.includes(origin)) return cb(null, true)
      // Allow any *.vercel.app preview deploy of the same project
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true)
      cb(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())
app.use(attachUser)

// Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'sapac-chronicle-backend',
    version: '0.2.0',
    time: new Date().toISOString(),
  })
})

// Public — no auth (used by /event/:slug LinkedIn share landing page)
app.use('/api/public/events', publicEventRoutes)

// Authenticated
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/quarters', quarterRoutes)
app.use('/api/entries', entryRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/reactions', reactionRoutes)
app.use('/api/notifications', notificationRoutes)

// 404
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[sapac] api listening on http://localhost:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`[sapac] cors allowed origins:`, allowedOrigins)
})
