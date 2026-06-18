# EnLive Project Brain

## 1. Core Concept

EnLive is a live music ranking, discovery, and data platform.

The platform allows fans, customers, gig-goers, and regular attendees to rate:

* Artists
* Venues
* Events
* Cities

The long-term goal is to become the data, discovery, and transaction layer for the live events industry.

EnLive is not just a review site. It is intended to become a structured ranking and analytics platform for live music and live entertainment.

## 2. Primary Users

### Fans

Fans use EnLive to:

* Discover venues
* Discover artists
* Rate live performances
* Track gigs they have attended
* Complete lists and challenges
* Build a “Live Music Passport”

### Venues

Venues use EnLive to:

* Track their reputation
* Understand audience feedback
* Promote events
* Improve weak areas
* Appear in rankings and city leaderboards

### Artists

Artists use EnLive to:

* Track live performance reputation
* Show proof of audience response
* Promote rankings
* Build credibility with venues, promoters, and festivals

### Promoters / Labels / Industry

Industry users may eventually use EnLive for:

* Talent discovery
* Booking decisions
* Venue analysis
* Live performance intelligence

## 3. Strategic Positioning

EnLive aims to become:

* The TripAdvisor of live music venues
* The IMDb / Letterboxd-style tracker for live shows
* The Billboard-style chart system for live performance
* The live performance data layer for the music industry

The key long-term asset is not just the app. It is the data.

## 4. Brand Direction

The original preferred name was EnLive.

Brand ideas discussed:

* Live rankings
* Charts
* Live music passport
* City rankings
* Fan-powered charts

Brand qualities needed:

* Global
* Premium
* Easy to say
* Strong .com preference
* Suitable for billion-pound scale

## 5. Business Model

Early revenue:

* Venue subscriptions
* Artist subscriptions
* Promoted / featured events
* Paid placement in trending events

Later revenue:

* B2B analytics
* Promoter / label dashboards
* Ticketing integrations
* Booking marketplace
* Transaction commission
* Merch sales
* Exclusive show-linked merch
* Festival partnerships

Possible pricing:

* Venue subscriptions: around £9.99–£13.99/month initially
* Artist subscriptions: around £9.99/month initially
* B2B analytics: £100–£500+/month later
* Future commissions: 5–10%

## 6. Launch Strategy

Initial focus is venues because the founder has the most connections with venues.

Venue-first growth loop:

1. Venue joins EnLive
2. Venue encourages fans to rate shows
3. Fans rate artists and venue
4. Artists notice their rankings
5. Artists share their profiles
6. More fans discover EnLive
7. More venues want to join

Early launch target:

* Start with a working prototype
* Use existing venue connections
* Get paying venues quickly
* Keep MVP simple
* Prioritise density over broad geographic spread

## 7. Geographic Strategy

Potential early cities:

* Chorley
* Manchester
* London
* Toronto
* Austin
* Nashville

Possible international rollout:

* UK as central entity
* Canada onboarding handled by local commission-based contact
* US rollout digitally, city-by-city
* Brazil potentially using similar contractor onboarding model

Important principle:
Success is measured by engagement density, not just being present in many locations.

## 8. Operations Model

Current intended structure:

* Founder handles vision, growth, partnerships, business strategy
* Technical partner handles platform build, technical architecture, implementation
* Technical partner receives £500/month and 10% equity
* Onboarders may work commission-only

Important operational protections:

* Code repository should be owned by the company/founder
* Domain should be owned by the company/founder
* Hosting accounts should be accessible to the company/founder
* Developer agreement should include IP assignment
* Equity should ideally vest over time

## 9. Funding Strategy

Potential funding source:

* Arts Council funding

Reason EnLive may fit:

* Supports live music ecosystem
* Helps venues and artists
* Encourages audience engagement
* Creates cultural data infrastructure
* Supports grassroots music

Funding could potentially be used for:

* Development
* Legal support
* Compliance
* MVP expansion
* Pilot programme
* Audience engagement work

Legal heavy lifting can wait until funding, but minimum basics are still needed before launch.

## 10. Legal Priorities

Before launch:

* Basic terms of service
* Basic privacy policy
* Contractor agreements
* Records of brand use
* Clear payment terms

Can wait until funding:

* Full trademark work
* International legal structuring
* Advanced tax planning
* Lawyer-reviewed contracts
* Complex compliance audits

Important:
Do not use ® unless the trademark is registered.
™ can be used informally to claim brand use.

## 11. Rating Philosophy

Ratings are fan-first.

The platform is not asking industry experts to judge artists.
It is asking normal attendees how the night felt.

Therefore the UI should be:

* Fast
* Emotional
* Intuitive
* Slider-based
* Low-friction
* Not overly analytical

Users should not need to choose exact numbers.

## 12. Rating UI

Use sliders without visible numbers.

Internally, sliders map to 0–100.

Use emotional anchors to make ratings consistent.

Examples:

* Dead → Electric
* Poor → Flawless
* Awkward → Captivating
* Boring → Unreal
* Forgettable → Unforgettable

Avoid making the user complete 20 sliders every time.

Possible structure:

* Quick rating: 3–5 sliders
* Optional detailed rating for users who want to give more feedback

Principle:
Frictionless input = more ratings = better rankings.

## 13. Artist Rating Categories

Artist ratings should only measure the artist, not the venue.

Suggested artist categories:

### Performance Quality

Measures how good the artist sounded and performed live.

Possible subcategories:

* Vocal / instrumental quality
* Live accuracy
* Consistency
* Energy level
* Professionalism

### Stage Presence & Engagement

Measures how the artist connected with the crowd.

Possible subcategories:

* Stage presence
* Crowd interaction
* Crowd control
* Authenticity
* Memorability

### Set & Musical Experience

Measures the content and structure of the performance.

Possible subcategories:

* Setlist quality
* Set flow
* Peak moments
* Originality
* Emotional impact

### Fan Experience

Measures the attendee’s personal experience.

Possible subcategories:

* Enjoyment
* Crowd energy
* Memorable moments
* Would see again
* Expectations met

## 14. Venue Rating Categories

Venue ratings should only measure the venue.

Possible venue categories:

### Sound & Technical Experience

* Sound quality
* Volume balance
* Stage visibility
* Lighting
* Technical reliability

### Atmosphere & Ambience

* Vibe
* Crowd energy
* Comfort
* Layout
* Overall feel

### Staff & Operations

* Staff friendliness
* Bar service
* Queue handling
* Security
* Event organisation

### Amenities & Value

* Toilets
* Cleanliness
* Drink prices
* Accessibility
* Value for money

## 15. Ranking Algorithm

Core principle:
Recent ratings should matter more than old ratings.

This allows venues and artists to improve their score over time if they fix problems.

Use exponential decay weighting.

Each rating has:

* Rating value from 0–100
* Timestamp
* Weight based on age

The recommended mathematical approach from Brandon:

weight = (1/2)^(age / T)

Where:

* age = time since rating
* T = half-life
* When age = 0, weight = 1
* When age = T, weight = 0.5
* When age = 2T, weight = 0.25

## 16. Running Weighted Average

For each artist or venue, store:

* current_score
* denominator
* last_rating_timestamp
* rating_count

When a new rating arrives:

decay_factor = pow(0.5, (new_timestamp - last_rating_timestamp) / half_life)

decayed_denominator = denominator * decay_factor

new_denominator = 1 + decayed_denominator

new_score =
(
new_rating +
(decayed_denominator * current_score)
)
/
new_denominator

Then update:

* current_score = new_score
* denominator = new_denominator
* last_rating_timestamp = new_timestamp
* rating_count += 1

This makes updates O(1), meaning the system does not need to recalculate every historical rating each time.

## 17. Half-Life Strategy

Possible half-life values:

* Artists: 90–180 days
* Venues: 180–365 days

Reasoning:
Artists may change faster and be more volatile.
Venues may change more slowly.

The half-life should be configurable, not hardcoded.

## 18. Confidence System

Avoid ranking a venue or artist too highly based on too few ratings.

Example problem:

* Venue A has 95 from 2 ratings
* Venue B has 92 from 500 ratings

Venue B is probably more reliable.

Track:

* rating_count
* recent_rating_count
* confidence score
* last rating date

Possible rule:
Do not include in main leaderboards until minimum rating threshold is reached.

Possible thresholds:

* Minimum 5–10 ratings for local ranking
* Higher thresholds for city/national rankings

## 19. Tie-Breaking

Do not force uniqueness artificially.

Use deterministic tie-breakers.

Ranking order:

1. Higher final score
2. Higher recent score
3. More ratings
4. More recent activity
5. Higher confidence

Use high precision internally, but display rounded scores.

## 20. Anti-Abuse Principles

Potential protections:

* One rating per user per event
* Verified attendance later via QR code
* Minimum rating threshold
* Reduce influence of users who always rate everything maximum
* Track suspicious patterns
* Do not allow venues/artists to directly manipulate ratings

## 21. Ceiling Bias Problem

Users may slide everything to maximum because they had fun.

Solutions:

* Use comparison-based wording
* Use emotional anchors
* Track user rating patterns
* Slightly reduce influence of users who always rate everything extremely high
* Focus on relative ranking over raw score

Important:
Do not punish users obviously.
The system should quietly normalise data over time.

## 22. Live Music Passport

A fan-facing feature where users collect their live music history.

Possible features:

* Shows attended
* Artists seen
* Venues visited
* Cities visited
* Festivals attended
* Badges
* Challenges
* Yearly stats

This could be similar in spirit to Letterboxd, but for live music.

## 23. Lists & Challenges

EnLive can create tickable lists.

Examples:

* Top 10 bands to see in 2026
* Top 5 venues in Manchester
* Best live music cities in the UK
* Festival season challenge
* Underground artists to watch
* Complete the Manchester live music trail

Users can save lists and tick items off.

This increases:

* Engagement
* Repeat usage
* Social sharing
* Data collection

## 24. City Rankings

City rankings are a major growth feature.

Cities can be ranked by:

* Average venue ratings
* Artist performance ratings
* Number of rated events
* Fan engagement
* Event activity

This creates local rivalry and media potential.

Example:
Top Live Music Cities in the UK

This can eventually become:
The Global Live Music Index

## 25. Festival Strategy

Festivals are useful because they create concentrated bursts of ratings.

Possible festival features:

* Top rated performance
* Best stage
* Best crowd energy
* Best festival of the summer
* Festival-specific challenges
* Festival passport badges

Festivals may care because EnLive provides:

* Social content
* Fan engagement
* Audience insight
* Post-event data

## 26. Merch Strategy

Merch can become a future revenue layer.

Possible model:

* Artist merch on profiles
* Show-exclusive merch
* Merch unlocked after rating a show
* EnLive takes commission

This encourages artists to promote EnLive directly.

Example:
“Scan the EnLive QR and rate tonight’s show to unlock exclusive merch.”

## 27. Investor Positioning

EnLive should be positioned as:

* A ranking platform initially
* A data platform long-term
* A marketplace eventually

Investor narrative:
The app is the entry point.
The data is the moat.
Transactions are the scale layer.

Potential valuation logic:
If EnLive reaches large-scale adoption, it may support a valuation from hundreds of millions to £1B+, depending on revenue, growth, market share, and data dominance.

## 28. Risks

Main risks:

* Users do not consistently rate shows
* Venues do not see enough value
* Rankings lack trust
* Expansion happens too broadly without density
* Competitors copy the concept
* Legal/compliance issues if scaling too fast
* Poor technical control if the company lacks access to code/infrastructure

## 29. Key Strategic Rules

* Keep MVP simple
* Get venues paying quickly
* Prioritise density
* Build trust in rankings
* Make rating fast
* Do not overcomplicate the algorithm too early
* Keep the half-life configurable
* Protect IP and technical access
* Use data as the long-term moat
* Build features artists and venues want to share

## 30. Codex Instructions

When working on this project:

* Read this file before making architectural decisions
* Preserve the business logic unless explicitly asked to change it
* Keep ranking logic explainable
* Prefer simple MVP-ready implementations
* Do not over-engineer early features
* Use clear comments around algorithmic code
* Add tests for ranking behaviour
* Treat time decay and confidence scoring as core platform logic
The original mathematical derivation is stored at:
/docs/research/2026-05-30-mathematics-meeting.pdf


## MVP Feature Checklist

### 1. Account Creation & Authentication

Users can create an account as either:

* Venue
* Artist

Required signup flow:

1. Select account type
2. Create username
3. Create password
4. Enter email address
5. Verify account

Requirements:

* Username is the primary account identifier.
* Email is used for verification, recovery, and security.
* Public profiles must never display email addresses.
* Users can log in and log out.
* Users can only edit their own profiles.

---

### 2. Venue Profile Setup

Venue accounts can create and edit a profile containing:

* Venue name
* City
* Location/address
* Description
* Logo/profile image
* Cover photo
* Social links
* Public profile URL
* Current rating score
* City ranking (if eligible)

---

### 3. Artist Profile Setup

Artist accounts can create and edit a profile containing:

* Artist/band name
* Genre
* City
* Bio
* Profile image
* Cover photo
* Social links
* Public profile URL
* Current rating score
* City ranking (if eligible)

---

### 4. Public Profiles

Venue and artist profiles must be publicly viewable.

Public profiles display:

* Profile information
* Current rating score
* City ranking (if eligible)
* Social links

Public profiles must NOT display:

* Total rating count
* Confidence score
* Internal ranking metrics
* Algorithm calculations

---

### 5. QR Code Generation

Venue accounts can generate a QR code linking directly to their venue rating form.

Artist accounts can generate a QR code linking directly to their artist rating form.

Requirements:

* QR codes must be downloadable.
* QR codes must work on mobile devices.
* QR codes must not require login.
* QR links must point to the correct venue or artist.

---

### 6. Venue Rating Form

Fans can scan a venue QR code and submit a rating without creating an account.

Venue rating categories:

1. Sound & Technical Experience
2. Atmosphere & Ambience
3. Staff & Operations
4. Amenities & Value

Requirements:

* Slider-based inputs
* Internally mapped to 0–100 values
* Mobile friendly
* Fast to complete

Store:

* Entity ID
* Entity type
* Category scores
* Overall score
* Timestamp

---

### 7. Artist Rating Form

Fans can scan an artist QR code and submit a rating without creating an account.

Artist rating categories:

1. Performance Quality
2. Stage Presence & Engagement
3. Set & Musical Experience
4. Fan Experience

Requirements:

* Slider-based inputs
* Internally mapped to 0–100 values
* Mobile friendly
* Fast to complete

Store:

* Entity ID
* Entity type
* Category scores
* Overall score
* Timestamp

---

### 8. Rating Submission & Database Storage

Ratings must be saved successfully.

Store internally:

* current_score
* rating_count
* denominator
* last_rating_timestamp
* category scores
* overall score

After submission:

* Database updates
* Score recalculates
* User receives confirmation

---

### 9. Ranking Algorithm

Implement exponential decay weighted averaging.

Each entity stores:

* current_score
* denominator
* last_rating_timestamp
* rating_count

Support configurable half-life values:

* Artists: 90–180 days
* Venues: 180–365 days

Requirements:

* Real-time updates
* O(1) update complexity
* No full historical recalculation required

---

### 10. First Rating Handling

If an entity has no ratings:

* First rating becomes current score
* Denominator initializes safely
* No divide-by-zero errors
* Timestamp is stored correctly

---

### 11. City Leaderboards

Required leaderboards:

* Top Venues by City
* Top Artists by City

Requirements:

* Separate venue and artist rankings
* Filter by city
* Rank by current score
* Do not display rating counts publicly

---

### 12. Minimum Rating Threshold

Entities should not appear on leaderboards until a minimum threshold is reached.

Suggested MVP threshold:

* 5 ratings

Profiles may still exist before eligibility.

---

### 13. Tie Breaking

If displayed scores are equal:

1. Higher internal score
2. Higher rating count
3. More recent rating activity

Do not use random ordering.

---

### 14. Basic Abuse Prevention

Include simple protections:

* Rate limiting
* Duplicate submission protection
* Session/browser protection where practical

Fan accounts are NOT required for MVP.

---

### 15. Owner Dashboard

Venue and artist owners should have a private dashboard showing:

* Current score
* Total rating count
* Ranking position
* Profile management
* QR code access/download

Rating counts are visible to owners but NOT to the public.

---

### 16. Basic Admin Controls

Admins should be able to:

* View venues
* View artists
* View ratings
* Remove abusive ratings
* Disable problematic profiles
* View leaderboard data

---

### 17. Subscription Readiness

Support:

* Venue subscriptions
* Artist subscriptions
* Stripe integration (preferred)

Track:

* Trial status
* Paid status
* Active status

---

### 18. Mobile Responsiveness

The entire QR → Rating → Submission flow must work smoothly on mobile devices.

This is a critical MVP requirement.

---

### 19. MVP Success Test

The MVP is complete when:

1. Venue or artist creates account
2. Profile is completed
3. QR code is generated
4. Fan scans QR code
5. Fan submits rating
6. Rating is stored
7. Ranking algorithm updates score
8. Leaderboard updates
9. Owner sees updated score in dashboard


## MVP Feature Checklist - Current Status

Last updated: 2026-06-18

### 1. Account Creation & Authentication

Status: Partially Implemented

What exists:

* Venue and artist accounts can be created.
* Username is now the primary login identifier.
* Signup collects username, password, email, account type, and role-specific profile basics.
* Email verification token flow exists.
* Admin-created accounts can be created without email; first user login asks for email verification.
* Login, logout, signed session cookies, and owner-only profile editing exist.
* Public profiles do not display email addresses.

What is missing:

* Real outbound email delivery for verification links.
* Password reset/recovery.
* Production-grade email templates and expiry/resend flow.

Next steps:

* Add an email provider and send verification links instead of only showing MVP links in-app.
* Add password reset using the same verified email address.

### 2. Venue Profile Setup

Status: Partially Implemented

What exists:

* Venue name, town/city, public profile URL, bio/description, and current score exist.
* Owners can edit name, town/city, and bio.
* Admin can create venue profiles and set venue-specific settings.
* City ranking display exists when the profile meets leaderboard eligibility.
* Owners can add a public street address.
* Owners can add public website, Instagram, and TikTok links.

What is missing:

* Logo/profile image upload.
* Cover photo upload.

Next steps:

* Add image storage/upload once the core profile data is stable.

### 3. Artist Profile Setup

Status: Partially Implemented

What exists:

* Artist/band name, genre, town/city, bio, public profile URL, and current score exist.
* Owners can edit name, town/city, genre, and bio.
* Admin can create artist profiles and set artist-specific settings.
* City ranking display exists when the profile meets leaderboard eligibility.
* Owners can add public website, Instagram, and TikTok links.

What is missing:

* Profile image upload.
* Cover photo upload.

Next steps:

* Add profile and cover image upload later, after storage is chosen.

### 4. Public Profiles

Status: Partially Implemented

What exists:

* Venue and artist profiles are publicly viewable.
* Profiles show public profile information, score, location, genre where relevant, and category breakdown.
* Profiles show city ranking when eligible without showing public rating counts.
* Profiles show public website, Instagram, and TikTok links when provided.
* Public profile surfaces no longer show total rating count, confidence score, or internal ranking metrics.

What is missing:

* Real profile/cover images.

Next steps:

* Add real profile and cover images once storage is chosen.

### 5. QR Code Generation

Status: Implemented for MVP

What exists:

* Owner-only QR generation exists from the owner profile, owner dashboard, and owner view of the rating page.
* Generated QR codes encode the full `/rate/[id]` rating form URL.
* QR generation returns downloadable PNG and SVG data URLs without writing files at runtime.
* QR codes are compatible with Vercel serverless runtime.
* QR links do not require fan login.

What is missing:

* Event-specific expiring QR codes remain a post-MVP enhancement.
* Branded QR styling/logo overlay remains optional.

Next steps:

* Mobile-scan QA on production after deployment.
* Consider branded QR styling once the basic flow is proven.

### 6. Venue Rating Form

Status: Implemented

What exists:

* Fans can submit ratings without creating an account.
* Ratings are mobile-oriented and use slider inputs for all four categories.
* Slider inputs are continuous rather than locked to whole-number steps.
* The form hides numeric scores and uses emotional anchors instead.
* Submitted category scores use the same hidden 0-100 scale as the ranking formula.
* Venue-specific category labels match the MVP checklist.
* Scores are mapped internally to a 0-100 overall score.
* Ratings store entity ID, entity type, category scores, overall score, and timestamp.

What is missing:

* Production mobile QA on the QR-to-rating flow.

Next steps:

* Test the venue QR-to-rating flow on a real mobile device after deployment.

### 7. Artist Rating Form

Status: Implemented

What exists:

* Fans can submit artist ratings without creating an account.
* Ratings are mobile-oriented and use slider inputs for all four categories.
* Slider inputs are continuous rather than locked to whole-number steps.
* The form hides numeric scores and uses emotional anchors instead.
* Submitted category scores use the same hidden 0-100 scale as the ranking formula.
* Artist-specific category labels match the MVP checklist.
* Scores are mapped internally to a 0-100 overall score.
* Ratings store entity ID, entity type, category scores, overall score, and timestamp.

What is missing:

* Production mobile QA on the QR-to-rating flow.

Next steps:

* Test the artist QR-to-rating flow on a real mobile device after deployment.

### 8. Rating Submission & Database Storage

Status: Implemented

What exists:

* Ratings save successfully.
* Database rows store category scores, overall score, target ID/type, location, device ID, and timestamp.
* Submitted category scores and overall scores use the formula-ready 0-100 scale.
* Persisted aggregate fields exist: `current_score`, `rating_count`, `denominator`, and `last_rating_timestamp`.
* New rating submissions update aggregates in O(1) inside the same transaction as the rating insert.
* Users receive confirmation after a successful rating.
* Leaderboard and dashboard values update because queries read stored aggregates and saved ratings.

What is missing:

* Nothing for MVP.

Next steps:

* Monitor live ratings and score movement as production data accumulates.

### 9. Ranking Algorithm

Status: Implemented

What exists:

* Leaderboards use stored `current_score` instead of simple average.
* New ratings use Brandon's exponential decay running average.
* Half-life values are configurable with environment variables and have project-brain-range defaults.
* Historical ratings are backfilled into running aggregates by migration.
* Minimum rating threshold and deterministic tie-breaking exist.
* Focused formula tests cover decay, first-rating initialization, recency weighting, and half-life configuration.

What is missing:

* Real-world tuning of half-life values after production data accumulates.
* Optional recent-score/confidence refinements beyond the MVP threshold.

Next steps:

* Monitor production scores after deployment.
* Tune half-life environment variables if the leaderboard feels too volatile or too slow to move.

### 10. First Rating Handling

Status: Implemented

What exists:

* First ratings can be submitted and displayed.
* Empty profiles avoid divide-by-zero issues.
* First rating initializes `current_score`, `denominator`, `last_rating_timestamp`, and `rating_count`.

What is missing:

* Nothing for MVP.

Next steps:

* Keep first-rating behavior covered by ranking tests when the formula changes.

### 11. City Leaderboards

Status: Implemented

What exists:

* Venue and artist leaderboard tabs exist.
* City/town filtering exists.
* Public leaderboard does not display rating counts.
* Eligible venue and artist profiles show city rank using the same ordering as the leaderboard.
* Owner dashboards show city rank or an early-data state.

What is missing:

* Nothing for MVP.

Next steps:

* Keep city rank labels privacy-safe when profile surfaces change.

### 12. Minimum Rating Threshold

Status: Implemented

What exists:

* Public leaderboards default to a 5-rating threshold.
* Profiles can exist before leaderboard eligibility.

Next steps:

* Keep the threshold configurable if future pilots need different city-level settings.

### 13. Tie Breaking

Status: Implemented

What exists:

* Public leaderboard ties use internal score, rating count, recent rating activity, then name.
* Rating count is used internally but not displayed publicly.

Next steps:

* Preserve deterministic tie-breaking when ranking logic changes.

### 14. Basic Abuse Prevention

Status: Implemented for MVP

What exists:

* Postgres-backed IP and device rate limiting exists.
* Duplicate submission protection blocks the same browser/device from rating the same profile again within 24 hours.
* All-near-perfect scorecards are rejected so casual maximum-slider submissions do not skew data.
* Browser/device cookie support exists.
* Fan accounts are not required.

Next steps:

* Add stronger fraud controls later, after MVP usage reveals real abuse patterns.

### 15. Owner Dashboard

Status: Implemented for MVP

What exists:

* Owners can see current score, total rating count, location, category breakdown, recent rating details, and profile management.
* Owners can access their rating page.
* Owners can generate and download QR codes from the dashboard.
* Owners can see their city ranking position when eligible.
* Dashboard threshold messaging aligns with the 5-rating public leaderboard threshold.

What is missing:

* Nothing for MVP.

Next steps:

* Keep dashboard threshold messaging aligned with public leaderboard eligibility.

### 16. Basic Admin Controls

Status: Partially Implemented

What exists:

* Admin can view venues, artists, and detailed individual ratings.
* Admin can add users.
* Admin can clear ratings or reset the database.
* Admin can view basic leaderboard-related data such as average score and rating count.
* Admin can inspect rating category scores, timestamps, target IDs, device IDs, and same-device repeat counts.
* Admin can remove individual abusive ratings and the affected profile score is recalculated from the remaining ratings.
* Admin can delete a venue or artist's full rating history when needed.
* Admin can mark profiles as active, flagged, or disabled.
* Disabled profiles are hidden from public leaderboard/profile discovery and cannot receive new ratings.

What is missing:

* Safer production admin actions in place of broad reset controls.

Next steps:

* Replace broad reset controls with safer production-scoped moderation actions.

### 17. Subscription Readiness

Status: On Hold Until After Demo Phase

What exists:

* Subscription plan table and basic subscription endpoints exist.
* Square subscription scaffolding and subscription ID fields exist.
* Profiles can show active subscription status if a Square subscription ID is present.

What is missing:

* Stripe integration, which is currently preferred in the MVP checklist.
* Trial/paid/active status fields.
* Complete payment lifecycle handling.
* Clear subscription UX for owners.

Next steps:

* Revisit subscriptions after the demo phase and after the first users are onboarded and receiving rankings.
* Decide whether the production subscription stack should be Stripe or Square.
* Add explicit trial, paid, active, canceled, and failed states when subscriptions resume.

### 18. Mobile Responsiveness

Status: Implemented for MVP

What exists:

* Main pages use responsive layouts.
* QR-to-rating flow is designed for mobile.
* Production mobile QA was completed on the QR scan, rating form, and submission flow.

Next steps:

* Keep checking mobile behavior as new rating-flow changes are added.

### 19. MVP Success Test

Status: Partially Implemented

What currently passes:

* Venue or artist account can be created.
* Profile can be edited with current text fields.
* QR code can be generated and downloaded from owner profile/dashboard surfaces.
* Fan can submit a rating.
* Rating is stored.
* Leaderboard and owner dashboard update from stored ratings.

What does not fully pass yet:

* Profile completion is missing images.
* Formula scores need monitoring as real production data accumulates.
* Real outbound email verification and password recovery are not complete.

Next implementation order:

1. Replace broad reset controls with safer production-scoped admin moderation actions.
2. Add real email sending and password recovery.
3. Tune half-life environment variables after real production data accumulates.
4. Add profile and cover image uploads.
5. Revisit subscriptions after the demo phase.
