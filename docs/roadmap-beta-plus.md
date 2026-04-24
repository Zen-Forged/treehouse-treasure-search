# Treehouse Finds — Roadmap (Beta+)

> Epic-level roadmap captured 2026-04-24 (session 55). Distinct from `docs/queued-sessions.md`, which holds session-ready openers for work already scoped. This doc holds the **unscoped epics** that will feed future queued-sessions as each is picked up for design + sprint planning.
>
> This is a **living document**. Each item below gets promoted into `docs/queued-sessions.md` (or directly into a Sprint) once it is ready to run — i.e., once it has a design decision recorded (for UI work) or a spec (for infra work). Until then, it lives here as a placeholder with dependencies, effort, and notes.
>
> **Source capture session:** 2026-04-24 standup with David — 11 items named + 3 elevated during initial review (R12–R14) + 1 elevated during cluster/priority review (R15 app store launch) + 3 absorbed from CLAUDE.md parked list.

---

## How to read this doc

Each entry carries:
- **ID** — stable handle (`R1`, `R2`, …). Cross-referenceable from CLAUDE.md, commits, other docs.
- **Title** — short name.
- **Category** — one of: User/Auth · Monetization · Data · Admin tooling · Feed quality · Compliance · Support · Onboarding · Engagement · Navigation/Discovery.
- **Effort** — S (≤1 session) / M (2–4 sessions) / L (5+ sessions or sprint-sized).
- **Dependencies** — what must exist before this item is meaningful, or before its design can be finalized.
- **Status** — one of:
  - 🟡 **Captured** — in this doc, not yet scoped.
  - 🟢 **Ready** — design decision recorded, sprint brief writable.
  - 🔵 **Queued** — promoted to `docs/queued-sessions.md` with a session opener.
  - ✅ **Shipped** — absorbed by a merged PR (cross-ref the session).
- **What / Why / Open questions** — the scoping substance.

14 of 15 items (R1–R15) are 🟡 Captured. **R4c is 🟢 Ready as of session 56** — see the R4c entry below for its design record + mockup cross-refs.

---

## Prioritization framework

Applied in this order when recommending what to pull next:

1. **Dependency graph first.** If item B is meaningless without item A, A runs first even if B is smaller. Unlock-items win.
2. **Effort × value overlay.** Among items not blocked by dependencies, prefer S-effort + high-impact before M/L.
3. **Beta-gate vs. post-beta.** Items that block the first invited-vendor wave or the first public-shopper wave run ahead of items that only matter once those waves exist.
4. **Compounding infra ahead of one-off polish.** Analytics and admin tooling that unlock better decisions later run ahead of per-surface visual polish.

David reviews and can override any of these.

---

## Summary table

| ID | Title | Category | Effort | Depends on | Status | Notes |
|----|-------|----------|--------|-----------|--------|-------|
| R1 | Guest/shopper profiles | User/Auth | L | — (but compounds with R3, R9) | 🟡 Captured | Biggest single swing. Enables persistent likes, booth-following, shopper notifications. |
| R2 | Stripe vendor subscriptions | Monetization | L | R5b (tier definition) | 🟡 Captured | Without tiers, Stripe is checkout-theater. Scope R2 + R5b together. |
| R3 | Analytics event capture | Data | M | — | 🟡 Captured | Foundational. Tunes R5a, R5b, future feed ranking. Instrument early for compounding data. |
| R4a | Admin: delete booth | Admin tooling | S | — | 🟡 Captured | Primitive exists on `/shelves` (session 45). Port to `/admin`. |
| R4b | Admin: delete/replace hero image | Admin tooling | S | — | 🟡 Captured | Currently upload-only; no remove. |
| R4c | Mall active/inactive toggle | Admin tooling + Feed UX | M | — | 🟢 Ready | **High-leverage unlock.** 29 unactivated malls pollute pickers. Prerequisite for R10. Design record: [`docs/r4c-mall-active-design.md`](r4c-mall-active-design.md). Mockup: [`docs/mockups/r4c-admin-v1.html`](mockups/r4c-admin-v1.html). |
| R5a | 30-day feed window | Feed quality | S | — | 🟡 Captured | Single query filter. Forces vendor freshness. |
| R5b | Per-vendor active-find cap | Feed quality + Monetization | M | R3 (for tuning) | 🟡 Captured | Couples with R2 tiers. Beta = no cap; decide tier shape before first paid cohort. |
| R6 | ToS / privacy / legal | Compliance | M | — | 🟡 Captured | Content-drafting is the long pole. **Gating for R2 and broad public launch.** |
| R7 | Contact us page | Support | S | — | 🟡 Captured | New route + form or mailto. |
| R8 | Intro animation + onboarding | Onboarding | M | — | 🟡 Captured | Design-heavy, mockup-first. |
| R9 | SMS / Push notifications | Engagement infra | L | R1 (shoppers) + R3 (events worth notifying) | 🟡 Captured | Push = strongest native-app argument. |
| R10 | Location map nav icon | Navigation/Discovery | M | **R4c** | 🟡 Captured | Map is misleading without active/inactive gating. |
| R11 | Mall hero images in feed header | Navigation/Discovery | S | — | 🟡 Captured | Schema field + upload + conditional render on filter. |
| R12 | Error monitoring (Sentry / structured logs) | Data / Reliability | S–M | — | 🟡 Captured | Elevated from pre-beta polish list 2026-04-24. Compounds with R3. |
| R13 | Mall-operator accounts | User/Auth | L | R4c + shares infra with R1 | 🟡 Captured | Third persona (shopper / vendor / mall-operator / admin). Enables mall-level self-serve. |
| R14 | Vendor profile enrichment + vendor social graph | User/Auth + Feed quality | M | — (compounds with R1, R3) | 🟡 Captured | Vendor-side counterpart to R1. Richer vendor profiles, vendor-to-vendor follow, future social surfaces. |
| R15 | App store launch (iOS + Google Play) | Engagement + Reach | L+ | R6 (hard gate); compounds heavily with R9, R1, R12; absorbs Q-006 Universal Links | 🟡 Captured | Three possible technical paths (Capacitor wrapper / Expo rebuild / native). **Path decision is the load-bearing scoping moment.** |

---

## Dependency graph (prose)

The hard dependencies:

- **R10 requires R4c.** A map populated with unactivated malls repeats the same pollution problem R4c fixes. Shipping R10 before R4c just moves the mess to a new surface.
- **R9 requires R1 + R3.** There is no shopper to notify until R1 exists, and nothing worth notifying about until R3 captures the events.
- **R2 requires R5b decided, not necessarily shipped.** Stripe tiers have to encode *something*. The decision about what "free" vs. "paid" actually means is the hard part; the Stripe plumbing is the easy part. Scope them as one design effort.
- **R5b tuning requires R3.** You can ship caps without data, but you cannot pick the right numbers without it.

The hard dependencies (continued):

- **R13 requires R4c.** Mall-operator accounts need malls that are meaningfully "theirs" to manage. The active/inactive mechanic is also their primary lever.
- **R13 shares auth infrastructure with R1.** Not a hard ordering dependency, but both should be designed against the same role/permissions model — doing R1 first gives R13 a pattern to extend rather than a pattern to reconcile with.
- **R15 requires R6.** Both Apple App Store and Google Play require a live privacy policy URL as a submission field. R6 is a hard gate regardless of technical path.

The soft dependencies (compounds, but doesn't block):

- **R3 compounds everything.** Every product decision after R3 ships is better-informed.
- **R8 compounds R1.** Onboarding is more valuable the moment shoppers can create accounts worth onboarding into.
- **R11 compounds R4c.** A hero image for an inactive mall is wasted upload effort.
- **R12 compounds R3.** Errors and analytics are adjacent concerns; a well-instrumented app is both harder to break silently and easier to debug when it does.
- **R14 compounds R1 + R3.** Vendor profile enrichment has value alone, but vendor-to-vendor follow + vendor-to-shopper social features need R1 (shoppers to follow) and R3 (engagement worth surfacing).
- **R15 compounds R9 + R1 + R12.** R9 native push is the single biggest technical reason to ship native; launching a store app without push is a visible gap. R1 accounts make the app meaningful beyond a feed reader. R12 error monitoring needs a native extension (Sentry React Native or equivalent). Also absorbs parked Q-006 Universal Links work during native deep-link setup.

---

## Recommended unlock-order (first pass)

Claude's recommendation, to be reviewed and overridden by David.

### Wave 1 — Infra unlocks (enables everything downstream)
1. **R3** — Analytics capture. Foundational.
2. **R12** — Error monitoring. Pairs naturally with R3 (same instrumentation mindset, adjacent surfaces).
3. **R4c** — Mall active/inactive. Highest-leverage admin item. Cleans pickers immediately and unlocks R10 + R13.

### Wave 2 — S-effort clean-up sweeps (ship fast, visible wins)
4. **R4a** — Admin: delete booth.
5. **R4b** — Admin: delete/replace hero image.
6. **R5a** — 30-day feed window.
7. **R7** — Contact us (+ beta feedback sub-task).
8. **R11** — Mall hero images. (Ships after R4c so only active malls show up with heros.)

### Wave 3 — Compliance + onboarding (pre-public-launch)
9. **R6** — ToS / privacy. Gating before R2.
10. **R8** — Intro animation + onboarding. Gating before wide shopper invite.

### Wave 4 — Epics (sprint-sized, need dedicated design phase)
11. **R1** — Guest profiles. Biggest swing. Enables R9, establishes auth pattern for R13/R14.
12. **R14** — Vendor profile enrichment. Scoped after R1 so shared auth/profile patterns are set once. Can ship independently of vendor social graph; social graph waits for R1.
13. **R5b + R2** — Tier design + Stripe. Scope together. Ships after R1 exists (tiers can exist for vendors alone, but the strategy is much stronger once shoppers exist).
14. **R13** — Mall-operator accounts. Last of the persona expansions. Needs R4c shipped and R1 auth pattern established.
15. **R9** — SMS / Push. Last because it compounds R1 + R3.

### Implied sequencing note

Waves 1 + 2 + 3 together are realistically ~9–14 sessions (mix of S + M). That lands the pre-beta polish arc properly. Wave 4 is five separate sprints, each likely 3–6 sessions.

---

## Detailed entries

### R1 — Guest / shopper profiles 🟡

**What:** Account creation for non-vendor users. Shoppers can:
- Persist liked / saved finds across devices and sessions
- Follow specific booths (push / email notification on new finds from that booth)
- Potentially: follow malls, follow tags

**Why:** Today "save" is localStorage-only. A wiped browser wipes a shopper's entire treasure list. Following booths is also the strongest retention mechanic Treehouse has on the shopper side.

**Open questions:**
- Anonymous Supabase sessions (`anon-auth` sub-agent in `MASTER_PROMPT.md`) vs. full email/OTP signup vs. both (anon → promote to claimed account).
- Does "following a booth" generate a separate feed surface, or just notifications?
- How does this intersect with R1-adjacent parked "Claim this booth" (currently Sprint 6+)? The claim flow might belong here.
- Identity model: one email = one account, roles (shopper | vendor | admin) layered on top? Or parallel tables?

**Design prereq:** Yes — new surfaces (signup, profile, saved-finds list, followed-booths list) all need mockups.

---

### R2 — Stripe vendor subscriptions 🟡

**What:** Paid vendor subscriptions. Free tier + one or more paid tiers differentiated by active-find caps and/or feature access.

**Why:** Monetization. Also a natural gate against low-quality vendor accounts — friction filters.

**Open questions:**
- Tiers — what does the free tier actually limit? (See R5b.)
- Billing portal — Stripe-hosted vs. in-app?
- Failed-payment handling — grace period? Booth hidden? Account frozen?
- Treehouse vs. mall-level billing — does the mall operator eventually become a customer instead of/in addition to the vendor?

**Design prereq:** Yes — pricing page, subscription-status UI in vendor dashboard, dunning email templates.

**Dependencies:** R5b decision (not ship) must precede Stripe shipping, otherwise tiers are arbitrary.

---

### R3 — Analytics event capture 🟡

**What:** Supabase-backed event store for: `post_liked`, `post_saved`, `post_unsaved`, `booth_visited`, `post_viewed`, `share_sent`, `share_opened`, `filter_applied`. Accessible via an admin view for aggregate reporting.

**Why:** Every product decision downstream — how aggressive the 30-day cutoff should be, what the free-tier cap is, which surfaces to double down on — improves with data. Shipping R3 early is a compounding bet.

**Open questions:**
- Table shape: single wide `events` table vs. typed tables per event?
- Client-side batching vs. immediate write?
- Retention policy (indefinite vs. rolling window)?
- Admin surfacing — dashboard in `/admin` or external (Metabase, Supabase built-ins)?
- PII handling — hashed shopper IDs vs. user-linked once R1 ships?

**Design prereq:** Low for instrumentation. Moderate for admin dashboard.

---

### R4a — Admin: delete booth 🟡

**What:** Admin-facing booth delete in `/admin`. Today the delete primitive exists on `/shelves` (shipped session 45), but `/admin` — the more natural admin surface — doesn't yet call it.

**Why:** Consolidates admin tooling. Avoids the admin needing to navigate to a vendor-facing page to do admin work.

**Open questions:**
- Soft-delete vs. hard-delete parity with `/shelves` existing behavior.
- Cascade: what happens to posts on a deleted booth? (Session-45 behavior is canonical.)

**Design prereq:** Low. Button placement in existing `/admin` tab.

---

### R4b — Admin: delete / replace hero image 🟡

**What:** Hero image upload on `vendor.hero_image_url` today is add-only. Add a remove/replace affordance on every surface where hero images are uploaded (vendor onboarding flow, `/admin`, `/shelves`).

**Why:** Vendors (and admin on behalf of vendors) cannot correct a bad upload today except by uploading a replacement — which requires knowing that the old URL gets overwritten (it does not, in all code paths). The feature is silently broken.

**Open questions:**
- Delete the storage object vs. null the column and leave the orphan? (Orphans bloat storage; deleting needs safe-ownership check.)

**Design prereq:** Low. Small affordance delta.

---

### R4c — Mall active/inactive toggle 🟢

> **Promoted 🟡 → 🟢 in session 56 (2026-04-24).** Full design record: [`docs/r4c-mall-active-design.md`](r4c-mall-active-design.md). Admin mockup: [`docs/mockups/r4c-admin-v1.html`](mockups/r4c-admin-v1.html). All six decisions D1–D6 frozen session 56 — implementation session runs as a straight sprint against the spec.

**What:** Three-state enum `malls.status` (`'draft' | 'coming_soon' | 'active'`) + `malls.activated_at` timestamp. Admin UI to toggle via new `/admin` `Malls` tab. Shopper-facing surfaces (feed picker, future map, vendor-request dropdown) filter to `active` only. Admin surfaces show all with status pills. Vendor-owned surfaces (my-shelf, shelf detail) still render their own mall regardless.

**Why:** Strategic UX lever. Today the 29 unactivated malls in Supabase pollute every picker. Activating as David visits each mall in person ("get them on the map") also doubles as a lightweight growth ritual — each activation is an event worth celebrating and potentially worth shopper-notifying once R9 lands.

**All six decisions frozen session 56** (see design record for full detail):
- D1 — three-state enum, not bool ✅
- D2 — vendors attached to inactive malls: hidden from shopper picker + feed, visible to self + admin ✅
- D3 — `activated_at` timestamp now; R3 event layer later ✅
- D4 — existing malls default to `draft` on migration; David activates post-deploy ✅
- D5 — admin toggle lives on new `/admin` `Malls` tab (4th position) ✅
- D6 — vendor-request dropdown filters to `active` only ✅

**Remaining open questions (deferred to implementation / downstream):**
- Exact amber-tint token for the "Coming soon" pill (implementation-session choice from existing tokens).
- Draft-section collapse threshold (~5).
- R10 map treatment of `coming_soon` pins (R10 scoping).
- Post-R1 "waitlist me" shopper signal on `coming_soon` malls (post-R9; not R4c's problem).

**Design prereq:** ✅ Complete. Mockup + scoping doc landed session 56.

**Unlocks:** R10 (map), R13 (mall-operator accounts).

---

### R5a — 30-day feed window 🟡

**What:** Feed query adds `WHERE created_at >= now() - interval '30 days'` (or equivalent). Posts older than 30 days silently roll off unless refreshed by the vendor.

**Why:** Forces vendor freshness. Keeps the feed from becoming an aging archive. Prompts low-frequency vendors to revisit and re-post.

**Open questions:**
- Does the vendor see their own old posts still on `/my-shelf`? (Probably yes — only the public feed rolls off.)
- Refresh mechanism — "bump" button on the vendor dashboard to reset `created_at`? Or require a new post?
- Does the 30-day window interact with R5b caps? (Probably: caps measure *active* posts, so expired posts no longer count.)
- What about sold posts — do they count toward the 30-day window? (Probably no; sold status already filters them out of the feed.)

**Design prereq:** Low for the filter itself. Moderate for the "your post is about to expire" UX on the vendor side.

---

### R5b — Per-vendor active-find cap 🟡

**What:** Configurable cap on the number of active posts per vendor at any time. Beta = no cap. Long-term = tier-aware (e.g., free = 9/week, paid tier = 50/week or uncapped).

**Why:** Two purposes. (a) Feed-quality lever — prevents a single vendor from flooding. (b) Subscription differentiation — the headline lever that justifies paid tiers.

**Open questions:**
- Unit: total active vs. rolling-week? (David's framing says per-week, suggesting rolling.)
- What happens when vendor is over cap — reject new post? Silently hide oldest?
- Does the cap interact with R5a's 30-day window? (Probably yes: expiring post frees a slot.)
- Tier shape: cap-only, or cap + feature gates (hero image, analytics access, etc.)?

**Design prereq:** Moderate. Vendor-side "X of Y posts this week" UI, tier-picker, blocked-new-post empty state.

**Couples with R2.**

---

### R6 — ToS / privacy / legal 🟡

**What:** Terms of service, privacy policy, cookie policy (if applicable). Linked from footer + onboarding + account creation.

**Why:** Gating for R2 (payments). Gating for any shopper account creation that captures PII beyond browser localStorage (R1). Generally required before broad public launch.

**Open questions:**
- Template-based (Termly, iubenda) vs. custom-drafted?
- Who owns updates when terms change?
- Does Treehouse need to handle COPPA / GDPR / California-specific?

**Design prereq:** Low for pages (boilerplate). Moderate for where the "I agree" checkboxes sit in flows.

---

### R7 — Contact us page 🟡

**What:** Public `/contact` route. Form submits to admin email, OR mailto link as v0. **Also absorbs beta feedback mechanism** — Tally.so link (or in-house form) lives here rather than as a separate epic.

**Why:** Basic legitimacy signal. Also the fallback channel for vendors who can't sign in or shoppers whose account is broken. Beta feedback is a natural sub-task of the same surface.

**Open questions:**
- Form vs. mailto for v0 (mailto is trivial; form needs reCAPTCHA-equivalent).
- Does this share architecture with vendor-request form?
- Tally.so embedded form vs. in-house form — cost of Tally.so indefinite subscription vs. one-time build.
- Separate "feedback" flow vs. a dropdown on a single contact form ("I have a question / I have feedback / I found a bug")?

**Design prereq:** Low.

---

### R8 — Intro animation + onboarding 🟡

**What:** First-time explorer (shopper) onboarding. Could be a splash animation, a carousel, a "tour the feed" overlay, or a `/welcome` landing page.

**Why:** New shoppers hitting the feed cold don't understand what Treehouse Finds *is*. Adjacent to long-parked KI-005 (pre-approval sign-in signaling gap) and the Sprint 6+ parked `/welcome` guest landing.

**Open questions:**
- Once-only (first visit) or every-visit-until-dismissed?
- For signed-in shoppers too, or only first-session visitors?
- Does this tie into R1's signup/claim flow?
- Vendor onboarding has its own Loom (parked Sprint 6+) — is this a single onboarding surface with two modes, or two separate flows?

**Design prereq:** High. Mockup-first mandatory.

---

### R9 — SMS / Push notifications 🟡

**What:** Push (web push API + service worker, plus native wrappers if Sprint 6+ native app lands). SMS as a secondary channel (Twilio or equivalent) for transactional moments.

**Why:** Retention. Shopper follows a booth (R1) → new find → push notification → return visit. Vendor posts a new find → SMS receipt of first shopper save → validation loop.

**Open questions:**
- Web push coverage — Safari/iOS push quality has improved but is still patchy. Native app may be required for real push reach.
- SMS cost model — who pays? Rate-limit strategy (already a lived issue per session 54's Supabase email cap).
- Opt-in UX — explicit permission moment tied to R1 signup, or contextual ("want push when this booth posts?").
- Do vendors get push too, or only email?

**Design prereq:** High. Notification preferences surface, opt-in moment, notification payload templates.

**Dependencies:** R1 (shoppers to notify) + R3 (events worth notifying about).

---

### R10 — Location map nav icon 🟡

**What:** Map view showing active malls (R4c). Refine-by-location to filter the feed to malls within range. Probably a new tab or a new overlay triggered from the existing filter.

**Why:** Discovery. Treehouse Finds is inherently geographic — the map makes that physical.

**Open questions:**
- Map provider — Mapbox, Google Maps, Leaflet + OSM tiles? Cost + brand fit.
- Location-permission UX — hard-gate ("grant location to see map") vs. soft-gate (show all active malls until user grants).
- Shopper-centered radius vs. mall-cluster view vs. both.
- Interaction with existing filter UI — does this *replace* the mall picker, or complement it?

**Design prereq:** High.

**Dependencies:** R4c (map without active/inactive gating is just as polluted as today's picker).

---

### R11 — Mall hero images in feed header 🟡

**What:** `malls.hero_image_url` column. When a shopper filters the feed by a specific mall (e.g., America's Antique Mall), the feed's hero section swaps in that mall's hero image.

**Why:** Visual reward for engagement. Also strengthens mall-level brand presence, which is an adjacent growth lever (mall operators see their venue featured → more likely to push vendor onboarding).

**Open questions:**
- Upload surface — admin-only initially, or mall operator directly when mall operator accounts exist (R13)?
- Fallback when no hero is set — use a default, or render the existing non-filtered hero?
- Interaction with R4c — presumably only active malls get hero uploads prioritized.

**Design prereq:** Low–moderate. Mostly a per-surface conditional render.

---

### R12 — Error monitoring (Sentry / structured logs) 🟡

**What:** Production error capture. Sentry (or equivalent) for client-side + server-side exception tracking. Structured logging on API routes with a log destination (Axiom, Betterstack, Vercel's built-in — pick one).

**Why:** Today errors that don't crash the page are invisible to David. A silently-broken `/api/share-booth` for some shopper's edge case would not surface until the shopper reports it (and they probably won't). Cost of missing this pre-beta: one bad bug invisible for weeks. Cost of adding: a few hours of setup. Compounds with R3 (analytics + error tracking are the same instrumentation mindset on adjacent surfaces).

**Open questions:**
- Sentry free tier fits Treehouse's volume comfortably; confirm pricing for beta-scale.
- Alert channel — email-only, or Slack / SMS for critical errors?
- Sampling rate — 100% for beta is fine; reconsider at scale.
- Source-map upload — wire into Vercel build.
- PII scrubbing — must not capture user emails or DB contents in error payloads.

**Design prereq:** None.

**Elevated from:** CLAUDE.md pre-beta polish list 2026-04-24.

---

### R13 — Mall-operator accounts 🟡

**What:** Third persona after shopper (R1) and vendor. Mall operators get their own account type with a dashboard to:
- Manage their mall's profile (name, hours, hero image — see R11)
- See vendors attached to their mall
- (Future) Invite/approve vendors directly
- (Future) See aggregate activity from their mall (depends on R3)

**Why:** Currently David is the sole administrator of mall records. Shifting that to mall operators themselves: (a) scales onboarding without David-time as the bottleneck; (b) gives mall operators a self-serve reason to stay engaged; (c) potentially becomes a billing relationship where the mall operator pays, not the individual vendor (or both).

**Open questions:**
- Does activating a mall (R4c) transfer to the mall operator, or does David retain activation rights?
- What subset of admin actions is mall-operator-scoped vs. Treehouse-admin-scoped?
- Invite flow — how does a mall operator prove they represent the mall? (Email-domain check? Phone verification? In-person token?)
- Billing — does R2 target individual vendors, mall operators, or both independently?
- How does this interact with the parked Sprint 6+ "mall vendor CTA"?

**Design prereq:** High. New dashboard, new permissions model, new onboarding flow. Mockup-first.

**Dependencies:** R4c (they need a live activation mechanic to manage). Shares auth infrastructure with R1; best designed after R1's role/permission model is in place.

**Elevated from:** This doc's "Open additions" section, 2026-04-24.

---

### R14 — Vendor profile enrichment + vendor social graph 🟡

**What:** The vendor-side counterpart to R1. Today the `vendors` table carries `name`, `booth_number`, `mall_id`, `hero_image_url`, `user_id` — minimal. R14 expands this into a richer vendor profile:
- Bio / about section (story, years in business, specialties)
- Multiple photos beyond the single hero
- External links (Instagram, website, Etsy)
- Contact preferences
- Vendor-to-vendor follow (vendors can follow each other, see each other's new finds)
- Future: shopper-to-vendor follow surfaces (how shoppers discover vendors beyond the feed)

**Why:** A vendor's booth page is currently thin — it's essentially a list of their posts. Shoppers often want to know *who* the vendor is, not just what they're selling. Enrichment also gives vendors more reasons to log back in between post drops (maintaining their profile, discovering other vendors). David flagged this as an oversight from the 2026-04-24 capture — R1 covers the shopper half of the account story, R14 covers the vendor half.

**Open questions:**
- Where does the enriched profile render — on `/shelf/[slug]` directly, or a new `/vendor/[slug]/about` tab?
- Vendor-to-vendor follow: does it generate a feed ("vendors I follow"), or just notification pings?
- Is there value in vendor-to-mall follow (vendor following the entire mall for co-vendor awareness)?
- How does this interact with R1's "follow a booth" — is that the same mechanism, or separate user flow?
- Does the enriched profile require a design refresh of `/shelf/[slug]` that conflicts with the session-49 v1.2 redesign?

**Design prereq:** High. Mockup-first.

**Dependencies:** Enrichment itself is independent (vendors already have accounts). Vendor-to-vendor social graph compounds with R1 (shared follow infrastructure) and R3 (engagement events worth surfacing).

**Elevated from:** Session 55 capture review — David flagged the vendor half of R1 as an oversight worth capturing.

---

### R15 — App store launch (iOS + Google Play) 🟡

**What:** Native-shell Treehouse Finds submitted to the Apple App Store and Google Play. One item (not two) because the technical path chosen almost always covers both platforms together.

**Three possible technical paths — decision pending:**

| Path | Timeline | Trade-off |
|------|----------|-----------|
| **(a) Capacitor / PWA wrapper** | ~6 weeks | Reuses existing Next.js codebase. Ships store presence fast. Limited native feature access. Harder path to first-class iOS push. |
| **(b) Expo / React Native rebuild** | ~4–6 months | Real native, first-class push, full system integration. OTA updates via EAS Update partially preserve the "fix without re-review" model. Rebuild of UI layer required. |
| **(c) Native Swift + Kotlin** | ~8–12 months | Highest quality ceiling. By far the biggest ongoing maintenance cost. Rarely justified for a solo-operator product. |

**Why:** Three overlapping motivations. (a) Store presence is a trust signal — "is this a real app?" answered by showing up in search results. (b) Push notifications (R9) on iOS essentially require native. (c) The core retention loops — follow-a-booth + new-find alerts — are dramatically richer with native push and system-level integration.

**Open questions (mostly path-dependent):**
- Path (a/b/c) — the single load-bearing decision. Changes timeline by an order of magnitude and changes everything about what gets built vs. reused.
- Target first-native-feature: is the goal store presence parity with web, or store presence + push + account-first experience? Different answers suggest different paths.
- OTA update story — Expo EAS Update bypasses app review for JS changes; Capgo does similar for Capacitor. Changes iteration velocity significantly and should factor into the path decision.
- App-review cadence tolerance — first submissions can take 1–3 weeks; patch releases usually 24–48 hours. Adjust release rhythm accordingly.
- Brand asset bundle — icon (1024px square), screenshots (5–10 per platform, often per device size), store listing copy, possibly a promo video. This is a mini-design-sprint on its own.
- Developer accounts — Apple ($99/yr), Google ($25 one-time). Who holds the legal entity — Zen-Forged or an individual? Tax implications for future Stripe integration (R2).
- Privacy labels / data collection disclosures — iOS App Store "nutrition labels" require auditing every external service the app touches (Supabase, Resend, Sentry once R12 ships, any analytics once R3 ships). This audit is part of the submission.
- Deep linking — Universal Links (iOS) + App Links (Android) absorbs the parked Q-006 deep-link CTA work.
- Native permissions flow — camera/photos for post uploads becomes a native system dialog rather than a browser prompt.
- CI/CD — EAS (Expo) vs. Fastlane (native) vs. Capacitor CLI. Pipeline choice compounds with path choice.

**Design prereq:** High. Store listing assets alone are a design sprint. UX impact depends on path — wrapper has low impact, rebuild has full re-skin implications.

**Dependencies:**
- **Hard gate: R6 (ToS/privacy).** Both stores require a live privacy policy URL. R15 cannot submit without R6.
- **Strongly recommended before launch: R9 (push), R1 (accounts).** Launching to stores without these is possible but misses the primary reason users install vs. bookmark.
- **Needs native extension: R12 (error monitoring).** Sentry supports React Native / Capacitor / native; configuration is path-specific.
- **Absorbs: Q-006 Universal Links (parked in Sprint 6+).** Natural byproduct of native deep-link setup.

**Elevated from:** Session 55 grouping/priority review — David flagged app store launch as a major-item capture gap missed in the 11-item + 3-elevated initial pass.

---

## Items absorbed from CLAUDE.md parked lists

These were already tracked somewhere in CLAUDE.md but are semantically related to the captured items above. Cross-referencing here so they are not double-planned later.

| Parked item | Related captured item | Disposition |
|-------------|----------------------|-------------|
| `Claim this booth` (Sprint 6+) | R1 (guest profiles) | Fold into R1 design. The claim flow is a special case of account creation. |
| `ToS/privacy` (Sprint 6+) | R6 | Same item. R6 supersedes. |
| `vendor directory` (Sprint 6+) | R10 (map) | Adjacent but distinct. Directory is list-based, map is geographic. Decide at R10 scoping whether to merge or keep parallel. |
| `native app eval` (Sprint 6+) | R9 (push) | R9 is the strongest business case for a native app. Bundle the eval into R9 scoping. |
| `/welcome` guest landing (Sprint 6+) | R8 (onboarding) | Same item. R8 supersedes. |
| `feed pagination + search` (Sprint 6+) | R5a (feed window) | Adjacent. Pagination becomes easier once R5a caps feed length; search is independent. |
| KI-005 pre-approval sign-in signaling gap | R1 + R8 | Resolved at R1/R8 scoping. |
| `PWA pull-to-refresh` (Sprint 5) | — | Not related to any captured item. Remains parked. |
| `Post-approval booth-name edit surface` (Sprint 5) | — | Not related. Remains parked. |
| `Error monitoring` (Sentry, pre-beta polish) | R12 | Elevated during session 55 capture review. See R12. |
| `Beta feedback mechanism` (Tally.so, pre-beta polish) | R7 | Folded in as sub-task of contact us. See R7 open questions. |
| `Mall-operator accounts` (implied by R11 + R4c + "mall vendor CTA") | R13 | Elevated during session 55 capture review. See R13. |
| `Universal Links` (Sprint 6+, gating Q-006 deep-link CTA) | R15 | Absorbed during session 55 cluster review. Natural byproduct of native deep-link setup regardless of technical path. |

---

## Open additions (outstanding — not yet elevated)

Items flagged during capture but left parked pending future review:

- **Feed search** — parked; post-beta; unrelated to any captured item but would eventually need its own entry here. Partial overlap with R5a (shorter feed means search is less urgent).

### Resolved during session 55 capture review

- ~~Error monitoring~~ → **elevated as R12**.
- ~~Beta feedback mechanism (Tally.so)~~ → **folded into R7**.
- ~~Mall-operator accounts~~ → **elevated as R13**.
- ~~Vendor profile enrichment~~ → **elevated as R14** (surfaced during review as the vendor-side counterpart to R1, which was originally captured as shopper-only).
- ~~App store launch~~ → **elevated as R15** (surfaced during cluster/priority review as a major-item gap missed in the initial 11 + 3 pass).

---

## Clusters & Shipping horizons

> Added session 55 after initial capture. Complements — does not replace — the Wave 1–4 unlock order above. **Waves** are session-granular ("what ships next"); **Horizons** are narrative-granular ("what phase is the product in"). They agree on sequence but differ in grain; pick the lens that fits the planning moment.

### Eight clusters

Items grouped by shared infrastructure, shared design surface, or shared decision moment — not by shipping order.

| Cluster | Items | Shared concern |
|---------|-------|----------------|
| **A — Identity & Accounts** | R1, R13, R14 | Auth schema, role model, profile surfaces. Design the role model once; three items share it. |
| **B — Monetization & Quality Gates** | R2, R5a, R5b | Tier definition drives Stripe and caps simultaneously. Feed-window is the adjacent quality lever. |
| **C — Admin Sweep** | R4a, R4b | Two small admin fixes. Realistically batchable in one session. |
| **D — Discovery & Location** | R4c (anchor), R10, R11 | Mall-surface story. R4c unlocks the other two. |
| **E — Legal & Support** | R6, R7 | Public information pages. Batchable. R6 is a hard gate for R15. |
| **F — First-Run UX** | R8 | Mostly standalone; adjacent to R1's signup flow. |
| **G — Instrumentation** | R3, R12 | Same mindset — structured events + structured errors. Ship together. |
| **H — Engagement + Reach** | R9, R15 | Native / push story. Compounds heavily with A + G. Biggest investment on the board, highest-leverage at scale. |

### Three shipping horizons

Each horizon represents a coherent "state of the product." All timing estimates are working assumptions subject to David's pacing.

**Horizon 1 — V1 beta foundation (~2–3 months)**
1. **Cluster G** (R3 + R12) — Instrumentation. Start capturing data before decisions depend on it.
2. **Cluster D anchor** (R4c) — Mall active/inactive. Biggest UX pollution fix today. Unlocks D-rest.
3. **Cluster C** (R4a + R4b) — Admin clean-ups. One session, fast visible wins.
4. **R5a** — 30-day feed window. Single query filter.
5. **Cluster E** (R6 + R7) — Legal + Contact. Boilerplate but R6 gates Horizon 3.
6. **Cluster D rest** (R10 + R11) — Map + mall heros. Ships if Horizon 1 pace allows.

**Horizon 2 — Identity & polish (~3–6 months)**
7. **Cluster A** (R1 → R14 → R13) — Account system. Design the role model once for all three. Sequence: shopper accounts first, vendor enrichment second, mall-operator accounts last.
8. **R8** — Onboarding. Ships after R1 because it depends on having an account flow to onboard into.

**Horizon 3 — Monetization & reach (~6–12 months)**
9. **Cluster B rest** (R5b + R2) — Tier definition + Stripe. Scope together.
10. **Cluster H** (R9 + R15) — Push + App Store. **R15 path decision (a/b/c) is the load-bearing scoping moment.** If path (a) Capacitor wrapper: R9 can ship parallel or before. If path (b) Expo rebuild: R9 is absorbed into R15's technical scope. If path (c) native rebuild: same as (b) but longer.

### Decision-urgency callouts

Items that need to be *decided* well before they *ship*. Enter these design conversations in Horizon 2, even though their shipping sits in Horizon 3:

- **R15 technical path (a / b / c)** — determines Horizon 3's entire timeline. Changes by an order of magnitude based on the answer. Biggest open decision on the whole board.
- **R5b tier shape** — "what does the free tier actually allow" is a product-identity decision, not just an engineering one. Scope before R2 freezes.
- **R1 role model** — the schema decision here dictates R13 and R14 migrations. Worth a deliberate design session before R1's first migration lands.

Everything else can be decided at the moment of scoping for each item.

---

## Maintenance

- When an item moves from 🟡 → 🟢, add a brief design-decision record inline (or link to `docs/mockups/` + a dedicated design doc).
- When an item moves from 🟢 → 🔵, add the `docs/queued-sessions.md` entry and update status here to link across.
- When 🔵 → ✅, tombstone inline and cross-ref the merge commit.
- Every session open standup should scan this doc for items newly unblocked by shipped work.
- `CLAUDE.md` Sprint 6+ section should link here rather than maintaining its own parallel list. New captures go here first, get referenced from CLAUDE.md second.

---

> Last updated: 2026-04-24 (session 56 — R4c promoted 🟡 Captured → 🟢 Ready; design record at `docs/r4c-mall-active-design.md`, admin mockup at `docs/mockups/r4c-admin-v1.html`. All six decisions D1–D6 frozen. First roadmap item to move to Ready.)
>
> Last updated: 2026-04-24 (session 55 — initial capture of 11 items from David's 2026-04-24 standup + 3 elevated during capture review: R12 error monitoring, R13 mall-operator accounts, R14 vendor profile enrichment + 1 elevated during cluster/priority review: R15 app store launch. Clusters + shipping horizons section added.)
