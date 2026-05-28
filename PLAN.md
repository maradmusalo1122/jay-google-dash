# NBS SAPAC Chronicle — Build Plan

> Internal **web app** for the NBS SAPAC team (~60 people, India + Singapore, Google).
> Browser-only. **Fully responsive across mobile, tablet and desktop.** React frontend + Node backend. Designed strongly on the existing prototype theme.

---

## 1. Roles

| Role | Access |
|---|---|
| **Pending** | Signed in via Google, waiting for admin approval. Sees a waiting screen only. |
| **Member** | Full app side (Feed, Explore, Archive, Add Entry). Edit / delete own entries. RSVP, like, comment. Update own profile. |
| **Admin** | Everything a Member can do **plus** the Dashboard (User List, Activity Log, Edit Content Posted, Approve New Registration). |

---

## 2. Page inventory

### Public (no auth)
1. **Login** — `Continue with Google` + `@google.com only` notice.
2. **Public Event Landing Page** — `/event/:slug` — title, date, venue + Google Map link, hero image, OG meta tags. No internal data. This is the URL the LinkedIn share button uses.

### Pending Approval
3. **Waiting page** — "Your access is being reviewed. We'll let you know."

### Member side
4. **Chronicle Feed** — stats strip + entries for the live quarter. Two card types interleave by date:
   - **Post card** (after-event) — Google 4-colour stripe, hero image, caption, tag, like/comment/contributors.
   - **Upcoming Event card** — visually distinct: calendar icon header instead of stripe, "Upcoming" badge, date + venue + Google Map link, countdown, **RSVP row (Going / Interested)** + comments. **Share to LinkedIn** button.
5. **Explore** — search + filter pills + thumbnail grid + photo modal.
6. **Archive** — accordion of past quarters with mini-wall + mini stats.
7. **Add Entry** — chooser → **Post** OR **Upcoming Event** flow.
   - Post flow (matches prototype): photos, week/date, caption, tag, contributors.
   - Upcoming Event flow: title, event date, venue + map URL, tag, hero image, caption.
8. **Entry detail / photo modal** — title, date, big photo, tag, caption.
9. **User profile (own)** — name, avatar, office (IN/SG), team. Editable. Their post history.

### Admin Dashboard
10. **Dashboard home** — counts of pending users, posts this week, recent activity preview.
11. **User List** — table of all members; search; columns name / email / office / team / role / status / last active. Row actions: promote to admin, disable.
12. **Activity Log** — append-only timeline. Filter by actor, action type, date range. Includes `post_edited` so admins can audit who changed what (this is the only place edits are surfaced).
13. **Edit Content Posted** — moderation feed: every entry with edit / delete actions. No "edited" badge on the public card.
14. **Approve New Registration** — pending users queue, one-click Approve / Reject.

---

## 3. Data model

```
User           id, google_id, email, name, first_name, avatar_initials,
               avatar_color, office (nullable), team (nullable),
               role (member|admin), status (pending|approved|disabled),
               created_at, last_active_at

Quarter        id, label ("Q2 '26"), start_date, end_date,
               status (live|archived)

Entry          id, quarter_id, author_id,
               type (post | upcoming_event),
               title, event_name, event_date, venue, venue_map_url,
               tag, caption,
               hero_photo_id, contributor_ids[],
               like_count, comment_count, going_count, interested_count,
               linkedin_public_slug (nullable),
               created_at, deleted_at

Photo          id, entry_id, url, thumb_url, label, order

Reaction       entry_id, user_id, type (like | going | interested),
               created_at        — unique (entry_id, user_id, type)

Comment        id, entry_id, user_id, body, created_at, deleted_at

ActivityLog    id, actor_id, action, target_type, target_id,
               metadata (jsonb), created_at
```

`tag` enum: `Team event`, `Learning`, `Team win`, `External`, `Life outside work`, `Just a vibe`.

---

## 4. Key flows

**Sign in** → Google OAuth (`hd=google.com`) → backend verifies → if new user, create with `status=pending` and show waiting screen. → Admin approves from Dashboard → user can now use the app.

**Post creation** → upload photos to object storage → form submit → entry created with `type=post`, photos linked.

**Upcoming Event creation** → form submit → entry created with `type=upcoming_event`, `event_date` set. Appears on feed with distinct styling and RSVP row. **Share to LinkedIn** button visible (mode-dependent — see below).

**Auto-convert** → Daily cron at 00:00 IST scans `type=upcoming_event AND event_date < today` → flips to `type=post`. Silent — no notification to RSVPs. The post still belongs to the original author; next time they open it, they see a contextual "Add photos and a recap" prompt on their own post. RSVPs are preserved as contributor candidates.

**Quarter rollover** → On the first day of a new calendar quarter, a cron job creates the new Quarter record with `status=live` and flips the previous quarter to `status=archived`. Fully automatic.

**Edit** → Author OR admin can edit any field. Writes to ActivityLog. No badge on the public card.

**LinkedIn share** — every Upcoming Event has a public page at `/event/:slug` with OpenGraph meta tags (title, description, hero image, canonical URL). The **Share to LinkedIn** button opens `linkedin.com/sharing/share-offsite/?url=<event-url>` → LinkedIn scrapes the OG tags and renders a rich preview card on the user's post. One click, no LinkedIn OAuth required, and no internal data is exposed.

---

## 5. MVP vs v1.1

**MVP (v1.0)**
- Auth + pending approval
- Feed, Explore (basic grid; search/filter UI present but may not query yet), Archive
- Post create / edit / delete (up to 10 photos; feed card shows hero + "+N more" badge → opens gallery modal)
- Upcoming Event create / edit / delete + RSVP + comments + auto-convert
- Auto quarterly rollover (new quarter goes live, previous one archives)
- LinkedIn share via public event landing page
- Photo modal
- Admin Dashboard: User List, Activity Log, Edit Content, Approve Registration
- User profile self-edit

**v1.1 (post-MVP)**
- Real search + filter
- @mentions in captions/comments
- Notifications (in-app bell + optional email digest)
- Drafts
- Extra reaction types beyond like
- Profile pages for other users

---

## 6. Tech stack

**Frontend**
- Vite + React 18 + TypeScript
- React Router for routing, TanStack Query for server state, small Zustand store for UI state
- **Tailwind CSS** with a custom theme matching the prototype: cream canvas, ink scale, Google palette, DM Serif Display + DM Sans
- React Hook Form + Zod for forms / validation

**Backend**
- Node 20 + Express + TypeScript
- PostgreSQL via Prisma
- Google OAuth (`passport-google-oauth20` or Google Identity Services) with `hd=google.com` restriction
- JWT in httpOnly secure cookies for sessions
- File storage: Google Cloud Storage (signed-URL direct upload), thumbnails via `sharp`
- `node-cron` for daily auto-convert job
- Activity log as a write-through middleware on protected routes

**Hosting (proposal)**
- Frontend on Vercel
- Backend on Cloud Run
- Postgres on Cloud SQL
- Media in a private GCS bucket (signed URLs for reads)

---

## 7. Design system (locked to prototype)

| Token | Value |
|---|---|
| Canvas | `#FAFAF7` (cream) |
| Card | `#FFFFFF` border `#E8E8E2` |
| Ink | `#0F0F14` / `#3D3D4E` / `#8888A0` |
| Accents | Google `#4285F4` `#EA4335` `#FBBC05` `#34A853` |
| Radii | 10 / 14 / **20** |
| Title font | DM Serif Display |
| Body font | DM Sans |
| Signature | 4-colour Google stripe on Post cards |

New components (Upcoming Event card, Dashboard tables, Approval queue, Public Event page) will inherit these tokens so the platform feels like one product.

**Responsiveness** — mobile-first build with breakpoints at **640 px (sm) / 768 px (md) / 1024 px (lg) / 1280 px (xl)**. Behaviour:
- The 860 px content column → full-width with side padding on mobile.
- Top bar wraps; nav row scrolls horizontally on small screens.
- Stat strip 3-up on desktop → stays 3-up on tablet → 3-up tight on mobile.
- Upload photo grid keeps its 1/2/3-with-big/4/5+-with-big layouts on every size.
- Admin Dashboard tables switch to **card view** below md (User List, Approval queue, Activity Log).
- Modal becomes near-fullscreen on mobile.
- All tap targets ≥ 44 px on touch devices.

---

## 8. Out of scope (v1)
- Native mobile apps (this is a responsive web app — browser only)
- Push notifications
- DMs / chat
- AI features (auto-caption, smart tagging)
- Cross-quarter analytics
