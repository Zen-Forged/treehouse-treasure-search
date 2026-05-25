// app/api/vendor-request/check-pending/route.ts
// Session 195 — pending-vendor-request landing routing.
//
// Returns whether the authed user has a pending vendor_request matching
// their auth email (lower-cased). Consumed by lib/auth.ts
// `detectUserRoleWithAutoClaim` to surface a new "pending_vendor" role
// for routing surfaces (/login pickDest + /welcome mount), so a vendor
// who submitted /vendor-request and signs in before admin approval
// lands on the existing DoneScreen "already_pending" state instead of
// /welcome's "Just exploring vs Set up booth" disambiguation (which
// invites a duplicate vendor-request submission).
//
// Per `feedback_enumerate_states_in_self_heal_helpers` ✅ Promoted —
// the session 123 self-heal short-circuit assumed "none" was terminal;
// pending vendor_request is the un-enumerated intermediate state.
// This is the 2nd cumulative firing of that rule post-promotion.
//
// Per `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted
// — vendor_requests has no user_id column; match is by email against
// auth.users.email (lower-cased). Matches the lookup-vendor pattern.
//
// Why a server endpoint (not a client-side supabase.from query):
// vendor_requests is service-role-gated; authed users cannot SELECT
// directly via RLS. Mirrors /api/setup/lookup-vendor's auth shape.
//
// Response shape: { ok: true, hasPending: boolean }
// Auth: requireAuth (any signed-in user).

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = auth.user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "User has no email on file." },
      { status: 400 }
    );
  }

  // Single-row lookup — vendor_requests_email_pending_idx is a UNIQUE
  // index on lower(email) WHERE status='pending', so at most one row.
  const { data, error } = await auth.service
    .from("vendor_requests")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    console.error("[check-pending] vendor_requests lookup:", error.message);
    return NextResponse.json(
      { ok: false, error: "Failed to check vendor request status." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, hasPending: Boolean(data) });
}
