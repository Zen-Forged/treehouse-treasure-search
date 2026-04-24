# R4c — Mall active / inactive — Design record

> **Status:** 🟢 Ready (promoted from 🟡 Captured in session 56, 2026-04-24).
> **Roadmap entry:** [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md#r4c--mall-activeinactive-toggle-) — R4c.
> **Mockup:** [`docs/mockups/r4c-admin-v1.html`](mockups/r4c-admin-v1.html).
> **Effort:** M (2 sessions: this one = design-to-Ready, next = implementation).
> **Purpose of this doc:** Freeze the design decisions so the implementation session can run as a straight sprint against a spec, not a re-scoping pass.

---

## Scope

Every surface that lists malls today shows all 28+ mall records regardless of whether Treehouse Finds has any real presence there yet. R4c adds a three-state lifecycle for each mall (`draft` → `coming_soon` → `active`) so that:

- **Shopper pickers** (feed filter, future map) show only `active` malls.
- **Vendor-request dropdown** shows only `active` malls (vendors can't request booths at malls that aren't live yet).
- **Admin surfaces** show all malls with their status surfaced, and carry the activation toggle.
- **Vendor-owned surfaces** (my-shelf, shelf detail) keep showing their own mall regardless of status — the mall isn't live yet, but the vendor's booth still is.

Activation is also a growth ritual — each mall David visits and flips to `active` is an event worth tracking. R4c adds a `activated_at` timestamp now so R3 (analytics) can pick it up later without a schema migration.

---

## Design decisions (frozen 2026-04-24)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Two-state boolean or three-state enum? | **Three-state enum** `draft` / `coming_soon` / `active`. | David, session 56. |
| D2 | What happens to vendors attached to an inactive mall? | **Hidden from shopper picker and shopper feed filter. Still visible to the vendor on their own my-shelf / shelf pages. Still visible to admin everywhere.** | David, session 56. |
| D3 | Activation audit trail? | **Add `malls.activated_at` timestamp column now. R3 will layer `mall_activated` / `mall_deactivated` events on top when it ships.** | David, session 56. |
| D4 | Default status for existing 28+ seeded malls after migration? | **All default to `draft`.** David activates the 1–2 he cares about in the admin UI post-deploy (≤30 seconds). Matches the "29 unactivated malls pollute pickers" framing — the migration should *reveal* the problem it's solving, not paper over it. | David, session 56. |
| D5 | Where does the admin toggle live? | **New `/admin` `Malls` tab (4th tab alongside Requests / Posts / Banners).** Keeps schema-editing admin colocated. `/shelves` remains a browser, not an editor. | David, session 56. |
| D6 | Can vendors request booths at `coming_soon` malls? | **No — dropdown filters to `active` only.** Accepting requests before the mall is operational creates a pending-request queue David can't act on until activation. Simpler to gate at the request layer. | David, session 56. |

**All six decisions (D1–D6) are frozen as of session 56.** The implementation session can proceed as a straight sprint against this spec without re-scoping.

---

## Schema

New migration: `supabase/migrations/009_mall_status.sql`.

```sql
-- Enum
CREATE TYPE mall_status AS ENUM ('draft', 'coming_soon', 'active');

-- Columns
ALTER TABLE malls
  ADD COLUMN status mall_status NOT NULL DEFAULT 'draft',
  ADD COLUMN activated_at timestamp with time zone;

-- Index for the hot path (shopper picker reads active-only ordered by name)
CREATE INDEX idx_malls_status_name ON malls (status, name);
```

**Why a Postgres enum and not a check-constrained text column?** The values are closed and unlikely to grow. Enum gives tighter constraints + better introspection. If R13 (mall-operator accounts) later needs a richer state machine (`suspended`, `archived`), we can `ALTER TYPE … ADD VALUE` additively.

**Why `activated_at` as a timestamp, not an audit log table?** One-column additive change; carries the "first activated" signal with zero infra cost; R3's event table will become the richer audit trail when it ships. `activated_at` is not cleared on deactivation — it's a "has this mall ever been live" signal, not current-status mirror. If D3 turns out to need deactivation timestamps, we add `deactivated_at` at that point.

**Backfill:** None. All rows default to `draft` via `NOT NULL DEFAULT`. `activated_at` remains `NULL` until David activates each mall.

**RLS:** Existing `malls: public read` policy already returns the new columns to anonymous reads. No RLS change needed. Admin writes go through the existing `malls: admin update` policy.

---

## Consumer surfaces

Every read of the `malls` table, bucketed by R4c behavior.

### Shopper-facing — filter to `status = 'active'`

| File | Call site | Change |
|------|-----------|--------|
| [`app/page.tsx:674`](../app/page.tsx) | `getAllMalls().then(setMalls)` → MallSheet picker | Swap to `getActiveMalls()`. |

### Vendor-request — filter to `status = 'active'`

| File | Call site | Change |
|------|-----------|--------|
| [`app/vendor-request/page.tsx:146`](../app/vendor-request/page.tsx) | `getAllMalls().then(setMalls)` → mall dropdown | Swap to `getActiveMalls()`. |

### Admin — show all, surface status

| File | Call site | Change |
|------|-----------|--------|
| [`app/admin/page.tsx:161`](../app/admin/page.tsx) | `getAllMalls().then(setMalls)` → AddBoothInline dropdown | Keep `getAllMalls()`. Add status pill next to each mall name in the dropdown so admin sees "Draft" / "Coming soon" context while pre-seeding booths. |
| [`app/shelves/page.tsx:315`](../app/shelves/page.tsx) | `getAllMalls()` → admin booth browser | Keep `getAllMalls()`. Add a status pill on each mall-group header. |
| `app/admin/page.tsx` new `Malls` tab | — | Reads `getAllMalls()` and renders the toggle UI. See mockup. |

### Vendor-owned single-mall lookup — no filter, pass-through

| File | Call site | Change |
|------|-----------|--------|
| [`app/my-shelf/page.tsx:576`](../app/my-shelf/page.tsx) | `getAllMalls().then(malls => setMall(malls.find(m => m.id === vendor.mall_id) ?? null))` | No change. Vendor sees their own mall regardless of status. |
| [`app/shelf/[slug]/page.tsx:309`](../app/shelf/[slug]/page.tsx) | Same shape | No change. Booth-detail page shows whatever mall the vendor is attached to. |

### Scripts & debug — no change

| File | Usage | Change |
|------|-------|--------|
| [`scripts/seed-staging.ts:197`](../scripts/seed-staging.ts) | Resolves slug → id for fixture vendors | No change. Script is admin-context; pre-seeding status is a separate decision (see "Staging activation" below). |
| [`app/api/debug/route.ts:42`](../app/api/debug/route.ts) | Internal sanity probe | No change. |

### New helpers

Add to [`lib/posts.ts`](../lib/posts.ts) `// ── MALLS ──` section:

```ts
export async function getActiveMalls(): Promise<Mall[]> {
  const { data, error } = await supabase
    .from("malls")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) { console.error("[posts] getActiveMalls:", error.message); return []; }
  return (data ?? []) as Mall[];
}
```

`getAllMalls()` stays as-is — admin context. No signature change.

---

## Admin UI (new `Malls` tab)

Full chrome lives in the mockup at [`docs/mockups/r4c-admin-v1.html`](mockups/r4c-admin-v1.html). Text spec below for implementation:

**Tab switcher:** 4 tabs instead of 3. Order left-to-right: `Requests · Posts · Banners · Malls`. Icons for the 4th tab: `MapPin` from lucide-react (matches existing mall-pin language in MallSheet).

**Header:** Uppercase eyebrow "Malls (N)" where N is total count. Refresh button to reload list.

**List shape:** Grouped into three sections in this order:

1. **Active** (emphasized) — green-tinted row background matching existing `colors.greenLight`. Sorted alphabetically by name.
2. **Coming soon** — neutral card chrome. Sorted alphabetically.
3. **Draft** (de-emphasized) — lighter text, dashed left border. Sorted alphabetically. Collapsible — tap the group header to expand/collapse. Collapsed by default when there are more than ~5 drafts.

**Row:**
- Primary: mall name (14px Georgia serif, weight 600)
- Secondary: `{city}, {state}` (11px, textMuted)
- Tertiary: for `active` malls, `Activated {relative date}` (10px textFaint, monospace). For others, nothing.
- Right-aligned: status pill `Draft` / `Coming soon` / `Active`. Pill colors:
  - `Draft` — textFaint background, textMid foreground
  - `Coming soon` — amber tint (new token? or existing warning color — implementation session picks the closest existing token; no new token for R4c)
  - `Active` — `colors.green` on `colors.greenLight`

**Interaction:** Tap row → three-way segmented control appears inline under the row. Segments: `Draft · Coming soon · Active`. Tapping a segment:
1. Optimistically updates the status pill.
2. Calls `authFetch("/api/admin/malls", { method: "PATCH", body: { id, status } })`.
3. On 2xx: toast "✓ {Mall name} → {new status}". On `active` specifically: toast lingers 8s with `note: "activated_at set to today."`.
4. On error: revert pill, error toast.

**No confirm-modal** for status changes. They're reversible and the toast covers auditability.

**Refresh button:** Same behavior as Requests tab — calls `getAllMalls` via the API and re-sets state.

---

## New API route

`app/api/admin/malls/route.ts`:

- `PATCH` — body `{ id: string, status: "draft" | "coming_soon" | "active" }`. Admin-gated via `requireAdmin`. Updates `malls.status`. If the new status is `active` and `activated_at IS NULL`, also sets `activated_at = now()` in the same UPDATE. Returns `{ ok, mall }`. Never clears `activated_at` on deactivation.

No GET — the admin `Malls` tab already uses the browser anon client through `getAllMalls()` (RLS allows public read).

---

## Vendor / shopper empty-state behavior

- **MallSheet on the feed when zero active malls exist:** "All malls" row only, with the existing "0 malls live · more soon" copy-label already in `MallSheet.tsx:116`. No extra empty-state copy needed — the component already handles zero live malls gracefully (that copy was added proactively for exactly this kind of early-state). ✅ Confirmed during surface mapping.
- **Vendor-request dropdown when zero active malls exist:** The form becomes unusable (can't submit without a mall selection). Add a brief italic line under the dropdown: *"No malls currently accepting new vendor requests. Check back soon, or reach out via Contact."* (Contact page is R7 — for now, fall back to a `mailto:` or the Site settings admin email). Worth the implementation session picking the exact copy, but the behavior shape is: soft-block, no error. The submit button stays disabled until an active mall exists. Extremely rare state in practice (there will always be at least one active mall once David activates the 1–2 he cares about).
- **Vendor attached to a mall that was demoted from `active` to `coming_soon` / `draft`:** Per D2, their my-shelf and shelf-detail pages continue to display the mall name. The booth-detail page continues to exist at its slug URL. The only visible change for that vendor: they no longer appear in shopper pickers. No in-app notification for the vendor — R9 (notifications) is out of scope for R4c.

---

## Out of scope

Explicit list of things R4c does NOT do:

- **R10 map rendering of `coming_soon` malls.** The `coming_soon` state is defined here and the schema supports it, but what a map does with `coming_soon` pins (dim? "Coming soon" label? hide entirely?) is an R10-scoping decision. R4c only ensures the schema + pickers are ready.
- **R11 mall hero images.** Hero upload is a separate R11 concern. R4c doesn't touch `malls.hero_image_url` (which doesn't exist yet anyway — R11 adds it).
- **R3 analytics events on activation.** `activated_at` is captured, but emitting a `mall_activated` event for downstream analytics is R3's job. The timestamp backfills R3's historical signal when R3 ships.
- **R13 mall-operator accounts.** Mall operators do not gain any self-serve activation rights in R4c. David remains the sole admin who flips status. R13 will decide whether to delegate activation.
- **Bulk activation / CSV import.** Per-mall toggle only. If David wants to activate 5 malls at once, that's 5 taps. Bulk is a premature abstraction.
- **Deactivation warning ("you're about to hide this mall from shoppers").** Status changes are single-tap reversible. If a deactivation accident becomes a real pattern, add the confirm in a follow-up — don't pre-empt it.
- **`deactivated_at` column.** Not needed until R3 needs it.

---

## Implementation plan (next session)

Sprint brief shape:

### Task 1 — Migration 🟢 AUTO
- Write `supabase/migrations/009_mall_status.sql` per the schema spec above.
- Apply via Supabase dashboard (HITL paste) OR via `supabase migration up` once the migrations pipeline is stood up (it isn't yet — prod migrations are manual-paste per session 48 pattern).

### Task 2 — lib helper 🟢 AUTO
- Add `getActiveMalls()` to `lib/posts.ts`.

### Task 3 — Rewire shopper / vendor-request consumers 🟢 AUTO
- `app/page.tsx:674` → `getActiveMalls()`.
- `app/vendor-request/page.tsx:146` → `getActiveMalls()`.
- Vendor-request zero-active empty state copy + disabled submit button.

### Task 4 — Admin `Malls` tab 🟢 AUTO
- New tab in `app/admin/page.tsx` (4th position).
- Status pill component (inline — don't extract a primitive unless used in ≥2 places this session).
- Three grouped sections with the collapse-drafts interaction.
- Inline segmented control on row tap.
- Status-pill surfacing in AddBoothInline dropdown + /shelves mall-group headers.

### Task 5 — Admin API route 🟢 AUTO
- `app/api/admin/malls/route.ts` PATCH handler per spec.

### Task 6 — Build + deploy verification 🟢 AUTO
- `npm run build 2>&1 | tail -30` clean.
- Commit with message format: `feat(r4c): mall active/inactive toggle + schema + admin tab`.

### Task 7 — HITL activation post-deploy 🖐️ HITL
- David signs into `/admin`, opens Malls tab, flips 1–2 real malls to `active`.
- On-device verification: feed picker shows only those malls. Vendor-request dropdown shows only those malls. `/my-shelf` for any existing vendor attached to a still-draft mall continues to render the mall name.

### Task 8 — Staging activation parity 🖐️ HITL
- Same flip, on staging, so the seed script's fixture vendors remain discoverable in staging feed filtering.

**Estimated runtime:** one session, ~90 min. Admin tab is the longest task but is isolated.

---

## Staging activation (one-time consideration)

`scripts/seed-staging.ts` seeds malls via the main seed SQL. Those malls will default to `draft` after migration 009 runs on staging. Two options:

- **(a) Update the seed script** to flip its fixture-mall slugs to `active` as a final step — guarantees staging feed works out of the box after a fresh seed.
- **(b) Leave as-is** and document "activate staging malls manually" as part of the seed-staging runbook.

Recommendation: **(a)**. The seed script already has admin privileges (service-role key) and the intent is a fully self-seeding staging environment. One more statement, zero ongoing cost.

---

## Cross-references

- Roadmap entry (to be promoted 🟡 → 🟢): [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md) R4c section.
- Admin UI mockup: [`docs/mockups/r4c-admin-v1.html`](mockups/r4c-admin-v1.html).
- Mall schema authority: [`supabase/migrations/001_initial_schema.sql:93`](../supabase/migrations/001_initial_schema.sql).
- MallSheet picker: [`components/MallSheet.tsx`](../components/MallSheet.tsx).
- Admin identity + tab shell: [`app/admin/page.tsx`](../app/admin/page.tsx).

---

## Open questions deferred to implementation session or downstream

- **Exact amber-tint token for the "Coming soon" pill.** Implementation session picks the nearest existing token in `lib/tokens.ts` — don't add a new token for one pill.
- **Collapse threshold for Draft section.** Spec says "~5" — implementation session picks 5 or 6 based on what looks right on the mockup.
- **R10 map treatment of `coming_soon` malls.** R10 scoping decision.
- **Whether `coming_soon` eventually accepts "waitlist me when this mall opens" shopper signals.** Post-R1, post-R9. Not R4c's problem.

---

> Last updated: 2026-04-24 (session 56 — design-to-Ready pass complete. R4c 🟢 Ready. All six decisions D1–D6 frozen; implementation session can run as a straight sprint against this spec.)
