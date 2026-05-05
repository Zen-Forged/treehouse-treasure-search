# R1 — Shopper accounts — Design record

> **Status:** 🟡 Captured (session 55) → 🟢 **Ready** (session 111, 2026-05-06). Design locked across 1 reference scan + 1 mockup pick. Implementation arc follows in a later session.
> **Roadmap entry:** [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md#r1--guest--shopper-profiles-) — R1.
> **Mockup:** [`docs/mockups/r1-shopper-accounts-v1.html`](mockups/r1-shopper-accounts-v1.html) — V1 with three frames spanning the profile-destination posture. Frame B + option ii picked.
> **Effort:** M–L (2–3 sessions of implementation: schema + claim mechanic / auth+triage wiring / `/me` destination + masthead bubble swap + read-side migration).
> **Purpose of this doc:** Freeze the philosophical posture, the profile-destination shape, and the saves-migration mechanic so the implementation arc runs against a spec, not a re-scoping pass.

---

## Origin (session 111)

David surfaced R1 as the largest unblocked R-item after R10 ✅ Shipped at session 108 + chrome+nav refinement at sessions 109+110. Shopper accounts sharpen the digital-to-physical thesis: saved finds + booth bookmarks become identity that persists across devices, not just per-localStorage state on one phone.

Per the reference-first memory ([`feedback_reference_first_when_concept_unclear`](../../../.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_reference_first_when_concept_unclear.md)), session opened with a 6-reference cross-domain scan rather than a fresh mockup. References spanned identity-pattern axes the project already cares about (Pocket / Letterboxd / Glass / Substack / Apple Notes-iCloud / Foursquare-Swarm) and explicitly skipped marketplace shapes (Etsy / eBay) per the digital-to-physical-bridge thesis.

David picked **B + E + G** from the reference scan:
- **B** — *Lazy claim* (Apple Notes / Pocket-onboarding shape). Keep using as guest, formalize later.
- **E** — *Quiet identity* (Glass shape). No public engagement metrics, no follow graph.
- **G** — *Saves only* at MVP. Finds + booth bookmarks. Scout history + notifications deferred.

V1 mockup spanned the remaining axis — *what does the profile actually IS when authed* — across three frames (Pocket-pure / Glass-shape / Saves-as-journal). David picked **Frame B + option ii** (Glass-shape reflective destination + masthead bubble swaps to initials when authed). No fill-level concern flagged → V2 not needed per the [V2-as-fill-refinement memory](../../../.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_v2_mockup_as_fill_refinement.md).

---

## Scope

R1 ships:
1. **3rd sign-in path** on `/login` — triage card "I'm shopping" (slot pre-baked at session 93).
2. **Handle pick** as a single new screen after OTP magic-link confirm.
3. **Schema** — `shoppers` table + `shopper_saves` + `shopper_booth_bookmarks` with RLS.
4. **Silent localStorage → DB migration** on first claim. Idempotent + zero UI confirmation.
5. **`/me` page** — reflective profile destination with avatar + handle + scouting-since + private 3-stat row + sign-out.
6. **Masthead profile bubble swap** to v1.green initials circle when authed.
7. **Hybrid read** — authed shoppers read saves from DB; guests keep localStorage. New `useShopperSaves()` hook composes both.
8. **Subtle "Sync your finds across devices →" footer** on Saved tab guest-state only.

It does **not** ship:
- Public profiles, follow graph, or engagement metrics. (Locked at D2 — quiet identity.)
- Avatar photo upload. Initials only at MVP.
- Scout history (visit log of malls/booths visited).
- Notifications (saved booth posted something new).
- Email change / password change / account deletion UI.
- Apple / Google sign-in. Email-OTP only — matches vendor flow.
- Anonymous Supabase sessions. Sign-in is explicit; guest stays guest until claim.

---

## Design decisions (frozen 2026-05-06)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | When does identity attach? | **Lazy claim.** Shoppers use the app as guests by default. State lives in localStorage. Sign-in is a graduation, never a gate. | Reference scan, David picked **B**. |
| D2 | Privacy posture | **Quiet identity.** No public profile, no follow graph, no engagement metrics, no leaderboards. Stats on `/me` are private — only the shopper sees them. | Reference scan, David picked **E**. |
| D3 | MVP sync scope | **Saves only.** Bookmarked finds + booth bookmarks migrate into the account. Scout history + notifications deferred to R1.5 / future R-items. | Reference scan, David picked **G**. |
| D4 | Profile destination shape | **`/me` reflective page.** Avatar + handle + scouting-since eyebrow + private 3-stat row + sign-out link. No saves duplicated — saves stay on Saved tab. | V1 mockup, David picked **Frame B**. |
| D5 | Masthead profile bubble in authed state | **Initials in v1.green circle.** Same 44×44 IconBubble geometry as session 109's `<MastheadProfileButton>`; only the inner content swaps. Guest state unchanged (CircleUser glyph). | V1 mockup, David picked **option ii**. |
| D6 | Sign-in entry points | **Three.** (a) 3rd `/login` triage card "I'm shopping" (session 93 slot). (b) Italic-Lora footer link "Sync your finds across devices →" at the bottom of the Saved tab, visible **only** in guest state and **only** when at least 1 save exists. (c) Tapping the masthead profile bubble while guest → `/login` (current behavior preserved). | Derived from D1 lazy-claim posture. |
| D7 | Claim flow shape | **2 screens.** Existing `/login/email` magic-link OTP (no change) → new `/login/email/handle` to pick a handle → routes to `/`. | Derived from D2 quiet identity (handle is the public-shape primitive even though it's never publicly listed). |
| D8 | Handle | **User-chosen at claim, auto-suggested.** Suggestion shape: derived from email local-part, lowercased, non-alpha stripped, with a 4-char fallback token if collision. User can edit before submit. UNIQUE constraint at DB layer. Suggested format: 3–32 chars, lowercase letters / numbers / hyphens. | New decision, session 111. |
| D9 | `/me` stat row | **Three numbers, horizontally arranged.** *Finds saved · Booths bookmarked · Locations* (where "locations" = distinct malls represented across the shopper's saved finds). Times-New-Roman numerals (matches session-75 booth-numeral system); small-caps FONT_SYS labels. Stats are **private**. | V1 mockup. |
| D10 | "Scouting since" eyebrow | **Small-caps FONT_SYS** in `--ink-faint`. Format `SCOUTING SINCE MAY 2026`. Anchored on `shoppers.created_at` (formatted as `MMMM YYYY`). | V1 mockup. |
| D11 | Avatar | **Initials only at MVP.** No photo upload. 2 uppercase chars derived from `handle` (first 2 alpha chars, fallback to email local-part if handle missing). Background `v1.green`; text `v1.greenOn`. Sizes: **84** at `/me` hero, **44** at masthead bubble (matches IconBubble). | V1 mockup, derived from D2 quiet posture. |
| D12 | Saved tab chrome on authed shoppers | **Unchanged.** Same layout, same content shape. Saves continue to live there. `/me` is reflective, NOT a duplicate gallery. | V1 mockup — Frame B explicitly does not move saves into `/me`. |
| D13 | First-claim migration mechanic | **Silent + idempotent.** On first claim, server-side `/api/shopper-claim` reads localStorage saves payload (passed in claim request body) and bulk-inserts into `shopper_saves` + `shopper_booth_bookmarks` with `ON CONFLICT DO NOTHING` against UNIQUE `(shopper_id, post_id)` and `(shopper_id, vendor_id)`. **No confirmation card.** No "we found 12 saves" banner. The shopper just keeps using the app and now their saves persist. | Derived from D1 lazy-claim posture — confirmation cards conflict with the "graduation, not a gate" framing. |
| D14 | Read pattern (authed vs. guest) | **Hybrid via `useShopperSaves()` hook.** Authed → reads from DB (`shopper_saves` joined to `posts`). Guest → reads from localStorage (current behavior unchanged). Saved tab + Home/Map postcard-mall-card filter both adopt this hook. Auth-state transition is reactive (hook re-runs on sign-in/sign-out). | Derived from D1 + D3. |
| D15 | Sign-out | **Italic-Lora link** in `v1.green` below the `/me` stat row. Direct sign-out — no confirmation overlay, no "are you sure" sheet. After sign-out, **localStorage retains** the saves it had at the time, so the device can keep operating as guest with the cached state. | New decision, session 111. |
| D16 | Tap-target routing | Masthead profile bubble: **guest → `/login`** (current). **Authed → `/me`**. No overlay layer between bubble and destination — Frame A's account-overlay is rejected. | V1 mockup — Frame B's destination model. |
| D17 | `/me` route placement | **Outside `app/(tabs)/`.** Follows the `/find/[id]` / `/shelf/[slug]` / `/my-shelf` family pattern: own back-button masthead, no shared chrome with the tab pages. Reaches BottomNav via the standard global-render path; back-button returns to the previous tab. | Derived — `/me` is not a tab and shouldn't compete with the 2-tab BottomNav established at session 110. |

---

## Component contracts

### `<MastheadProfileButton>` (extended from session 109)

```ts
interface MastheadProfileButtonProps {
  authedInitials?: string;   // 2 chars, uppercase. When present, renders initials in v1.green circle.
                             // When absent, renders CircleUser glyph in IconBubble (current behavior).
  // Tap: routes to /me if authed (authedInitials present), /login if guest (absent).
}
```

- Geometry preserved: 44×44 IconBubble (matches the back-button geometry on `/find/[id]` per session 109 D-decisions).
- Authed visual: solid `v1.green` circle, 2-char `v1.greenOn` text in FONT_SYS 600 weight, ~15px font-size, 0.02em letter-spacing.
- Guest visual: unchanged from session 109 — `v1.iconBubble` background, `CircleUser` Lucide glyph 22px stroke 1.6.

### `<ProfileAvatar>` (new primitive — or inline in `/me`)

```ts
interface ProfileAvatarProps {
  initials: string;          // 2 uppercase chars, always.
  size: 44 | 84;             // 44 for masthead, 84 for /me hero.
}
```

- 84px → `/me` hero. Inline in page render — primitive extraction only if a 3rd consumer materializes.
- 44px → masthead. Identical inner pattern to `<MastheadProfileButton>`'s authed state. (May extract a shared `<InitialsCircle>` primitive on 2nd consumer.)

### `/me` page (new route)

- Server component reads:
  - `auth.uid()` from Supabase session
  - `shoppers.handle` + `shoppers.created_at`
  - Aggregate stat counts (3 separate count queries OR 1 RPC — implementation decides)
- Layout:
  - Own masthead with **back button (left)** + wordmark (center) + null right slot. Same shape as `/find/[id]`, `/shelf/[slug]`, `/my-shelf`.
  - Body: avatar 84 + handle (Lora 22 / 500) + "scouting since" eyebrow + 3-stat row + sign-out link.
  - BottomNav renders normally (R1 doesn't touch nav).
- Loading state: skeleton avatar + skeleton handle + skeleton stats (numbers as `—`).
- Sign-out: calls `supabase.auth.signOut()` then routes to `/`.

---

## Schema (frozen — implementation session can refine RLS but not column shape)

```sql
-- supabase/migrations/0NN_shoppers.sql
CREATE TABLE shoppers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  handle      TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shoppers_handle_format CHECK (handle ~ '^[a-z0-9-]{3,32}$')
);

CREATE TABLE shopper_saves (
  shopper_id  UUID NOT NULL REFERENCES shoppers(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shopper_id, post_id)
);
CREATE INDEX shopper_saves_shopper_idx ON shopper_saves (shopper_id);

CREATE TABLE shopper_booth_bookmarks (
  shopper_id  UUID NOT NULL REFERENCES shoppers(id) ON DELETE CASCADE,
  vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shopper_id, vendor_id)
);
CREATE INDEX shopper_booth_bookmarks_shopper_idx ON shopper_booth_bookmarks (shopper_id);

ALTER TABLE shoppers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopper_saves           ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopper_booth_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies: each shopper can SELECT/INSERT/DELETE only their own rows.
-- Service role (used by /api/shopper-claim) bypasses RLS for the migration write.
```

---

## Sub-task implementation sequencing

**5 arcs, smallest → largest per the [smallest-to-largest commit memory](../../../.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md).**

### Arc 1 — Schema + RLS (1 commit)
- Migration file as above.
- 🖐️ HITL paste into prod + staging.
- No code change yet — schema lands isolated.

### Arc 2 — `/me` page + masthead bubble swap (2–3 commits)
- Extend `<MastheadProfileButton>` with `authedInitials?` prop. Hook reads Supabase auth state.
- New `app/me/page.tsx` with server-component data fetch + back-button masthead + body content per D4 / D9 / D10 / D11 / D15.
- Smoke-test routing — guest tap goes to `/login`, authed tap goes to `/me`. Auth state is mocked locally via hard-coding for this arc; real auth wiring lands in Arc 3.

### Arc 3 — Auth / triage wiring (2–3 commits)
- 3rd `/login` triage card "I'm shopping" routes to `/login/email`.
- After OTP confirm: route to new `/login/email/handle` page.
- Handle-pick form: prefilled auto-suggest, edit + Save → POST `/api/shopper-claim`.
- `/api/shopper-claim` (new):
  - Reads localStorage saves payload from request body.
  - Inserts `shoppers` row via service-role client.
  - Bulk-inserts into `shopper_saves` + `shopper_booth_bookmarks` with `ON CONFLICT DO NOTHING`.
  - Returns `{ ok: true, shopper: {handle, created_at} }`.
- Subtle "Sync your finds across devices →" footer on `/flagged` (Saved) — italic-Lora `v1.green` link, visible only when `!isAuthed && hasLocalStorageSaves`. Routes to `/login`.

### Arc 4 — Read-side migration (1–2 commits)
- New hook `useShopperSaves()` in `lib/`. Returns `{ saveIds: Set<string>, boothIds: Set<string>, isLoading, source: 'db' | 'localStorage' }`.
- Authed → DB query (cached via SWR or React Query — implementation decides; pattern should match `useSavedMallId`'s broadcast-event approach for cross-instance sync).
- Guest → localStorage read (current pattern unchanged).
- Update Saved tab to consume the hook.
- Update Home/Map postcard-mall-card scope filtering to consume the hook.
- Bookmark + un-bookmark actions write through to DB when authed (idempotent INSERT / DELETE), localStorage when guest.

### Arc 5 — End-to-end QA + iPhone walk + close (1 commit per the [mid-session iPhone QA memory](../../../.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md))
- Cold-start as guest: save 3 finds, bookmark 1 booth.
- Sign in as shopper: confirm migration silent, saves visible after sign-in.
- Open `/me`: confirm avatar, handle, stats correct.
- Sign out: confirm localStorage retains state, app continues working as guest.
- Cross-device: sign in on second device, confirm same saves.

---

## Open implementation questions (non-blocking, decided at implementation time)

- **Handle suggestion algorithm precise spec.** Email `dbutler@gmail.com` → `dbutler` (already valid). Email with non-alpha → strip + lowercase. If collision: append `-{random 4 chars from a-z0-9}`. Repeat on collision. Cap retries at 5; surface "pick another handle" form-error if all collide (extremely rare).
- **Stats query shape.** 3 separate `count()` queries vs. 1 RPC vs. denormalized count columns on `shoppers` with a trigger. At MVP scale (<1000 shoppers), 3 queries is cheap. Denormalize on >10k shoppers.
- **`/me` back button destination.** Probably the standard browser back. If the shopper opens `/me` cold from an external link, back-button → `/`. Implementation can use `router.back()` with a fallback to `/`.
- **Cross-instance sync of bookmark state on auth.** When the user signs in on Device A, Device B's localStorage doesn't auto-update. Acceptable for MVP — Device B will see DB state next time it opens. R1.5 could broadcast via a Supabase realtime channel.
- **Race condition on rapid sign-in / sign-out.** If a shopper signs in, makes a save, then signs out — does the save persist on the device or in DB? Per D15: localStorage retains, DB also retains. Both are correct.
- **What if a vendor is also a shopper?** A user can have BOTH a `vendors` row AND a `shoppers` row keyed off the same `auth.users.id`. They keep their booth + their personal saves separately. This composes cleanly because the role-detection is per-table, not per-user.
- **Handle change after claim.** Out of scope for R1. If a shopper picks a handle they regret, they live with it until R1.5 ships an edit form. Document this behavior on the handle-pick screen with a small footnote.

---

## Status history

- 🟡 Captured (session 55, 2026-05-XX) — original roadmap entry as "Guest / shopper profiles" with open questions on identity model + anon-vs-claim.
- 🟢 **Ready** (session 111, 2026-05-06) — this doc. Reference scan + V1 mockup + frozen decisions D1–D17 + schema + sub-task arcs.
- ✅ Shipped — (pending implementation arc, ~sessions 112–114).
