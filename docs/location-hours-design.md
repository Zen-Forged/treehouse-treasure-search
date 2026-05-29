# Location Hours — Shape B Design Record (Open-now badge via Google Places API)

> **Status:** 🟢 Ready for implementation. Design pass complete session 203.
> **Predecessor:** Shape A (deep-link to Google listing) shipped session 203, commit `75bd5af`.
> Shape A's "Hours on Google ›" link becomes Shape B's **graceful fallback layer** (see D9).

---

## 1. Context

Shoppers deciding whether to visit a real mall need the bridge's most load-bearing
fact: *can I go right now?* Shape A routes them to Google's listing (where hours
render). Shape B brings the **at-a-glance** answer onto Treehouse's own surfaces as
an "Open now · closes 6 PM" badge, while still reading hours from the merchant's
Google Business Profile so nothing is hand-maintained.

**Source:** Google Places API (New) — `regularOpeningHours` / `currentOpeningHours` /
`businessStatus` / `timeZone`. The one source merchants keep current.

**Cost (verified session 203):** opening-hours fields sit in the **Place Details
(Enterprise)** SKU — **$20 / 1,000 calls, 1,000 free/month** (post-March-2025 per-SKU
free tier). At ~29 malls × weekly refresh ≈ **125 calls/month → $0**. First paid call
would require ~100+ malls *and* daily refresh. The real cost is a billing card on file
(de-risked by a hard quota cap), one-time place_id resolution, and ~1–2 sessions of build.

---

## 2. Frozen decisions

| # | Decision |
|---|---|
| **D1** | **Source SKU:** Place Details (New, Enterprise field mask). Field mask: `id,regularOpeningHours,currentOpeningHours,businessStatus,timeZone,utcOffsetMinutes`. The mask is load-bearing — Google bills by the highest-tier field requested, so we request exactly these and nothing atmosphere-tier (photos/reviews would jump cost). |
| **D2** | **Refresh:** weekly Vercel cron. ~125 calls/month, deep inside the 1,000 free cap. Hours rarely change week-to-week. |
| **D3** | **Display surfaces:** MallBlock (`/shelf/[slug]` + `/my-shelf`), SavedMallCardV2 (Saved), PinCallout (`/map`). The decide-to-visit surfaces. |
| **D4** | **Badge content:** status + next boundary. `Open now · closes 6 PM` / `Closed · opens 9 AM` / `Closed · opens Mon 9 AM`. |
| **D5** | **Badge↔link:** the badge **replaces** the standalone "Hours on Google ›" link and is itself tappable → Google listing. One affordance: glance + full-hours destination. |
| **D6** | **Schema (migration 025):** add to `malls` — `place_id text`, `hours_json jsonb`, `hours_timezone text` (IANA), `business_status text`, `hours_fetched_at timestamptz`. All nullable. |
| **D7** | **place_id resolution:** one-time backfill script (Text Search per mall, ~29 free calls) writes `malls.place_id`. Future malls: fold place_id resolution into `scripts/add-mall.ts` at add-time (Tier B / fast-follow). |
| **D8** | **"Open now" is computed at display time, never stored.** A pure `lib/mallHours.ts` fn takes `hours_json` + `hours_timezone` + a `Date` → `{ state, nextBoundary }`. Reflects "now" on every render. Timezone-aware via `Intl.DateTimeFormat` with the mall's IANA zone (KY straddles Eastern + Central — D11). |
| **D9** | **Fallback ladder.** No `place_id` resolved / no listing / no published hours → degrade to the **Shape A deep-link** ("Hours on Google ›"). The badge only renders when `hours_json` is present and parseable; otherwise the session-203 link shows. Shape A is the floor, Shape B the enrichment. |
| **D10** | **Badge states:** `open` (green dot) · `closing_soon` (amber, within 60 min of close) · `closed` (grey) · `open_24h` ("Open 24 hours") · `closed_temporarily` / `closed_permanently` (from `businessStatus`, grey, explicit copy) · `unknown` → fallback per D9. |
| **D11** | **Timezone:** per-mall IANA zone from Places `timeZone` (Louisville → `America/New_York`, Owensboro/Paducah → `America/Chicago`). Stored in `hours_timezone`; `lib/mallHours.ts` computes against it. Must be tested in both zones. |
| **D12** | **Cron auth:** `/api/cron/refresh-mall-hours` gated by `CRON_SECRET` bearer check (Vercel cron sends it). Iterates `status='active'` malls only. |
| **D13** | **Badge treatment (recommended, dial on smoke route):** status dot + Inter ~11.5px text, **no pill** — matches the quiet aesthetic of the link it replaces on MallBlock. Dot carries the color signal; text in `v2.text.secondary`. On PinCallout's tighter space, collapses to dot + "Open"/"Closed". Final visual dialed during Arc 3 iPhone QA, not pre-mocked (prose-model-first; near-conventional pattern). |
| **D14** | **Analytics (migration to extend `event_type` enum + whitelist per session-194 enum-completeness lesson):** `mall_hours_badge_tapped` `{ mall_slug, surface, open_state }`. Cron logs refresh count server-side (no per-mall event). |

---

## 3. Risk register

| Risk | Mitigation |
|---|---|
| Billing card on file → runaway-loop / misconfig charges | **Hard quota cap** in Cloud Console (Place Details ≤ ~100/day) — billing past the cap is structurally impossible. + key restricted to Places API + referrer/IP. + budget alert. |
| A mall has no Google listing / place_id resolution misses | D9 fallback ladder → Shape A deep-link still works (search-by-name). Badge simply doesn't render. |
| KY two-timezone "open now" wrong | D11 per-mall IANA + unit tests on `lib/mallHours.ts` in both zones. |
| Across-midnight / closing-soon boundary bugs | `lib/mallHours.ts` is a pure, unit-tested fn; smoke route renders all D10 states against fixtures. |
| Places API (New) field-mask misuse → wrong SKU/cost or missing fields | D1 mask frozen + asserted in `lib/googlePlaces.ts`; smoke-verify one call's billed SKU in Cloud Console before wiring the cron loop. |
| `businessStatus` = CLOSED_TEMPORARILY/PERMANENTLY | Explicit D10 states; don't show "Closed · opens…" for a dead listing. |

---

## 4. Implementation arcs (smallest → largest)

- **Arc 0 — 🖐️ HITL (~15–20 min, David):** GCP project → enable **Places API (New)** → create API key → restrict (Places API only + referrer/IP) → **set hard quota cap** on Place Details → budget alert → add `GOOGLE_PLACES_API_KEY` to Vercel (Prod + Preview) + `.env.local`. **Prerequisite for Arc 2.**
- **Arc 1 — schema + place_id backfill:** migration 025 (D6) + `scripts/backfill-mall-place-ids.ts` (one-time Text Search per active mall → `place_id`; HITL-run, mirrors `add-mall.ts` conventions) + `Mall` type extension in `types/treehouse.ts`.
- **Arc 2 — fetch + cron:** `lib/googlePlaces.ts` (Place Details w/ D1 mask) + `/api/cron/refresh-mall-hours` (D12) + `vercel.json` weekly cron entry + `CRON_SECRET`. Manual-trigger once to populate, verify billed SKU in Cloud Console.
- **Arc 3 — compute + badge primitive (testbed-first):** `lib/mallHours.ts` pure fn + unit tests (both timezones, all D10 states) + `<MallHoursBadge>` primitive in isolation + `/mall-hours-test` smoke route rendering all states. iPhone QA dials D13 visual.
- **Arc 4 — consumer wiring:** `<MallHoursBadge>` into MallBlock (replaces the Shape A link per D5, deep-link retained as D9 fallback) + SavedMallCardV2 + PinCallout + D14 analytics (event-enum migration). Final iPhone QA across all 3 surfaces in both timezones.

---

## 5. Tier B headroom (deferred)

- Tap-to-expand full week schedule inline (Q2 option 4).
- Home/Explore scope-card badge (4th surface).
- "Open now" filter on Map / Saved.
- Holiday / special-hours surfacing via `currentOpeningHours.specialDays`.
- Fold place_id resolution into `add-mall.ts` at add-time (retire the one-time backfill need for new malls).
