# NBS SAPAC Chronicle

Internal web app for the NBS SAPAC team (~60 people, India + Singapore).
Browser-only, fully responsive. React frontend + Node backend.

See **[PLAN.md](./PLAN.md)** for the full build plan, data model, and design system.

## Repo layout

```
frontend/   Vite + React + TS + Tailwind  — the web app
backend/    Express + TS + Prisma + Postgres — the API
PLAN.md     Build plan (living doc)
prototype_*.html  Original prototype reference
```

## Run locally

### Frontend
```bash
cd frontend
npm install
npm run dev
# opens http://localhost:5173
```

### Backend
```bash
cd backend
npm install
cp .env.example .env   # then fill in DATABASE_URL, GOOGLE_CLIENT_ID, etc.
npx prisma generate
npm run dev
# opens http://localhost:4000
```

## Build progress

This is being built page-by-page following the plan. Current state: foundation + Login + Waiting pages.
