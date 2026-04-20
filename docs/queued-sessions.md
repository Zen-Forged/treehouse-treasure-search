# Treehouse — Queued Sessions
> Scoped work that has been deliberated and sequenced behind something else. Each entry is a ready-to-run session opener that a future Claude can pick up without re-deriving the plan.

Status key: 🟢 Ready to run · 🟡 Ready but waiting on a dependency · ⏸️ Superseded

---

## Q-001 🟡 KI-006 surgical hotfix (Path B from session 33)

**Status:** Ready to run, but intentionally waiting on the multi-booth rework (Path A) to ship first. Kept as a backup plan in case multi-booth scoping exposes a blocker and we need to buy back v1.2 onboarding for single-booth vendors while the rework continues.

**Created:** 2026-04-20 (session 34 open — David chose Path A, captured Path B here so the plan survives the session boundary)

**Why this is queued, not killed:** Path A (multi-booth rework) is the right sequencing — Path B would patch on a model we're about to replace, and the fix would need to be redone post-rework. But the plan is cheap to keep on paper in case we hit a multi-booth blocker mid-sprint and need v1.2 onboarding partially working sooner.

### The bug (KI-006)

Session-32 regression in `/api/setup/lookup-vendor`. The route matches `vendor_requests.name` against `vendors.display_name`. These no longer match after session 32's approval priority change (`booth_name → first+last → name`) — so any Flow 3 vendor who fills in `booth_name` cannot complete `/setup` linkage. OTP verifies cleanly, session establishes, lookup-vendor returns 404, `/my-shelf` renders `<NoBooth>`. Vendor is stranded.

Caught session 33 walk step 6 on-device. Currently blocks any new v1.2 vendor who sets a `booth_name` from onboarding.

Full context in `docs/known-issues.md` → KI-006 and `docs/DECISION_GATE.md` Risk Register row.

### The surgical fix shape

Replace the `display_name == vendor_requests.name` join in `app/api/setup/lookup-vendor/route.ts` with a composite-key lookup that matches the session-32 approval priority:

1. **Primary lookup** — `vendors.mall_id == request.mall_id` AND `vendors.booth_number == request.booth_number` AND `vendors.user_id IS NULL`. This is the authoritative pair at the data layer: the admin approval flow already uses `(mall_id, booth_number)` as the collision check (per session-13 KI-004 fix), so it's the right natural key for post-approval linkage too.
2. **Fallback lookup** — if the primary returns zero rows, try `vendors.display_name` matched against the session-32 priority: first check `booth_name` if set, then `first_name + ' ' + last_name` if both set, then legacy `name`. Keeps pre-session-32 vendors (who still have `display_name = name`) working without a data migration.
3. **Guard** — both lookups preserve the `user_id IS NULL` constraint so a re-sign-in after setup completes doesn't re-link or bump to another vendor row.

Session-32 `vendor_requests` columns needed: `booth_number`, `mall_id`, `booth_name`, `first_name`, `last_name`, `name`. All already on the table per migration `005_vendor_request_onboarding_refresh.sql`.

### What Path B does NOT touch

- `vendors.user_id UNIQUE` constraint stays intact — single-vendor-per-user at the data layer
- `/my-shelf` single-vendor resolution via `getVendorByUserId` stays intact
- `/post` identity resolution stays intact
- `/admin` approval flow stays intact
- Session-32 v1.2 email dedup on `(email, status)` stays intact

Multi-booth remains blocked at the schema layer. This is the explicit trade-off of Path B.

### Session opener (copy/paste if promoted)

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running queued session Q-001 from docs/queued-sessions.md — KI-006 surgical hotfix (Path B). Full fix shape in that doc. Session-32 code is still uncommitted on disk; commit that backlog as part of this session's push. On-device QA walk steps 6–10 resume after the fix lands.
```

### Execution checklist (estimated ~30 min + on-device walk)

1. 🟢 AUTO — Read `app/api/setup/lookup-vendor/route.ts` current state
2. 🟢 AUTO — Rewrite the lookup per the fix shape above, preserving:
   - `requireAuth` bearer-token pattern
   - The already-linked short-circuit (user signs in again post-setup)
   - The newest-first `vendor_requests` ordering
   - `.maybeSingle()` not `.single()` for zero-row safety
   - Race-safe update guard (`user_id IS NULL` in the UPDATE WHERE)
3. 🟢 AUTO — Update error copy on the `/setup` client side if needed (T4c orphan — natural to batch)
4. 🖐️ HITL — `npm run build 2>&1 | tail -30`
5. 🖐️ HITL — Commit bundled: session-32 backlog + Q-001 hotfix
   - `git add -A && git commit -m "q-001: KI-006 hotfix (composite-key lookup) + session 32 backlog" && git push`
6. 🖐️ HITL — On-device QA walk, resume at step 6:
   - 6. PWA sign-in with `booth_name` test request → OTP verify → `/setup` links cleanly
   - 7. `/my-shelf` renders with `display_name == booth_name`
   - 8. Second fresh Flow 3 with only first+last (no `booth_name`) → `display_name == "First Last"`
   - 9. Already-approved state on re-sign-in
   - 10. Commit any cleanup + push
7. 🟢 AUTO — Update `docs/known-issues.md` KI-006 → Resolved with session ref
8. 🟢 AUTO — Update `docs/DECISION_GATE.md` Risk Register KI-006 row → ✅
9. 🟢 AUTO — Update this doc: Q-001 status → ⏸️ Superseded (with reason)

### Promotion triggers (when Path B becomes right)

Promote Q-001 from 🟡 to 🟢 and run it IF any of:
- Multi-booth scoping (Path A) exposes a schema migration risk we're not ready to take
- A real Flow 3 vendor hits KI-006 in production before the multi-booth code sprint ships
- Multi-booth code sprint slips past ~1 week and v1.2 onboarding needs to be partially unblocked
- David decides shipping single-booth v1.2 has standalone value even with multi-booth coming behind it

### Retirement triggers (when Path B becomes wrong)

Retire Q-001 (mark ⏸️ Superseded) IF:
- Multi-booth rework ships and naturally includes the array-returning `lookup-vendor` rewrite — at which point KI-006 is fixed as a sub-fix of that larger change and this queued session is never needed

---
> Maintained by Docs agent. Entries are scoped, sequenced work — not vague ideas. Anything here should be runnable by a future Claude session with no additional deliberation.
