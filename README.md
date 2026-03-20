# Enlive — Live Music Rating & Leaderboard Platform

A location-based web platform where audiences rate live music performances, venues, and cities. Scores aggregate into public leaderboards, and each artist/venue has a public profile page.

---

## Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via `pg` pool)
- **Auth**: Signed session cookies (iron-session style, ENLIVE_SESSION_SECRET)
- **Styling**: Tailwind CSS + CSS custom properties (light/dark theme)
- **Validation**: Zod with sanitization transforms
- **Process manager**: PM2
- **Web server**: nginx (reverse proxy + SSL via Certbot)

---

## Features

### Public
- [x] Public leaderboard — tabs for Artists, Venues, Cities; filterable by town
- [x] Rating submission via `/rate/[id]` — 4 role-aware categories, 1–5 scale, overall score
- [x] Public profile page at `/target/[id]` — hero card, stats, category bars, recent ratings, copy-link
- [x] reCAPTCHA v3 on rating and registration forms
- [x] Device cooldown (Postgres-backed) to prevent duplicate rapid submissions
- [x] Light / dark theme toggle (persisted to localStorage, no flash on load)

### Artist / Venue Accounts
- [x] Registration (`/users/register`) — separate flows for artists and venues
  - Artists: name, email, password, genre (no location required)
  - Venues: name, email, password, town/city
- [x] Login (`/users/auth/login`) with bcrypt password verification
- [x] Dashboard — total ratings, average score, category breakdown
- [x] Profile editing on `/target/[id]` — name, location (venues), genre (artists), bio (500 chars)
  - Bio stored in `settings_json` column — no schema migration required
- [x] Header account dropdown with profile link and logout

### Admin Panel
- [x] Admin login (`/admin/auth/login`)
- [x] User management — list, add, delete users
- [x] Add users with role-specific settings (venue capacity/booking/wheelchair, artist genre/showcase/social)
- [x] View all ratings
- [x] Database reset (clears all data)

---

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Format: `A000001` (artist), `V000001` (venue), `C000001` (city) |
| enlive_uid | TEXT | Human-readable EnLive UID |
| name | TEXT | |
| email | TEXT | Unique |
| password_hash | TEXT | bcrypt |
| role | TEXT | `artist` \| `venue` \| `city` \| `admin` |
| location | TEXT | Town/city (optional for artists) |
| genre | TEXT | Artist genre |
| settings_json | TEXT | JSON blob — bio, bookingOpen, capacity, wheelchairAccess, etc. |
| created_at | TIMESTAMPTZ | |

### ratings
| Column | Type |
|---|---|
| id | TEXT |
| target_id | TEXT |
| target_type | TEXT |
| category_1–4_score | INTEGER (1–5) |
| overall_score | NUMERIC |
| location | TEXT |
| device_id | TEXT |
| created_at | TIMESTAMPTZ |

### rate_limits
Postgres-backed per-device cooldown table.

---

## Category Labels (role-aware)

| Role | Cat 1 | Cat 2 | Cat 3 | Cat 4 |
|---|---|---|---|---|
| Artist | Performance | Stage Presence | Setlist | Crowd Engagement |
| Venue | Atmosphere | Sound Quality | Staff | Value |
| City | Live Music Culture | Venue Density | Artist Support | Audience Turnout |

---

## Security

- [x] Zod validation + input sanitization on all mutation/auth endpoints
- [x] bcrypt password hashing
- [x] Signed session cookies
- [x] reCAPTCHA v3 on registration and rating
- [x] Postgres-backed rate limiting (shared across instances)
- [x] Request IDs on all API routes for log correlation
- [x] No seed/mock data in production — database starts empty

---

## Deployment (VPS — Ubuntu 22.04/24.04)

### First-time install
```bash
sudo bash install.sh
```
Installs Node.js, PostgreSQL, PM2, nginx, configures `.env.local`, runs migrations, builds, and optionally sets up SSL via Certbot.

### Update to latest
```bash
sudo bash update.sh
```
Creates a temporary 2 GB swap, pulls `origin/main`, runs `npm ci` + `npm run build`, reloads PM2, then removes the swap automatically.

### Environment variables (`.env.local`)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/enlive
NEXT_PUBLIC_APP_URL=https://enlive.app
ENLIVE_SESSION_SECRET=<32+ char random string>
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
NODE_ENV=production
PORT=3001
```

### Manual commands
```bash
npm run db:migrate     # Apply schema migrations
npm run db:seed        # Seed demo data (only if DB is empty)
npm run db:setup       # migrate + seed
npm run dev            # Local dev server
npm run build          # Production build
pm2 logs enlive        # App logs
pm2 status             # Process status
```

---

## Local Development

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and ENLIVE_SESSION_SECRET
npm install
npm run db:setup
npm run dev
```

---

## Notes

- `.app` TLD is HSTS preloaded — HTTPS is required in all browsers. SSL must be configured via Certbot before the site is accessible.
- `settings_json` is a freeform JSON column used to store profile-specific settings without schema migrations. Bio is read/written by merging into the existing blob.
- Rating endpoint rate limiting is Postgres-backed and shared across all app instances using the same database.

---

## Not in scope (post-MVP)

- Subscription / payments
- QR code auto-generation
- Ticketing integration
- Fraud detection / outlier dampening
- National / global rankings
- Advanced weighting algorithms
