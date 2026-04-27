# R3 — Analytics event capture — Design record

> **Status:** 🟢 Ready (promoted from 🟡 Captured in session 58, 2026-04-24).
> **Roadmap entry:** [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md#r3--analytics-event-capture-) — R3.
> **Mockup:** [`docs/mockups/r3-admin-analytics-v1.html`](mockups/r3-admin-analytics-v1.html).
> **Effort:** M (2 sessions: this one = design-to-Ready, next = implementation. Implementation could split into two sub-sessions if the admin tab work expands.)
> **Purpose of this doc:** Freeze the design decisions so the implementation session can run as a straight sprint against a spec, not a re-scoping pass. Mirrors the shape of [`docs/r4c-mall-active-design.md`](r4c-mall-active-design.md) on purpose.

---

## Scope

Today the app has zero structured event capture. 160 `console.*` calls across 35 files emit error logs that disappear when the request ends. Every product decision after this — how aggressive R5a's 30-day cutoff should be, what the R5b free-tier cap is, which surfaces drive engagement — improves with data. R3 instruments early so that data starts compounding before decisions need it.

R3 ships:

- A Supabase-backed `events` table — single wide schema, `jsonb` payload, indefinite retention through beta.
- An `/api/events` POST endpoint — client-side fire-and-forget for UI events.
- Inline server-side writes inside existing handlers for events that already flow through API routes.
- A new `/admin` 5th tab — `Events` — showing a 24h/7d/all counter strip + filter chips + most-recent-first stream with 50/page pagination.
- A narrow v1 event list (8 types) instrumented across the existing surfaces.

R3 does **not** ship: dashboards, charts, exports, retention policy enforcement, or any user-identifying capture beyond a session-scoped `session_id`. Those land later sessions or post-R1.

---

## Terminology — locked at session 58

The codebase today carries four names for the same engagement mechanic on a find:

| Surface | Word it uses |
|---------|--------------|
| Visible glyph | **Heart** |
| Click handler / state | `handleToggleSave` / `isSaved` |
| ARIA label | "Save" / "Remove from saved" |
| `localStorage` key prefix | `BOOKMARK_PREFIX` |
| List page route | `/flagged` |
| BottomNav badge prop | `flaggedCount` |

There is exactly **one** engagement mechanic. Tapping the heart icon writes/removes a `localStorage` entry. There is no separate like-without-save, no double-tap, no upvote, no other interaction.

**The canonical event name in the analytics layer is `post_saved` / `post_unsaved`.** No separate `post_liked` event in v1. If a new like-without-save mechanic is ever introduced (e.g., thumbs-up that doesn't bookmark), it gets a new event type at that point — until then, treating "like" and "save" as separate events would invent a distinction that doesn't exist on screen.

**Follow-up flagged at session 58, not part of R3:** the four-name drift in the codebase itself (heart / save / flagged / bookmark) is a code-clarity smell. Likely collapses to "save" everywhere — `/flagged` → `/saved`, `flaggedCount` → `savedCount`, `BOOKMARK_PREFIX` → `SAVED_PREFIX`. Sized as a ~30–60 min docs-and-rename pass; queued separately, not blocking R3.

---

## Design decisions (frozen 2026-04-24)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Single wide `events` table or one typed table per event type? | **Single wide `events` table with `jsonb payload`.** Adding a new event type = one-line code change, not a migration. Aggregations still cheap (`WHERE event_type = 'post_saved'`). Typed tables would create migration sprawl as the event list grows. | David, session 58. |
| D2 | Client-side or server-side capture? | **Hybrid.** Server-side inline-writes inside existing API handlers for events that already flow through them (`share_sent`, `vendor_request_submitted`, `vendor_request_approved`, `mall_activated`, `mall_deactivated`). Client-side fire-and-forget POST to `/api/events` for pure UI events (`page_viewed`, `post_saved`, `post_unsaved`, `filter_applied`). | David, session 58. |
| D3 | User identity + PII handling? | **Pre-R1: `user_id` nullable, populated only for vendor-authenticated events. Shopper events carry a `session_id` stored in `sessionStorage` (auto-clears on tab close), never `localStorage`. No IP capture, no email capture, no user-agent capture for beta.** Post-R1, shopper `user_id` backfills naturally when signed in. | David, session 58. |
| D4 | Retention policy? | **Indefinite retention through beta.** Revisit at 90 days of data or 1M rows, whichever comes first. Beta volume makes storage cost trivially small; compound value of historical data in the first 90 days is high. | David, session 58. |
| D5 | Admin surfacing — stream-first or dashboard-first? | **Stream-first.** New `/admin` 5th tab `Events` with 24h/7d/all-time counter strip + filter chips by event type + most-recent-first list with 50-per-page pagination. No charts in R3. Charts arrive after R1 makes the data richer. | David, session 58. |
| D6 | v1 event list scope? | **Eight event types: `page_viewed`, `post_saved`, `post_unsaved`, `filter_applied`, `share_sent`, `vendor_request_submitted`, `vendor_request_approved`, `mall_activated`, `mall_deactivated`.** (Counts as eight because `mall_activated`/`mall_deactivated` are emitted from one server hook and tracked together.) Deliberately excludes `post_liked` (terminology section above), `share_opened` (would require email-redirect shim), `booth_visited` (folded into `page_viewed` via `page_path`). | David, session 58. |

**All six decisions (D1–D6) are frozen as of session 58.** The implementation session can proceed as a straight sprint against this spec without re-scoping.

---

## Schema

New migration: `supabase/migrations/010_events.sql`.

```sql
-- Event-type enum (closed set, additive via ALTER TYPE later)
CREATE TYPE event_type AS ENUM (
  'page_viewed',
  'post_saved',
  'post_unsaved',
  'filter_applied',
  'share_sent',
  'vendor_request_submitted',
  'vendor_request_approved',
  'mall_activated',
  'mall_deactivated'
);

-- Events table — single wide, jsonb payload
CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   event_type NOT NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   text,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for the hot paths
CREATE INDEX idx_events_occurred_at      ON events (occurred_at DESC);
CREATE INDEX idx_events_type_occurred_at ON events (event_type, occurred_at DESC);
CREATE INDEX idx_events_user_id          ON events (user_id) WHERE user_id IS NOT NULL;

-- Restricted reads — admin only via RLS, writes via service role only
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_admin_read ON events
  FOR SELECT
  USING ((auth.jwt() ->> 'email') IN (
    SELECT email FROM admin_emails  -- existing admin-allowlist pattern
  ));

-- No INSERT policy — writes only via service-role key (server-side or /api/events)
```

**Why a Postgres enum and not a free-form text column?** Closed set, tighter constraints, better introspection. New event types are added with `ALTER TYPE event_type ADD VALUE 'foo'` — additive, no downtime.

**Why `jsonb` for payload, not a wide column for every property?** Each event type has different relevant properties. Wide columns would mostly be NULL. `jsonb` keeps the schema flat while preserving query-ability (`payload->>'vendor_slug' = 'foo'`).

**Why no `client_ip` column?** Storing IPs would put R3 in scope for GDPR/CCPA-tier PII handling pre-R1, which is overkill for a beta-stage diagnostic tool. If abuse-tracing becomes a real need later, add a hashed-IP column with a salt. Don't pre-empt it.

**Why RLS on but no INSERT policy?** Reads are admin-only (privacy). Writes go exclusively through the service-role key — the `/api/events` route holds the service-role key server-side, the existing API handlers do too. Anonymous browser clients cannot write directly to the table even if they discover the schema.

**Backfill on migration:** none. R4c's `mall_activated_at` timestamps already in the `malls` table are NOT replayed as historical `mall_activated` events. (Trade-off: a clean cut-over is simpler than a backfill that has to invent a `session_id` for every historical event. The historical timestamps remain queryable on the `malls` table directly — they're not analytically lost, just on a different surface.)

---

## API surface

### `POST /api/events` — new

Client-side fire-and-forget endpoint for UI events.

**Body shape:**

```ts
{
  event_type: "page_viewed" | "post_saved" | "post_unsaved" | "filter_applied",
  session_id: string,         // browser-provided, sessionStorage-rooted
  payload?: Record<string, unknown>
}
```

**Behavior:**
- Validates `event_type` is one of the four client-allowable types.
- Validates `session_id` is a non-empty string ≤64 chars.
- If a Supabase auth bearer token is present in the `Authorization` header, resolves it to `user_id` and attaches.
- Inserts via service-role client.
- Returns `204 No Content` on success — no response body, no error surfacing to the client. Failures log to `console.error` server-side and are otherwise silent (this is fire-and-forget by design).
- Rate limit: 60 events/minute per session_id. Above that, returns `204` but discards. (Cheap defense against runaway loops; not security.)

**Why no GET?** Reads happen via the admin tab's existing supabase-client query through RLS, not through a route.

**Why fire-and-forget?** A failed event write should never block a UI interaction. Saving a post must succeed even if the analytics POST 500s. The cost of the worst case (lost event) is acceptable; the cost of blocking the save is not.

### Server-side inline writes — existing handlers

Five existing API handlers gain a single inline insert before they return success:

| Handler | New event |
|---------|-----------|
| [`app/api/share-booth/route.ts`](../app/api/share-booth/route.ts) | `share_sent` (payload: `{ vendor_slug, auth_mode: "authed" | "anon", recipient_count }`) |
| [`app/api/vendor-request/route.ts`](../app/api/vendor-request/route.ts) | `vendor_request_submitted` (payload: `{ mall_slug, has_proof_image }`) |
| [`app/api/admin/vendor-requests/route.ts`](../app/api/admin/vendor-requests/route.ts) (POST `approve`) | `vendor_request_approved` (payload: `{ vendor_slug, mall_slug }`) |
| [`app/api/admin/malls/route.ts`](../app/api/admin/malls/route.ts) (PATCH) | `mall_activated` or `mall_deactivated` (payload: `{ mall_slug, from_status, to_status }`) — emit only when status actually changed. |

These writes use the same `lib/events.ts` helper (see below) so the implementation session has one place to look.

### New helper

Add `lib/events.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const serviceClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type EventType =
  | "page_viewed"
  | "post_saved"
  | "post_unsaved"
  | "filter_applied"
  | "share_sent"
  | "vendor_request_submitted"
  | "vendor_request_approved"
  | "mall_activated"
  | "mall_deactivated";

export async function recordEvent(
  type: EventType,
  opts: { user_id?: string | null; session_id?: string | null; payload?: Record<string, unknown> } = {}
): Promise<void> {
  const { error } = await serviceClient.from("events").insert({
    event_type: type,
    user_id: opts.user_id ?? null,
    session_id: opts.session_id ?? null,
    payload: opts.payload ?? {},
  });
  if (error) console.error("[events] recordEvent failed:", error.message);
}
```

`recordEvent` is fire-and-forget on the server too — never throws, never blocks. Callers `await` it but failures only log.

### Client-side helper

Add `lib/clientEvents.ts`:

```ts
const SESSION_KEY = "th_event_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function track(
  event_type: "page_viewed" | "post_saved" | "post_unsaved" | "filter_applied",
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  // Fire-and-forget — explicit `void` to discard the promise
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type, session_id, payload }),
    keepalive: true,  // survives short navigations
  }).catch(() => {/* silent */});
}
```

`keepalive: true` covers the page-unload-during-navigation case without needing `navigator.sendBeacon` and its more constrained API. If `keepalive` proves unreliable in the wild, the fallback is to add `sendBeacon` for unload events later — not pre-empt it.

---

## Client instrumentation

Where the client-side `track()` calls live. Implementation session adds these as the smallest-possible inline calls.

### `page_viewed`

| File | Trigger |
|------|---------|
| [`app/page.tsx`](../app/page.tsx) | `useEffect` mount → `track("page_viewed", { path: "/" })` |
| [`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) | `useEffect` mount → `track("page_viewed", { path: "/find/[id]", post_id })` |
| [`app/shelf/[slug]/page.tsx`](../app/shelf/[slug]/page.tsx) | `useEffect` mount → `track("page_viewed", { path: "/shelf/[slug]", vendor_slug })` |
| [`app/my-shelf/page.tsx`](../app/my-shelf/page.tsx) | `useEffect` mount → `track("page_viewed", { path: "/my-shelf" })` |
| [`app/flagged/page.tsx`](../app/flagged/page.tsx) | `useEffect` mount → `track("page_viewed", { path: "/flagged", saved_count })` |

**Out of scope for v1:** automatic page-view capture on every route via a layout-level hook. Done explicitly per page so we capture meaningful per-route payloads (post_id, vendor_slug). Layout-level auto-capture is a later refinement.

### `post_saved` / `post_unsaved`

| File | Trigger |
|------|---------|
| [`app/find/[id]/page.tsx:845`](../app/find/[id]/page.tsx) | Inside `handleToggleSave` — emit `post_saved` if newly saved, `post_unsaved` if newly removed. Payload: `{ post_id }`. |
| [`app/page.tsx`](../app/page.tsx) feed-card heart | Same pattern if feed cards have their own toggle handler. (Implementation session confirms.) |

### `filter_applied`

| File | Trigger |
|------|---------|
| [`components/MallSheet.tsx`](../components/MallSheet.tsx) | When user picks a mall in the picker — emit `filter_applied` with `{ filter_type: "mall", filter_value: mall_slug ?? "all" }`. |

**v1 only emits `filter_applied` for the mall picker.** Tag filters and other filter types extend the payload shape later.

---

## Admin UI (new `Events` tab)

Full chrome lives in the mockup at [`docs/mockups/r3-admin-analytics-v1.html`](mockups/r3-admin-analytics-v1.html). Text spec for the implementation session below.

**Tab switcher:** 5 tabs instead of 4. Order left-to-right: `Requests · Posts · Banners · Malls · Events`. Layout shifts from the R4c "icon + label on one row" to "icon stacked above 10px label" to fit 5 cells in 375px width. Lucide icon for the 5th tab: `BarChart3` (matches the "stream of events with counts" framing).

**Top summary strip:** three equal-width cards under the tab switcher:

- Last 24h count
- Last 7d count
- All-time count

Format: 20px Georgia serif weight 700 number, 9px uppercase-tracked label below. Reads from a single SQL `COUNT(*)` query bucketed by occurred_at — three rows of one query, not three separate queries.

**Filter chips:** below the summary strip, horizontally scrolling row of pill chips. Default selected: `All`. Other chips: `Saves` (post_saved + post_unsaved combined), `Views` (page_viewed), `Shares` (share_sent), `+ more` (overflow → tap opens a sheet with the remaining types: filter_applied, vendor_request_submitted, vendor_request_approved, mall_activated/deactivated).

**Stream list:** most-recent-first, grouped by day (`Today · Apr 24`, `Yesterday · Apr 23`, then `Mon · Apr 22`, etc.). Each row:

- Color dot at left (8px circle, color per event-type family — green for saves + approvals + activations, slate for views, amber for shares, draft-gray for unsaves)
- Event type name in monospace 11px weight 600
- Timestamp at right in monospace 10px (HH:MM:SS)
- One-line payload summary below: `key: value · key: value` with key in faint, value in mono

**Tap a row to expand.** Expanded row shows full payload as syntax-highlighted JSON (10.5px monospace, dark code-block background `#211f1b`, color-coded `jk` keys / `jv` values / `jn` numbers). Tap again to collapse.

**Pagination:** 50 events per page. "Load more" button at bottom. No infinite scroll for v1 — explicit load is easier to reason about and avoids over-fetch from sessionStorage scroll position drift.

**Refresh button:** top right of the events container, same shape as Requests / Malls tabs — `↻ Refresh` link, refetches the whole page.

**No realtime subscription.** A Supabase realtime channel on the events table sounds nice but adds complexity (cleanup on tab close, deduping with manual refresh) for marginal beta value. Manual refresh works.

---

## Vendor / shopper empty-state behavior

R3 has no shopper-facing or vendor-facing UI surfaces. All UI lives in `/admin` Events tab. No empty-state copy needed for non-admin users.

**Admin empty state when `events` table has zero rows post-deploy:** `Events (0)` header, summary cards all read `0`, list section shows: *"No events captured yet. Once shoppers start interacting with finds, this stream will populate."* in 11px italic Georgia. ~1-day post-deploy this empty state will never be seen again.

---

## Out of scope

Explicit list of things R3 does NOT do:

- **Charts, graphs, dashboards.** Stream-first per D5. Aggregations beyond the 24h/7d/all counters are an admin-tab follow-up after R1 lands.
- **`share_opened` event.** Requires inserting an email-redirect shim (e.g., `/r/share/<id>` that records the open and 302s to the actual booth URL). Real but not v1.
- **`post_liked` event.** Per terminology section — there is no separate like mechanic in the product today.
- **`booth_visited` event.** Folded into `page_viewed` via `path: "/shelf/[slug]"`. A separate event would double-count.
- **Tag-filter `filter_applied` events.** Tag filters in the feed don't have a stable UI moment yet (the post-edit tag editor is the only tag-touching surface). Add when tag filtering becomes a real shopper feature.
- **CSV export.** Useful but trivially recoverable from the Supabase dashboard SQL editor for v1. Add to the admin tab when David asks for it.
- **PII redaction in payload.** The schema design avoids capturing PII in the first place. No redaction layer needed if the source-of-write contracts hold.
- **Retention enforcement (cron-deleted old events).** Per D4 — revisit at 90 days or 1M rows. No cron in v1.
- **Realtime subscription.** Manual refresh only.
- **R12 error monitoring.** R12 is a separate item (Sentry or equivalent). The `events` table is for product events, not exception payloads. R12 may end up reusing the `recordEvent` shape if Sentry is overkill for beta — that decision lives in R12, not R3.

---

## Implementation plan (next session)

Sprint brief shape. Estimated runtime: one session, ~90–120 min. Could split into two sessions if the admin tab work expands beyond expectations.

### Task 1 — Migration 🟢 AUTO
- Write `supabase/migrations/010_events.sql` per the schema spec above.
- Apply via Supabase dashboard (HITL paste — same as session 57's R4c migration 009 pattern).
- **Staging migration paste** as a separate HITL step (parallels the still-outstanding 009 staging paste). Non-gating.

### Task 2 — Helpers 🟢 AUTO
- `lib/events.ts` with `recordEvent` server helper.
- `lib/clientEvents.ts` with `track` client helper + `getSessionId` + sessionStorage rooting.

### Task 3 — `/api/events` route 🟢 AUTO
- `POST` handler validating event_type ∈ client-allowable set, session_id shape, payload size.
- Service-role insert, `204 No Content` response.
- Resolve user_id from bearer token if present.
- Rate limit: 60/min per session_id (in-memory Map keyed by session_id, 1-min sliding window — not Redis-backed, fine for beta scale).

### Task 4 — Server-side inline writes 🟢 AUTO
- Add one `await recordEvent(...)` call to each of the 5 existing handlers per the table above. Each is a one-line addition before the success response.

### Task 5 — Client instrumentation 🟢 AUTO
- Five `useEffect` page-view emitters per the table above.
- `handleToggleSave` instrumentation in `/find/[id]/page.tsx` (and feed card if separate).
- MallSheet `filter_applied` emitter on selection.

### Task 6 — Admin Events tab 🟢 AUTO
- New tab in `app/admin/page.tsx` (5th position, layout shift to stacked-icon).
- Summary strip component (inline — don't extract a primitive unless used in ≥2 places this session).
- Filter chip row with `+ more` overflow sheet.
- Day-grouped event list with expand-row interaction.
- 50/page pagination.
- Empty state copy.

### Task 7 — Build + deploy verification 🟢 AUTO
- `npm run build 2>&1 | tail -30` clean.
- Commit message format: `feat(r3): events table + capture + admin tab`.

### Task 8 — HITL on-device QA walk 🖐️ HITL
- David signs into `/admin`, opens Events tab, confirms summary cards populate after a few interactions on prod.
- Saves a find on `/find/[id]` → returns to admin → confirms `post_saved` event appears.
- Shares a booth → confirms `share_sent` event appears.
- Activates/deactivates a mall in the Malls tab → confirms `mall_activated`/`mall_deactivated` event appears.
- Filter chip selection works.
- Row expansion shows JSON payload.

### Task 9 — Staging migration paste + parity QA 🖐️ HITL
- Paste `010_events.sql` into staging Supabase.
- Repeat a subset of QA on staging.

---

## Cross-references

- Roadmap entry (to be promoted 🟡 → 🟢 in this commit): [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md) R3 section.
- Admin UI mockup: [`docs/mockups/r3-admin-analytics-v1.html`](mockups/r3-admin-analytics-v1.html).
- Adjacent roadmap items:
  - **R12 (error monitoring)** — same instrumentation mindset on adjacent surface. May reuse the `recordEvent` shape for structured logs if Sentry is overkill for beta.
  - **R5b (per-vendor active-find cap)** — depends on R3 to tune the cap numbers.
  - **R9 (push notifications)** — depends on R3 to identify events worth notifying about.
- Pattern reference: [`docs/r4c-mall-active-design.md`](r4c-mall-active-design.md) — this doc mirrors that one's shape on purpose.

---

## Open questions deferred to implementation session or downstream

- **Exact rate-limit bucket window for `/api/events`.** Spec says 60/min sliding window — implementation session picks 60 vs. 120 based on what real session interaction looks like.
- **Whether to extract the summary strip / filter chip / event row into reusable primitives** vs. keep inline. Default per spec: inline. Extract only if ≥2 admin tabs end up using them.
- **`+ more` overflow sheet vs. dropdown for the remaining filter chips.** Implementation-session UX choice; both fit the design system.
- **Realtime subscription on the events table.** Considered and excluded for v1. Revisit if a "live monitoring" admin session ever becomes a workflow.
- **Layout-level page_viewed auto-capture.** R3 ships per-page explicit calls. A `<TrackPageView>` layout primitive is a later refinement when route count grows.

---

## What gets committed in the same session as this design record

Per the [Design Agent rule](../MASTER_PROMPT.md) (formalized session 57, "Commit design records in the same session"), this session ships **three artifacts in one commit**:

1. This file: `docs/r3-analytics-design.md`.
2. The mockup: `docs/mockups/r3-admin-analytics-v1.html`.
3. Roadmap promotion: R3 status `🟡 Captured` → `🟢 Ready` in `docs/roadmap-beta-plus.md`.

The implementation session that follows reads from this frozen spec; it does not re-scope.

---

> Last updated: 2026-04-24 (session 58 — design-to-Ready pass complete. R3 🟢 Ready. All six decisions D1–D6 frozen + terminology locked; implementation session can run as a straight sprint against this spec.)

---

## Amendment v1.1 — instrumentation-gap closure (session 73, 2026-04-27)

**Context.** Five sessions accumulated four deferred instrumentation gaps while waiting for the admin-tab stale-data mystery (still parked) to close: booth bookmarks (session 67), `find_shared` (session 59), tag-extraction (session 62), and per-tab mall-filter attribution (session 68). Session 73 ran `scripts/inspect-events.ts` against prod and confirmed the write path is healthy independent of the read mystery — 1,706 events flowing across all 9 v1 types. The gaps could safely land.

**What v1.1 ships:**

- Migration [`012_events_v11_enum_extension.sql`](../supabase/migrations/012_events_v11_enum_extension.sql) — adds 5 enum values via `ALTER TYPE event_type ADD VALUE IF NOT EXISTS`.
- `lib/events.ts` `EventType` + `lib/clientEvents.ts` `ClientEventType` + `app/api/events/route.ts` `CLIENT_EVENT_TYPES` extended (all five new types fire from client paths).
- `app/api/admin/events/route.ts` `ALLOWED_FILTERS` extended.
- Six callsite wirings (see table below).

**v1.1 event additions:**

| Event | Payload | Callsite | Notes |
|---|---|---|---|
| `booth_bookmarked` | `{vendor_slug}` | [`app/shelves/page.tsx`](../app/shelves/page.tsx) `handleToggleBookmark` + [`app/shelf/[slug]/page.tsx`](../app/shelf/[slug]/page.tsx) `handleToggleBoothBookmark` | Closes session-67 carry. |
| `booth_unbookmarked` | `{vendor_slug}` | same two | symmetric pair. |
| `find_shared` | `{post_id, share_method: "native" \| "clipboard"}` | [`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) `handleShare` | Intent-capture semantic — fires on tap, not on share-sheet completion (native `share()` Promise rejects on dismiss with no reliable way to distinguish dismiss from error). Closes session-59 carry. |
| `tag_extracted` | `{has_price: bool, has_title: bool}` | [`app/post/tag/page.tsx`](../app/post/tag/page.tsx) post-extraction await | Fires whenever the extractor ran, regardless of yield — so `{has_price:false, has_title:false}` is a valid event for "tried, got nothing". Distinct from `tag_skipped`. |
| `tag_skipped` | `{}` | [`app/post/tag/page.tsx`](../app/post/tag/page.tsx) `handleSkip` | User dismissed before scanning. |

**v1.1 payload-shape extensions (no enum change):**

- `filter_applied` — adds `page` field (`"/"` \| `"/shelves"` \| `"/flagged"`) to enable per-primary-tab adoption queries via `payload->>'page'`. Backfilled to existing Home callsite + new wiring on [`app/shelves/page.tsx`](../app/shelves/page.tsx) `handleMallSelect` + [`app/flagged/page.tsx`](../app/flagged/page.tsx) `handleMallSelect`. Closes session-68 carry.

**Decisions (frozen 2026-04-27 session 73):**

| # | Question | Decision |
|---|----------|----------|
| D1 | Tag flow: 3 events as carry-noted, 2 events, or 1 with `outcome` enum? | **2 events** — `tag_extracted` (with `has_price`+`has_title` flags) + `tag_skipped`. Splits along the user action; outcome detail belongs in the payload. |
| D2 | `find_shared`: capture `share_method`? | **Yes** — `"native" \| "clipboard"` distinguishes mobile-share-sheet from desktop-clipboard-fallback adoption. |
| D3 | Booth-bookmark payload shape | **`{vendor_slug}`** for both bookmark + unbookmark. `total_bookmarks` is recoverable from session_id over time. |
| D4 | Mall-filter `filter_applied` payload | **Add `page` field** to all three primary-tab callsites (incl. backfill on Home). Per-tab adoption becomes a `GROUP BY` query, not a JOIN. |

**Out of scope for v1.1** (deliberately deferred):

- **Server-side `find_shared` parity from `/api/share-booth`.** Already covered by the existing `share_sent` server event with richer auth-mode + recipient-count payload. Adding `find_shared` server-side too would double-count.
- **Tag-extraction error path as a separate event.** Treated as `tag_extracted` with `{has_price:false, has_title:false}`. A separate `tag_extraction_error` was rejected because the user-visible action is the same.
- **`tag_skipped` reason payload.** Single boolean dismiss path today; if multiple skip reasons emerge later (e.g., camera-denied vs explicit dismiss), the payload extends without a new event type.
- **Tag-flow analytics that span pages** (e.g., the user skipped the tag screen and then completed the post anyway). Recoverable via `session_id` joins between `tag_skipped` and the eventual save chain. No dedicated funnel-event needed for v1.1.

**Verification path:**

1. 🖐️ HITL — David pastes `012_events_v11_enum_extension.sql` into the prod Supabase SQL editor. (Migration is `ALTER TYPE ADD VALUE IF NOT EXISTS` — idempotent + transactional-safe.)
2. 🟢 AUTO — Push commit. Vercel deploys.
3. 🖐️ HITL — David exercises each callsite once on iPhone (bookmark a booth, unbookmark it, share a find, extract a tag, skip a tag, change mall filter on each primary tab).
4. 🟢 AUTO — Run `npx tsx scripts/inspect-events.ts` to confirm the new types appear with correct payloads.

**Carry that stays parked:**

- **Read-API mystery** (`/api/admin/events` intermittent stale snapshot). v1.1 is independent of it; verification path above uses the inspector script, not the admin tab. Next-viable parked probe (`/api/admin/events-raw` with bare `fetch()`) still warrants only running on a fresh symptom repro per session 60's parking guidance.

---

## Amendment v1.2 — Read-API stale-data mystery resolved at root (session 73, 2026-04-27)

**Status: ✅ Closed.** The session-58 / 59 / 60 mystery — `/api/admin/events` intermittently returning a snapshot frozen 25–78 min behind real DB state — is fully diagnosed and fixed.

### Sequence of evidence

The mystery freshly reproduced during session 73's R3 v1.1 verification walk. After David exercised the new event types on iPhone, the inspector saw events through `12:35 UTC`, but the admin tab's freshest event was `11:40 UTC` — ~58 min behind. Built [`/api/admin/events-raw`](../app/api/admin/events-raw/route.ts) (the next-viable probe parked at session 60) which bypasses `@supabase/supabase-js` entirely, hitting PostgREST via bare `fetch()` with `cache: "no-store"` explicitly set. Wired an inline diag strip into the admin Events tab so both routes fire in parallel on every fetch and render side-by-side.

The diag strip's first reading was the smoking gun:

```
lib /events: 11:40:42Z · 50 rows
raw probe:   12:58:21Z · 50 rows · 78ms
delta: raw ahead 4659s   (~78 min)
```

Same Supabase URL, same service-role key, same Vercel runtime, same `ORDER BY occurred_at DESC LIMIT 50` query semantics. The only difference: the raw probe set `cache: "no-store"` on its `fetch()` while `@supabase/supabase-js` used an unmodified fetch.

### Root cause

**Next.js's HTTP-level data cache was intercepting `@supabase/supabase-js`'s internal `fetch()` calls.** The cache key is URL + method + headers; since supabase-js sends identical requests every call, every hit returned the response from the very first call. The cache never invalidated.

The route's `export const dynamic = "force-dynamic"` directive disables caching of the *route response*, but does **NOT** propagate `cache: "no-store"` to fetches happening *inside* the route. That gap is what session 60's stuck-Fluid-Compute theory missed: the data cache lifetime is decoupled from function instance lifetime, so a fresh deploy creates new instances but the cached response persists in the data-cache layer.

### Fix

Two lines in [`lib/adminAuth.ts`](../lib/adminAuth.ts) — pass a `global.fetch` wrapper to `createClient` that always sets `cache: "no-store"`:

```ts
return createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  },
});
```

Single change benefits every admin route + every server-side `recordEvent` path that goes through `getServiceClient()`. Verified on iPhone: diag strip flipped from red `delta: raw ahead 4659s` to green `delta: in sync · 13:05:03Z = 13:05:03Z`.

### Why session 60's elimination missed this

Session 60 ruled out: env-var mismatch ✓, project mismatch ✓, code mismatch ✓, stuck Fluid Compute instance ✓ (via fresh deploy). The fifth candidate — Next.js's data cache layer separate from the function lifetime — wasn't on session 60's radar because the route was already marked `force-dynamic`, which superficially looks like "no caching." The implicit assumption ("`force-dynamic` means everything inside the route is uncached") was wrong; only the route response is uncached.

### Open carry from this fix

- **Other supabase-js call sites in the app might have the same latent bug.** Anywhere that creates a Supabase client without the `global.fetch` wrapper is potentially reading stale data. Audit candidates: `lib/auth.ts` (browser client — different cache layer, unaffected), any inline `createClient` calls outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/` to enumerate.
- **The `/api/admin/events-raw` probe + inline diag strip stay in the codebase as durable visibility tools.** David's session-73 decision: keep them as a sanity check during day-to-day operation. They become irrelevant when Q-014 (Metabase analytics surface) lands and the admin Events tab retires.
- **Tech Rule candidate** captured as TR-q in [`docs/tech-rules-queue.md`](tech-rules-queue.md) — third-firing pattern of "supabase-js on Vercel + Next.js has subtle deviations from local that aren't caught by `force-dynamic` alone." Compounds with TR-l (Vercel-runtime PostgREST quirks).

### What stays in v1.1 vs what becomes v1.2

v1.1's instrumentation list (5 new event types + filter_applied page expansion) is unchanged. v1.2 is purely the supabase-js cache-bypass plumbing fix — no event-schema changes, no payload-shape changes, no API surface changes. The amendment captures it here so future sessions don't re-investigate the mystery.
