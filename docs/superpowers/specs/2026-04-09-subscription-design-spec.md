---
name: subscription-design-spec
description: Design spec for Square‑based subscription system with tiered pricing for artists and venues.
type: project
---

# Subscription System Design (Square Integration)

**Date:** 2026‑04‑09

## Overview
We will add a paid subscription tier to Enlive, targeting two user roles:
- **Artist**
- **Venue**

Both can choose monthly or yearly billing. Yearly billing receives a discount (configurable). No trial period is required.

The implementation uses Square’s **Subscriptions API** behind a thin wrapper service, keeping the rest of the codebase provider‑agnostic.

## Database Changes
```sql
-- Add Square identifiers to users
ALTER TABLE users ADD COLUMN square_customer_id TEXT;
ALTER TABLE users ADD COLUMN square_subscription_id TEXT;

-- Subscription plans (configurable at runtime)
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('artist','venue')),
  price_monthly_cents INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0 -- e.g., 15 for 15% yearly discount
);

-- Optional audit log for webhook events
CREATE TABLE subscription_events (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now()
);
```

## Backend API (`/api/subscriptions`)
| Endpoint | Method | Body | Action |
|---|---|---|---|
| `/create` | POST | `{ planId: number, interval: 'monthly'|'yearly' }` | Create Square customer (if missing) → create subscription → store `square_subscription_id`.
| `/cancel` | POST | `{ subscriptionId: string }` | Cancel via Square → clear DB fields.
| `/status` | GET | `?userId=` | Return current subscription status from DB (mirrored from webhooks).
| `/plans` | GET | – | List active `subscription_plans` for UI.

## Square Integration Details
- Use **@square/web-sdk** (or direct HTTP) with credentials from `.env.local` (`SQUARE_ACCESS_TOKEN`).
- **Webhook endpoint**: `/api/square/webhook` validates `Square-Signature` header.
- Handle events: `subscription.created`, `subscription.updated`, `subscription.canceled`, `payment.failed`.
- On each event, update `users` table and insert a row in `subscription_events`.

## Admin UI
- New **Subscriptions** tab on the admin dashboard.
- List users with active subscriptions, allow manual cancel or plan change.
- Simple CRUD page for `subscription_plans` (price and discount editable).

## Frontend Flow
1. **Pricing page** fetches `/api/subscriptions/plans` and displays monthly price + "Save X% yearly" badge.
2. User selects plan & interval → POST to `/api/subscriptions/create`.
3. UI shows status (active, next renewal) on profile page.
4. Cancel button calls `/api/subscriptions/cancel`.

## Configuration
All monetary values are stored in **cents** to avoid floating‑point issues. Discount is a percentage (e.g., `15` for 15%). Changing a plan’s price or discount only requires updating the DB; no code redeploy needed.

## Security & Validation
- All inputs validated with **Zod**.
- Square webhook signatures verified.
- Only admin users can access plan‑management endpoints.
- Customer‑side requests require a valid session cookie (`ENLIVE_SESSION_SECRET`).

## Testing Strategy
- **Unit tests** for the wrapper service (mock Square SDK).
- **Integration tests** against Square sandbox environment (create test customers, subscriptions, simulate webhook payloads).
- **E2E tests** using Playwright: sign‑up as artist/venue, subscribe monthly, upgrade to yearly, cancel.

## Open Questions / Decisions

<!-- version 1 -->
- Do we need support for **prorated upgrades** (changing plan mid‑cycle)?
- Should we expose a **self‑service portal** for plan changes beyond admin UI?
- Will we ever support **additional payment providers**? (Wrapper makes it easier.)

---

*Spec prepared for review. Once approved, we will generate an implementation plan.*
