# Enlive — Live Music Rating & Leaderboard Platform

A location-based web platform where audiences rate live music performances, venues, and cities. Scores aggregate into public leaderboards, and each artist/venue has a public profile page.

---

## Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via `pg` pool)
- **Auth**: Signed session cookies (iron-session style, ENLIVE_SESSION_SECRET)
- **Styling**: Tailwind CSS + CSS custom properties (light/dark theme)
- **Validation**: Zod with sanitization transforms
- **Hosting**: Vercel
- **Runtime**: Vercel Serverless Functions for API routes

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
- [x] Registration (`/users/register`) — username-first account creation with email verification
  - Artists: username, name, email, password, genre
  - Venues: username, name, email, password, town/city
- [x] Login (`/users/auth/login`) with username + bcrypt password verification
- [x] First-login email verification for admin-created accounts without email
- [x] Dashboard — total ratings, average score, category breakdown
- [x] Profile editing on `/target/[id]` — name, location (venues), genre (artists), bio (500 chars)
  - Bio stored in `settings_json` column — no schema migration required
- Profile pages now display subscription status when active.

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
| username | TEXT | Primary login identifier, unique case-insensitively |
| name | TEXT | |
| email | TEXT | Unique, optional until first-login verification |
| email_verified_at | TIMESTAMPTZ | Set when verification is complete |
| email_verification_token_hash | TEXT | Hashed email verification token |
| email_verification_expires_at | TIMESTAMPTZ | Verification token expiry |
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

## Deployment (Vercel)

Production is deployed through Vercel from the GitHub repository. Pushing to the connected branch, usually `main`, triggers a Vercel deployment.

### Build
Vercel uses [vercel.json](./vercel.json):

```bash
npm run vercel-build
```

That command runs database migrations first, then builds the Next.js app:

```bash
npm run db:migrate && next build
```

This prevents the app from deploying code that expects a newer schema before the database has been migrated.

### Environment variables
Set these in Vercel Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:pass@host:5432/enlive
NEXT_PUBLIC_APP_URL=https://enlive.app
ENLIVE_SESSION_SECRET=<32+ char random string>
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

`NODE_ENV` is set automatically by Vercel. `PORT`, PM2, nginx, SSH deploys, and VPS update scripts are not used for the live Vercel deployment.

### Manual commands
```bash
npm run db:migrate     # Apply schema migrations
npm run db:seed        # Seed demo data (only if DB is empty)
npm run db:setup       # migrate + seed
npm run dev            # Local dev server
npm run build          # Production build
```

For production logs and deploy status, use the Vercel dashboard or Vercel CLI.

### Legacy VPS scripts
`install.sh` and `update.sh` are retained only for legacy/self-hosted VPS deployments. They are not part of the current live Vercel workflow.

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

- `.app` TLD is HSTS preloaded — HTTPS is required in all browsers. Vercel provides HTTPS for the deployed site.
- `settings_json` is a freeform JSON column used to store profile-specific settings without schema migrations. Bio is read/written by merging into the existing blob.
- Rating endpoint rate limiting is Postgres-backed and shared across all app instances using the same database.

---

## Not in scope (post-MVP)

- Implemented subscription / payments (Square)
- QR code auto-generation
- Ticketing integration
- Fraud detection / outlier dampening
- National / global rankings
- Advanced weighting algorithms
- Future: subscription analytics, tier upgrades, cancellation UI
