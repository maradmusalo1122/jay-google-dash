# NBS SAPAC Chronicle

Internal web app for the NBS SAPAC team (~60 people, India + Singapore).
Browser-only, fully responsive. React frontend + Node/Express backend + Postgres.

See **[PLAN.md](./PLAN.md)** for the full build plan, data model, and design system.

## Repo layout

```
frontend/         Vite + React + TS + Tailwind  — the web app
backend/          Express + TS + Prisma + Postgres — the API
render.yaml       Render deployment config (backend)
PLAN.md           Build plan (living doc)
prototype_*.html  Original prototype reference
```

## Run locally

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env             # fill in DATABASE_URL + DIRECT_URL (Neon)
npx prisma generate
npx prisma migrate deploy        # apply schema to your DB
npm run seed                     # populate with demo data
npm run dev                      # → http://localhost:4000
```

### 2. Frontend
```bash
cd frontend
npm install
# VITE_API_URL stays empty for local — the dev server proxies /api to localhost:4000
npm run dev                      # → http://localhost:5173
```

Visit `http://localhost:5173`. Use the **Dev shortcuts** on the login page to sign in as Abhishek/Priya/Tina without setting up real Google OAuth.

## Live deployment

### Database — Neon (already set up)
The project lives on Neon Postgres (Singapore region). Connection strings are in `backend/.env` (gitignored). If you ever rotate them, reset via the Neon dashboard → Connect button → Reset password.

### Frontend — Vercel
Already deployed:
1. Vercel → Add Project → import this repo
2. **Root Directory = `frontend`**
3. Framework: Vite (auto)
4. Add env var: **`VITE_API_URL`** = your Render backend URL (set after backend is live)
5. Deploy. `frontend/vercel.json` already handles SPA routing.

### Backend — Render
1. Render → New → **Blueprint** → connect this repo → Render reads `render.yaml`
2. Render proposes one service: `sapac-chronicle-api`
3. Fill the two `sync: false` env vars from Neon:
   - `DATABASE_URL` — the **pooled** connection string
   - `DIRECT_URL` — the **direct** connection string (same URL minus `-pooler`)
4. Click **Apply** — first build takes ~3 min, then auto-deploys on every push to `main`
5. Once live, grab the Render URL (eg `https://sapac-chronicle-api.onrender.com`) and:
   - Set `VITE_API_URL` on Vercel to that URL
   - Set `APP_ORIGIN` on Render to your Vercel URL (for CORS)
   - Redeploy both

## Add real Google OAuth (when ready)

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth 2.0 Client**
2. Type: Web application
3. Authorized redirect URI: `https://<your-render-url>/api/auth/google/callback`
4. Copy Client ID + Secret
5. On Render, set env vars:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` = same as above
6. Optional: set `ALLOW_DEV_SIGNIN=false` to disable the dev shortcuts in production
