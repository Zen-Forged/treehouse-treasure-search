// app/api/setup/lookup-vendor/route.ts
// Authenticated vendor self-service linkage endpoint.
//
// Session 35 (2026-04-20) — multi-booth rework (Option A) + KI-006 fix.
//
// This rewrite does two things at once:
//
//  1. Returns an ARRAY of vendor rows (the authenticated user may own
//     multiple booths post-multi-booth). Response shape: { ok, vendors,
//     alreadyLinked? }. /setup client updated to match.
//
//  2. Replaces the session-32-broken join `vendors.display_name ==
//     vendor_requests.name` with a composite-key lookup on
//     `(mall_id, booth_number, user_id IS NULL)`. That's the canonical
//     natural key (vendors_mall_booth_unique enforces it) and doesn't care
//     what display_name resolves to at approval time — so KI-006 goes away
//     as a natural sub-fix rather than a patch.
//
// Flow:
//   1. requireAuth — bearer token validated by service-role client
//   2. Short-circuit — if any vendors row already links to user.id, return
//      those rows. Handles "signed in again after setup completed" cleanly
//      and idempotently (also catches the multi-booth case where all links
//      were made on a prior visit).
//   3. Fetch all vendor_requests for lower(email) == lower(user.email)
//      where status != 'rejected'. A single vendor may have multiple
//      requests (one per mall/booth).
//   4. For each request, find an unlinked vendor row matching
//      (mall_id, booth_number, user_id IS NULL). Collect matches.
//   5. Link every match in a single UPDATE ... IN (ids) guarded by
//      user_id IS NULL to preserve race-safety.
//   6. Re-fetch the freshly-linked rows with mall joined and return them.
//
// If step 3 finds requests but step 4 matches nothing, the admin hasn't
// approved yet — return the existing "your vendor account isn't ready yet"
// 404. If step 3 finds nothing at all, return the existing "no vendor
// request for this email" 404.
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

  // ── 1. Short-circuit: user already has linked vendor row(s) ──────────────
  // Handles re-sign-in after setup completed, AND the multi-booth case
  // where every request was already linked on a prior visit.
  const { data: alreadyLinked, error: alreadyLinkedErr } = await auth.service
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });

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

  if (alreadyLinked && alreadyLinked.length > 0) {
    return NextResponse.json({
      ok: true,
      vendors: alreadyLinked,
      alreadyLinked: true,
    });
  }

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

  if (!requests || requests.length === 0) {
    return NextResponse.json(
      {
        error:
          "No vendor request found for this email. Contact admin if you believe this is an error.",
      },
      { status: 404 }
    );
  }

  // ── 3. For each request, find the matching unlinked vendor row ───────────
  // Composite key: (mall_id, booth_number, user_id IS NULL). This replaces
  // the session-32-broken display_name join and is indifferent to the
  // booth_name / first+last / legacy-name priority used at approval time.
  //
  // Sequential loop (not Promise.all) because each request's match is an
  // independent query and we need to surface partial success — a vendor
  // with two approved booths and one still-pending should still get their
  // approved booths linked on this call.
  const matchIds: string[] = [];

  for (const request of requests) {
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

  if (matchIds.length === 0) {
    return NextResponse.json(
      {
        error:
          "Your vendor account isn't ready yet. An admin needs to approve your request first.",
      },
      { status: 404 }
    );
  }

  // ── 4. Link all matches in a single race-safe UPDATE ──────────────────────
  // user_id IS NULL guard preserves session-9's race safety: if a row was
  // claimed by another path between our select and this update, the WHERE
  // filters it out and we move on.
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

  // ── 5. Re-fetch the just-linked rows with mall joined ─────────────────────
  // We refetch (rather than returning the update's `.select()` directly)
  // because any rows the race guard filtered out should surface here if
  // they were claimed by an earlier call — the user_id filter catches both
  // "just linked this call" and "linked by a prior call" uniformly.
  const { data: linked, error: refetchErr } = await auth.service
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });

  if (refetchErr || !linked || linked.length === 0) {
    console.error(
      "[setup/lookup-vendor] refetch:",
      refetchErr?.message ?? "zero rows post-link"
    );
    return NextResponse.json(
      { error: "Failed to load vendor account." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, vendors: linked });
}
