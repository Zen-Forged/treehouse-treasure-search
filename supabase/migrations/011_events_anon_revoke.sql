-- Migration 011 — Revoke anon SELECT on events.
--
-- Discovered session 58 via scripts/inspect-events.ts: the default Supabase
-- public-schema grants give the `anon` role SELECT on every new public table.
-- For most app tables that's fine (malls/vendors/posts are deliberately
-- world-readable). Events is the exception — even though payloads avoid hard
-- PII per the R3 design record §D3, the table still records who-saved-what,
-- who-shared-which-booth, and which malls were activated when. Anon visibility
-- of that activity stream is not what the design intends.
--
-- Fix: REVOKE SELECT FROM anon. Reads continue to work via /api/admin/events
-- (service-role behind requireAdmin). Writes continue to work via /api/events
-- and inline recordEvent calls (also service-role). Service role bypasses
-- role-level grants, so this REVOKE is targeted strictly at the anon-public
-- read path.
--
-- After applying, re-run `npx tsx scripts/inspect-events.ts` and the bottom
-- "anon read attempt" section should report `rows: 0` (or an error message
-- about insufficient privilege).

REVOKE SELECT ON TABLE events FROM anon;

-- Defensive: also revoke from `authenticated`. Vendor sign-in carries the
-- authenticated role, and a logged-in vendor should see analytics only via
-- their own dashboard surfaces (none ship in R3) — never via direct table
-- reads. If a future vendor-facing analytics surface is built, it goes
-- through a service-role API route that exposes the curated subset.
REVOKE SELECT ON TABLE events FROM authenticated;
