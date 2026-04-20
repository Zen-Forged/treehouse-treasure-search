// app/api/setup/lookup-vendor/route.ts
// Authenticated vendor self-service linkage endpoint.
//
// Session 35 (2026-04-20) — multi-booth rework (Option A) + KI-006 fix.
// Session 35 follow-up (same day) — removed step-1 short-circuit that
//   prevented a newly-approved second booth from ever being linked for
//   a user who already had one booth linked. See notes below.
//
// This route does two things at once:
//
//  1. Returns an ARRAY of vendor rows (the authenticated user may own
//     multiple booths post-multi-booth). Response shape: { ok, vendors,
//     alreadyLinked? }. /setup client and /my-shelf self-heal both
//     consume the array form.
//
//  2. Replaces the session-32-broken join `vendors.display_name ==
//     vendor_requests.name` with a composite-key lookup on
//     `(mall_id, booth_number, user_id IS NULL)`. That's the canonical
//     natural key (vendors_mall_booth_unique enforces it) and doesn't care
//     what display_name resolves to at approval time — so KI-006 goes away
//     as a natural sub-fix rather than a patch.
//
// Flow (revised — no short-circuit):
//   1. requireAuth — bearer token validated by service-role client
//   2. Fetch the user's currently-linked vendor rows (may be empty, 1, or N)
//   3. Fetch all non-rejected vendor_requests for lower(email) == lower(user.email)
//   4. For each request, find an unlinked vendor row matching
//      (mall_id, booth_number, user_id IS NULL). Collect matches.
//   5. If any matches → single UPDATE ... IN (ids) guarded by
//      user_id IS NULL to preserve race-safety.
//   6. Re-fetch the user's linked rows (now including anything just linked)
//      with mall joined and return them.
//
// Why no short-circuit on "already has linked rows":
//   The prior version returned early the moment the user had ANY linked
//   vendor row. That broke multi-booth add-on approval: a user with one
//   existing linked booth and a newly-approved unlinked second booth
//   would get only the first one back, and the second would never link.
//   The whole pipeline is idempotent — steps 3–4 skip already-linked
//   rows via `.is("user_id", null)` — so running them every call is safe
//   and cheap (two indexed selects in the no-new-work case).
//
// Three terminal cases:
//   - User has linked rows, no pending unlinked requests → return existing
//     linked set with alreadyLinked: true (step 6)
//   - User has new unlinked matches → link them, return combined set
//     (step 5 + step 6)
//   - User has no linked rows AND no matchable requests → 404, correct
//     per current /setup and /my-shelf copy ("your vendor account isn't
//     ready yet" — the admin hasn't approved)
//
// The name-join is GONE. Nothing on this route reads display_name anymore.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "User has no email on file." },
      { status: 400 }
    );
  }

  // ── 1. Fetch already-linked vendor rows (informational, not short-circuit) ─
  // We still need this count later to decide between "nothing to do, return
  // what you have" vs. "genuinely 404 — no vendor yet."
  const { data: alreadyLinked, error: alreadyLinkedErr } = await auth.service
    .from("vendors")
    .select("id")
    .eq("user_id", auth.user.id);

  if (alreadyLinkedErr) {
    console.error(
      "[setup/lookup-vendor] already-linked fetch:",
      alreadyLinkedErr.message
    );
    return NextResponse.json(
      { error: "Failed to look up vendor account." },
      { status: 500 }
    );
  }

  const alreadyLinkedCount = alreadyLinked?.length ?? 0;

  // ── 2. Fetch all non-rejected vendor_requests for this email ──────────────
  const { data: requests, error: requestErr } = await auth.service
    .from("vendor_requests")
    .select("mall_id, booth_number")
    .eq("email", email)
    .neq("status", "rejected");

  if (requestErr) {
    console.error("[setup/lookup-vendor] request fetch:", requestErr.message);
    return NextResponse.json(
      { error: "Failed to look up vendor request." },
      { status: 500 }
    );
  }

  // ── 3. For each request, find the matching unlinked vendor row ───────────
  // Composite key: (mall_id, booth_number, user_id IS NULL). Already-linked
  // rows (including rows linked to THIS user from an earlier call) are
  // naturally filtered out by `.is("user_id", null)`, so this loop is
  // idempotent and safe to run every request.
  const matchIds: string[] = [];

  for (const request of (requests ?? [])) {
    if (!request.mall_id) continue;

    // booth_number can legitimately be null for pre-v1.2 rows or demo
    // Flow 2 entries with no booth yet. Skip those — no composite key
    // means no deterministic match.
    if (!request.booth_number) continue;

    const { data: candidate, error: candidateErr } = await auth.service
      .from("vendors")
      .select("id")
      .eq("mall_id", request.mall_id)
      .eq("booth_number", request.booth_number)
      .is("user_id", null)
      .maybeSingle();

    if (candidateErr) {
      console.error(
        "[setup/lookup-vendor] candidate fetch:",
        candidateErr.message,
        { mall_id: request.mall_id, booth_number: request.booth_number }
      );
      continue;
    }

    if (candidate) {
      matchIds.push(candidate.id);
    }
  }

  // ── 4. If there are new matches, link them ────────────────────────────────
  if (matchIds.length > 0) {
    const { error: linkErr } = await auth.service
      .from("vendors")
      .update({ user_id: auth.user.id })
      .in("id", matchIds)
      .is("user_id", null);

    if (linkErr) {
      console.error("[setup/lookup-vendor] link error:", linkErr.message);
      return NextResponse.json(
        { error: "Failed to link vendor account." },
        { status: 500 }
      );
    }
  }

  // ── 5. Re-fetch every vendor row now linked to this user ──────────────────
  // Catches both "just linked this call" and "linked in a prior call"
  // uniformly. Runs even if matchIds was empty so a repeat caller with
  // already-linked rows gets the full set back with no wasted update.
  const { data: linked, error: refetchErr } = await auth.service
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });

  if (refetchErr) {
    console.error("[setup/lookup-vendor] refetch:", refetchErr.message);
    return NextResponse.json(
      { error: "Failed to load vendor account." },
      { status: 500 }
    );
  }

  // ── 6. Three terminal branches ────────────────────────────────────────────

  // 6a. Fully resolved — either we just linked some rows, or this user
  // already had linked rows from a prior call. Return them.
  if (linked && linked.length > 0) {
    const noNewWork = matchIds.length === 0;
    return NextResponse.json({
      ok: true,
      vendors: linked,
      ...(noNewWork && alreadyLinkedCount > 0 ? { alreadyLinked: true } : {}),
    });
  }

  // 6b. No linked rows AND no matchable requests → genuine 404.
  // Either the email has no vendor_requests at all, or all requests
  // are for booths that haven't been approved (no vendor row created yet).
  if (!requests || requests.length === 0) {
    return NextResponse.json(
      {
        error:
          "No vendor request found for this email. Contact admin if you believe this is an error.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      error:
        "Your vendor account isn't ready yet. An admin needs to approve your request first.",
    },
    { status: 404 }
  );
}
