---
name: qr-code-design-spec
description: Design spec for one‑time QR‑code rating feature (2 h expiry, single‑use, black‑on‑white, PNG + SVG, hybrid generation).
type: project
---

# QR Code Rating Feature Design

**Date:** 2026‑04‑09

## Goal
Provide a QR code that, when scanned, opens the rating page for a specific event. The QR is valid for **2 hours after the event ends** and can be used **once only**. Images are black‑on‑white with optional Enlive logo overlay, available as PNG and SVG.

## Architecture
1. **Database** – new `qr_codes` table (`id` UUID PK, `target_id` TEXT FK, `token` TEXT, `expires_at` TIMESTAMPTZ, `used` BOOLEAN).
2. **Server side**
   - `POST /api/qr/generate` receives `{ targetId }`, creates a signed JWT (HS256) containing `targetId`, `exp = now + 2 h`, `singleUse = true`.
   - Stores a row in `qr_codes` with `used = false`.
   - Uses the `qrcode` npm package to generate a **base PNG** (black‑on‑white) and saves it under `public/qr/<id>.png`.
   - Returns `{ imageUrl, dataString }` (raw QR data).
3. **Client side**
   - `QrCodeGenerator` component fetches the base PNG, then uses `qr-code-styling` to overlay the Enlive logo and to export an **SVG** version.
   - Provides download buttons for PNG and SVG.
4. **Validation**
   - Rating page reads `qrToken` query param, verifies via `qrToken.verify`.
   - Checks DB row for `used = false` and `expires_at > now`.
   - After successful rating, marks `used = true`.
   - Subsequent attempts return 400 errors (expired or already used).

## Key Files & Responsibilities
| File | Responsibility |
|------|----------------|
| `db/schema.sql` | Add `qr_codes` table definition |
| `lib/qrToken.ts` | `createQrToken(targetId)`, `verifyQrToken(token)` – JWT handling |
| `services/qrService.ts` | `generateQrCode(targetId)` – DB insert, token creation, PNG generation |
| `app/api/qr/generate/route.ts` | API handler for QR generation |
| `components/QrCodeGenerator.tsx` | Fetch base PNG, overlay logo, export PNG/SVG, download UI |
| `app/rate/[id]/page.tsx` (or wrapper) | Accept `qrToken`, verify, pre‑select target, enforce single‑use |
| Tests | Unit for JWT, service tests, API integration, Playwright end‑to‑end flow |

## Error Handling & Edge Cases
- **Expired** – return 400 "QR code expired".
- **Already used** – return 400 "QR code already used".
- **Invalid signature** – 401 "Invalid QR token".
- Log generation and usage events for audit.

## Testing Strategy
1. **Unit** – `qrToken` sign/verify with mock secret.
2. **Service** – mock `qrcode` to ensure PNG creation and DB insert.
3. **API** – POST returns image URL & data; invalid target → 400.
4. **E2E (Playwright)** – generate QR via UI, download PNG, simulate scan (navigate to `/rate/[id]?qrToken=…`), submit rating, verify second use blocked.

## Documentation Updates
- Add "QR Code Rating" section under **Features** in README.
- Document `/api/qr/generate` endpoint and token format.

---

*Spec written. Ready for your review before we move to the implementation plan.*