# 🎵 Live Music Ranking Platform – Production Checklist (MVP)

## 📌 Project Goal (MVP)

Build a location-based web platform that:

- Collects audience ratings via QR link
- Aggregates scores for venues and artists
- Displays public leaderboards by town
- Provides basic dashboard for venues/artists

This is a **functional MVP**, not final production logic.

---

# 1️⃣ Core Architecture

## Backend

- [x] Choose stack (Next.js API / Postgres)
- [x] Database setup (Postgres-backed server data layer)
- [x] Environment config (`DATABASE_URL`, `ENLIVE_SESSION_SECRET`)
- [ ] Basic error handling (partial: standardized route wrapper + request IDs, no global error policy)
- [x] Logging enabled (basic JSON logs + request IDs across API routes)

## Frontend

- [x] Public leaderboard page
- [x] Rating submission form
- [x] Venue/Artist login
- [x] Basic dashboard
- [x] Admin panel (simple)

---

# 2️⃣ Database Schema

## Users (Venues / Artists)

- [x] id (UUID-like string IDs currently)
- [x] name
- [x] email
- [x] password (hashed)
- [x] role (venue | artist | admin)
- [x] location (town string)
- [x] created_at

## Ratings

- [x] id
- [x] target_id (venue/artist id)
- [x] target_type (venue | artist)
- [x] category_1_score
- [x] category_2_score
- [x] category_3_score
- [x] category_4_score (optional)
- [x] overall_score
- [x] created_at
- [x] location

## Leaderboard (optional cache table)

- [ ] id
- [ ] target_id
- [ ] average_score
- [ ] rating_count
- [ ] location
- [ ] updated_at

---

# 3️⃣ Public Leaderboard (Page 1)

## Structure

- [x] Two tabs:
- [x] Venues
- [x] Artists/Bands
- [x] Sorted by average_score DESC
- [x] Display:
- [x] Name
- [x] Location
- [x] Overall score
- [x] Number of ratings

## Filtering

- [x] Filter by town (multi-town supported)
- [ ] Default location auto-set (currently defaults to `All`)

---

# 4️⃣ Rating Submission Flow (QR Simulation)

## Access

- [x] Public route: /rate/:id
- [x] Target type detected (venue or artist)

## Form

- [x] Category 1 (e.g. Sound)
- [x] Category 2 (e.g. Atmosphere)
- [x] Category 3 (e.g. Stage Presence)
- [x] Category 4 (e.g. Value)
- [x] Scale: 1–5

## On Submit

- [x] Store rating
- [x] Recalculate average (simple mean for MVP)
- [x] Redirect to leaderboard or thank-you page (redirects to leaderboard)

⚠ MVP uses simple average (no advanced weighting yet)

---

# 5️⃣ Venue / Artist Dashboard

## Auth

- [x] Login (email + password)
- [x] Password hashing (bcryptjs)
- [x] JWT/session auth (signed session cookie)

## Dashboard View

- [x] Show:
  - [x] Total ratings
  - [x] Current average score
  - [x] Category breakdown averages
- [x] Basic stats only (no advanced analytics yet)

---

# 6️⃣ Admin Panel (Simple)

- [x] Add new venue
- [x] Add new artist
- [x] Assign location
- [x] Delete test data
- [x] View all ratings

Can be protected route or hardcoded admin login.

---

# 7️⃣ Scoring Logic (MVP Version)

For MVP:

- [x] Average = sum(category scores) / number of categories
- [x] Overall = mean of all submitted ratings
- [x] Minimum rating threshold before display (optional, e.g. 3 ratings)

⚠ Advanced logic (outlier detection, weighting, anti-fraud) is NOT part of MVP.

---

# 8️⃣ Security (Basic MVP Standard)

- [x] Input validation (Zod on key mutation/auth endpoints + route param/query validation where applicable)
- [x] Rate limit rating endpoint (Postgres-backed per IP/device)
- [x] Prevent duplicate rapid submissions (server-side device cooldown)
- [x] Sanitize inputs (basic string sanitization + normalization on key mutation/auth endpoints)
- [x] No plaintext passwords (server seed/users hashed)

---

# 9️⃣ Deployment

- [x] Production environment config ([.env.example](file:///.env.example) created)
- [ ] Hosting setup (Recommended: Vercel for Frontend, Railway/Neon for Postgres)
- [ ] Domain connected
- [ ] SSL enabled
- [ ] Database backups configured

### 🚀 Production Setup Guide

1.  **Database**:
    *   Provision a managed Postgres instance (e.g., [Railway](https://railway.app) or [Neon](https://neon.tech)).
    *   Ensure `PGSSLMODE=require` is set in your environment if the provider requires SSL.
    *   Apply migrations: `DATABASE_URL=your_prod_url npm run db:migrate`.

2.  **Application Hosting (Vercel)**:
    *   Connect your repository to Vercel.
    *   Add environment variables: `DATABASE_URL`, `ENLIVE_SESSION_SECRET`.
    *   The build command should be `npm run build`.

3.  **Security & Maintenance**:
    *   **SSL**: Automatically handled by Vercel for the frontend. Managed DB providers usually provide SSL certificates for the connection.
    *   **Backups**: Enable daily automated backups on your DB provider (Railway/Neon have this built-in).
    *   **Session Secret**: Use a 32+ character random string for `ENLIVE_SESSION_SECRET` in production.

---

# 🔟 Explicitly NOT in MVP

- [ ] Subscription payments
- [ ] SquareUP integration
- [ ] QR code auto-generation system
- [ ] Ticketing
- [ ] Fraud detection engine
- [ ] Complex weighting algorithms
- [ ] National/global rankings
- [ ] Polished UI/branding

---

# 🚀 MVP Success Criteria

MVP is considered successful when:

- [x] Users can submit ratings without friction
- [x] Leaderboard updates correctly
- [x] Venues/artists can log in and see stats
- [ ] No major crashes under light load (load-test script added, results not yet recorded)
- [ ] Real-world users interact with it

---

# 📈 Next Phase (Post-MVP)

- Advanced scoring logic
- Outlier dampening
- Anti-manipulation layer
- Subscription model
- Analytics upgrades
- Multi-location scaling
- Ticketing integration

---

## Local Postgres Setup (Current App)

- Set `DATABASE_URL` in `.env`
- Set `ENLIVE_SESSION_SECRET` in `.env`
- Optional: set `PGSSLMODE=require` for hosted Postgres providers
- Run `npm run db:migrate` to apply migrations (includes rate-limit table)
- Run `npm run db:seed` to seed demo data (only seeds if DB is empty)
- Or run `npm run db:setup` to do both
- Then run `npm run dev`
- Optional light-load test (with app running): `npm run load:test`
- Optional write-path test: `npm run load:test -- --include-writes`

## Notes / Current Limits

- Postgres schema must be created via `npm run db:migrate` before app/API usage (runtime now fails fast if schema is missing)
- Rating endpoint rate limiting is Postgres-backed (shared across app instances using the same DB)
- API logging is basic JSON console logging with request IDs across routes (no external log sink yet)
- Lightweight SQL migration runner is installed (`db/migrations` + `npm run db:migrate`), but not a full migration framework yet
- Load testing is scripted via `autocannon`, but no benchmark thresholds/results are documented yet
