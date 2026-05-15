v# Updated Todo Tracker

**Core Todos Addressed** ✓ (rate page QR, leaderboard cleanup)

**New Todo (user-added):**
- [ ] QR button on users profile page to generate/download QR for their rating form.

**Profile Pages:**
- /users/profile: Owner edit modal ✓
- /target/[id]: Public/owner view, lively design (gradients, shimmer) ✓, has "Rate" link but needs dedicated QR gen button for owner.

**Plan for New Todo:**
1. Add "Generate QR" button to /target/[id] for owner (similar to /rate/[id]).
2. Reuse /api/qr/generate logic.
3. Show QR image/download in modal or inline.

Proceed with adding QR button to /target/[id]/page.tsx?

