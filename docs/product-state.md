# Treehouse Finds — Product Source of Truth

> **Purpose:** single doc capturing what the app IS today — features, benefits, selling points, and honest gaps. Audience is internal/founder, investor, and marketing copy upstream. Written grounded in shipped code, not aspirational state.
>
> **Last updated:** 2026-05-01 (session 99)
> **App:** [app.kentuckytreehouse.com](https://app.kentuckytreehouse.com)
> **Stack:** Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Resend · Vercel

---

## Product definition

**Treehouse Finds is a mobile-first PWA that turns brick-and-mortar antique mall booths into a browsable, shareable digital storefront — for the shoppers who walk the malls and the vendors who run the booths.**

A vendor snaps a photo of an item's tag; AI reads the title and price and writes the caption. The find appears in a curated feed scoped to the mall it's in. Shoppers save what catches their eye, follow specific booths, and share window-shopping snapshots back to friends. A separate reseller-intel layer (`/scan` / `/decide`) gives power-users live eBay comps for items they're considering buying.

---

## Personas

| Persona | Auth state | What they show up to do |
|---|---|---|
| **Shopper** | Unauth (today) | Browse the mall feed, save finds, bookmark booths, share with friends |
| **Vendor** | Email/OTP | List finds, manage booth(s), share window snapshots with their customers |
| **Admin** | Email/OTP + allowlist | Approve vendors, manage malls, edit/delete any booth or find, review analytics |
| **Reseller** *(power-user shopper variant)* | Unauth | Identify items via AI, pull eBay comps, decide whether to buy |

Future personas: **mall-operator** (R13), **claimed-booth vendor** (parked).

---

## Features by persona

### Shopper

- **Mall feed** — 2-column polaroid masonry of available finds, filtered by mall (`/`)
- **Mall picker** — bottom-sheet location selector with find-counts; "All Kentucky Locations" mode (`MallSheet`)
- **Find detail** — full photo, title, price, caption, cartographic mall + booth block (`/find/[id]`)
- **Save / heart toggle** — one-tap save on every tile; reflects on `/flagged` (localStorage)
- **Saved finds map** — all saves grouped by booth with mall filter (`/flagged`)
- **Booth bookmark** — star a booth to keep it on `/shelves` filter (localStorage)
- **Booth detail / window** — booth's available finds in window (window-shopping view) or shelf grid (`/shelf/[slug]`)
- **Booth directory** — every active vendor across malls, filterable by saved booths (`/shelves`)
- **Share find** — native share sheet + clipboard fallback (find detail masthead)
- **Share booth** — open share for unauthenticated viewers (Q-008 family)
- **Contact** — email links for support, vendor inquiries, mall-operator outreach (`/contact`)

### Vendor

- **My Shelf** — own booth's available finds in window/shelf view, multi-booth picker (`/my-shelf`)
- **Add Find sheet** — camera + gallery picker, mobile-first (`AddFindSheet`)
- **Tag capture step** — photo of booth tag → AI extracts title + price (`/post/tag`)
- **AI caption generation** — Claude vision reads item photo, drafts Treehouse-voice caption + title (`/post/preview`)
- **Find publish** — review + form-submit publish ("Post changes" pattern as of session 98) (`/post/preview`)
- **Find edit** — title, price, caption, status, remove from shelf (`/find/[id]/edit`)
- **Booth setup** — vendor onboarding, mall + booth number, photo upload (`/setup`)
- **Booth name self-edit** — display_name editable from `/my-shelf` chrome (Wave 1 Task 4)
- **Booth hero photo** — upload / replace / delete via `EditBoothSheet`
- **Multi-booth model** — same email can own multiple booths; switch via `BoothPickerSheet`
- **Window-share email** — curate up to 6 finds + send a post-it-styled booth snapshot to a customer's email (`ShareBoothSheet` + `/api/share-booth`)
- **Vendor request** — prospective-vendor application form, admin-approved (`/vendor-request`)

### Admin

- **Posts tab** — list, filter, delete any find across the platform
- **Vendor Requests tab** — review pending applications, approve with collision diagnosis
- **Vendors tab** — browse all booths, inline edit, delete (typed-name confirmation)
- **Malls tab** — manage malls, set hero images, toggle status (`draft` / `coming_soon` / `active` per R4c)
- **Analytics tab** — R3 event stream, paginated, filter chips
- **Featured banner control** — admin-edit home-feed hero image
- **Booth impersonation** — `?vendor=<id>` param on `/my-shelf` and `/post/preview` for admin-on-behalf actions
- **Booth chrome on `/shelves`** — Pencil + Trash bubbles render only for admins, opening edit + delete sheets

### Reseller (power-user shopper)

- **Scan entry** — camera/gallery picker, dark theme (`/scan`)
- **Identify** — Claude vision returns title + confidence + attributes (`/discover`)
- **Decide** — eBay sold + active comps via SerpAPI, market velocity bar, break-even pricing, opportunity meter (`/decide`)
- **Tell the story** — Claude generates marketing-narrative copy for items being resold (`/share`, `/api/story`)
- **Saved finds** — local-only inventory of items the reseller is tracking (`/finds`)
- **Comp-quality reporting** — flag bad comps, captured to Notion via `/api/report-comps`

---

## What makes this app *this app* — non-obvious functionality

- **Tag-to-listing in seconds** — vendor photographs the booth's existing handwritten/printed price tag; Claude reads it; the find is publishable in under 30 seconds. Eliminates the typing step that kills most vendor-listing workflows.
- **AI caption in the Treehouse voice** — captions read like editorial copy, not marketplace listings. "Mid-century brass figure with the patina of a thousand mantels." Tunable via prompt without per-vendor work.
- **Treehouse Lens** — canvas-based brightness/saturation/contrast bump applied to scanned items in the reseller layer; turns harsh fluorescent mall lighting into something that photographs like product imagery.
- **Polaroid evolved tile pattern** — every find renders on warm cream paper with a 7px photo mat and dimensional drop shadow. Editorial / collectible aesthetic, not marketplace grid.
- **Cartographic mall blocks** — find detail shows a pinned, post-it-styled mall + booth pairing that links to the booth's window. The find is anchored to a *real place*.
- **Multi-booth vendor model** — one email can own several booths across malls; vendor switches via picker. Reflects how real antique-mall vendors actually operate.
- **Window-share email** — vendor curates 6 finds and emails a post-it-styled snapshot to a customer. Rendered with cross-client-tested HTML (4 mail clients audited; Gmail / Outlook hostile primitives documented).
- **Mall active/inactive toggle** — admin can stage malls without polluting shopper pickers (`draft` / `coming_soon` / `active`).
- **PWA install** — installable on iOS + Android home screens; no app store dependency for v1.

---

## Benefits — user-facing wins

| Persona | Benefit | Driver |
|---|---|---|
| Shopper | "I can browse the antique mall before driving there" | Mall-scoped feed, polaroid tiles, booth window views |
| Shopper | "I won't lose the things I want to come back to" *(today: only on this device)* | Save / heart toggle |
| Shopper | "I can show my friend the cool thing I saw" | Native share + open share for unauth'd recipients |
| Shopper | "I can keep an eye on my favorite booths" *(today: just bookmarks; notifications coming)* | Booth bookmarks, R9 notifications future |
| Vendor | "I list a find in 30 seconds without typing" | AI tag extraction + caption generation |
| Vendor | "My listings look like a magazine, not Craigslist" | Polaroid + Lora editorial system |
| Vendor | "I run multiple booths from one login" | Multi-booth model + picker |
| Vendor | "I can send my customers a curated snapshot of new arrivals" | Window-share email |
| Admin | "I can clear pollution from shopper-facing pickers without deleting data" | Mall active/inactive |
| Admin | "I can fix vendor data without sending tickets" | `/shelves` + EditBoothSheet end-to-end edit |
| Reseller | "I scan an item and know if it's worth flipping in 10 seconds" | Identify + Decide + comps |

---

## Main selling points — distilled positioning

> **For shoppers:** *Treehouse Finds turns walking your favorite antique malls into something you can do from the couch. Browse curated finds by location, save what catches your eye, follow the booths you love.*
>
> **For vendors:** *Photograph the tag — we'll do the rest. AI reads the price, writes the caption, and posts your find in under 30 seconds. Ten times more listings, none of the typing.*
>
> **For investors:** *Treehouse Finds is a digital layer over the offline antique-mall economy. We're the only mall-aware, AI-native, vendor-friendly listing surface in the category. Brand-grade aesthetics, instant vendor onboarding, and a built-in reseller intel product give us three monetization paths from day one — vendor subscriptions, mall-operator accounts, and reseller tooling.*
>
> **For app stores:** *Discover, save, and share antique-mall finds across Kentucky's best vintage shopping. AI-curated listings from real local booths, updated in real time.*

---

## Detractors — internal honest

The list below is current state, not roadmap promises. Brutal version for founder use.

### Auth / accounts
- **Shoppers have no accounts.** Saves and booth bookmarks are localStorage-only. Browser wipe = loss of everything. No cross-device sync. No way to ping a shopper that their bookmarked booth posted something new.
- **No password auth.** OTP-only — some users (especially older mall demographic) actively dislike OTP flows.
- **No "claim this booth" flow.** A vendor whose booth was indexed by an admin can't promote themselves into ownership without an admin manually approving them.
- **No mall-operator accounts.** Mall operators have no way to self-serve onboard their mall, set hero images, or manage their vendor roster.

### Engagement
- **No push or SMS notifications.** Hardest gap. Shoppers can save and bookmark but have no signal when something they'd care about ships.
- **No in-app messaging.** Shopper ↔ vendor communication is mailto links only.
- **No comments / reactions / reviews on finds.** Engagement is binary save/unsave only.
- **No "shopper sent me this find" inbox.** Sharing is fire-and-forget; no return signal that a recipient acted on it.

### Discovery
- **No search.** Text search exists in the data layer but isn't surfaced to shoppers. Filtering is mall-only.
- **No mall map nav.** Malls live in a list; no spatial discovery (R10).
- **Pagination is unbounded.** Feed shows 30 days; no scroll-pagination cap. Will degrade above ~100 posts/mall.

### Vendor experience
- **No vendor analytics.** Vendors can't see how many shoppers viewed / saved their finds. Admin sees R3 events; vendors don't.
- **No vendor profile / social.** No vendor bio, vendor-to-vendor follow, vendor-to-shopper follow. Booths are listings, not personalities.
- **No vendor subscriptions / billing.** Free tier only. No way to charge today.
- **No bulk operations.** No CSV import, no batch find creation, no batch delete.

### Reseller layer
- **Reseller layer is paradigmatically separate.** Dark theme, different visual system, different navigation. Built as a side product; never fully unified with the mall-shopping experience.
- **Reseller saves are local.** Same localStorage limit as shopper saves; no cross-device.
- **Reseller comp data is read-only.** No way to track price-realized vs predicted post-sale.

### Trust / moderation
- **No shopper-flag / report flow.** Bad listings can only be removed by admin; no community moderation.
- **No content guidelines surface.** Vendor approval is admin-judgment; no public terms.
- **No legal infrastructure.** No published privacy policy, terms of service, or DMCA process (R6 — gates app store launch).

### Distribution
- **PWA-only.** No iOS / Google Play presence (R15). PWA install rate is significantly lower than store-installed apps among older mall demographics.
- **No deep linking from native share / SMS** — Universal Links not configured (Q-006 parked).

### Operational
- **Single-region.** Kentucky-only by design today. Cross-state expansion would require mall-operator infrastructure (R13) and changes to mall picker, search, location semantics.
- **AI rate limits in-memory.** 10 req/IP/60s; doesn't survive Vercel function cold starts. Acceptable for current scale.
- **No content backup beyond Supabase defaults.** No point-in-time recovery; no cross-region replication.

---

## Detractors — roadmap-framed (external/investor)

Same gaps as above, framed as forward motion. Use this version in investor updates and store-listing copy. Items reference [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md).

| Gap today | Coming next | Roadmap |
|---|---|---|
| Saves don't sync across devices | Shopper accounts with persistent saves + cross-device sync | **R1** (next major sprint) |
| No notification when a favorite booth posts | Push + SMS notifications when followed booths post new finds | **R9** (depends on R1) |
| Free for vendors today | Tiered vendor subscriptions with active-find caps and feature access | **R2** |
| Mall list, not a map | Visual mall map with active/inactive gating | **R10** (R4c shipped) |
| Mall heros generic | Custom hero photography per mall | **R11** ✅ shipped |
| Errors not centrally tracked | Production error monitoring with PII scrubbing | **R12** ✅ shipped |
| Mall-operators self-onboard manually | Self-serve mall-operator accounts with vendor roster management | **R13** |
| Vendor profiles minimal | Vendor enrichment + vendor social graph | **R14** |
| PWA-only | iOS + Google Play app store presence | **R15** (depends on R6 legal) |
| Onboarding is implicit | Guided shopper + vendor onboarding flows | **R8** |
| Browse-only feed | Search + tag filtering + advanced discovery | Future epic |

---

## Cross-references

- Architecture, schema, routes, API table → [`CONTEXT.md`](../CONTEXT.md)
- Forward-looking roadmap (R1–R15) → [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md)
- Visual / brand system spec → [`docs/design-system.md`](design-system.md)
- Brand rules + tech rules + decision gate → [`docs/DECISION_GATE.md`](DECISION_GATE.md)
- Vendor onboarding journey → [`docs/onboarding-journey.md`](onboarding-journey.md)

---

*This doc is the live snapshot. When features ship that change the answers above (notably: R1 shopper accounts, R2 subscriptions, R9 notifications, R15 app store), update this file in the same session as the feature ships.*
