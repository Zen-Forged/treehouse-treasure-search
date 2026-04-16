// app/api/setup/lookup-vendor/route.ts
// Authenticated vendor-self-service endpoint.
//
// Flow: user signs in via magic link → lands on /setup → client POSTs here.
// Server:
//   1. Identify authenticated user from bearer token (requireAuth)
//   2. Look up vendor_request by email (any status except 'rejected')
//   3. Find the matching vendor row (display_name + mall_id, user_id IS NULL)
//   4. Link vendor.user_id = user.id, return the vendor row with mall joined
//
// This bundles the old getVendorByEmail + linkVendorToUser into one server
// call with no race window — and works despite vendor_requests RLS because
// the service role client bypasses it.
//
// Status filter note: we use .neq("status", "rejected") rather than an allow-
// list of ["pending", "approved"] because the vendor row's existence (with
// user_id IS NULL) is the real gate — not the request status. A pending
// request with no vendor row yet will fall through to the "not ready" 404
// below, which is correct. Rejected requests are the only state we need to
// actively block.

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

  // 0. Short-circuit: user is already linked to a vendor row.
  // Handles the "signed in again after setup completed" case.
  const { data: alreadyLinkedVendor } = await auth.service
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (alreadyLinkedVendor) {
    return NextResponse.json({
      ok: true,
      vendor: alreadyLinkedVendor,
      alreadyLinked: true,
    });
  }

  // 1. Look up vendor_request by email (any status except rejected).
  // Newest first, in case the same email has multiple requests.
  const { data: requests, error: requestErr } = await auth.service
    .from("vendor_requests")
    .select("name, mall_id, booth_number, mall_name, status")
    .eq("email", email)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1);

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

  const request = requests[0];

  if (!request.mall_id) {
    return NextResponse.json(
      { error: "Vendor request is missing mall information." },
      { status: 500 }
    );
  }

  // 2. Find matching vendor row — display_name + mall_id, user_id unset.
  // If not found, the admin hasn't approved yet (approval is what creates
  // the vendor row).
  const { data: vendor, error: vendorErr } = await auth.service
    .from("vendors")
    .select("id")
    .eq("display_name", request.name)
    .eq("mall_id", request.mall_id)
    .is("user_id", null)
    .maybeSingle();

  if (vendorErr) {
    console.error("[setup/lookup-vendor] vendor fetch:", vendorErr.message);
    return NextResponse.json(
      { error: "Failed to look up vendor account." },
      { status: 500 }
    );
  }

  if (!vendor) {
    return NextResponse.json(
      {
        error:
          "Your vendor account isn't ready yet. An admin needs to approve your request first.",
      },
      { status: 404 }
    );
  }

  // 3. Link vendor.user_id = user.id (with race-safe guard)
  const { data: linked, error: linkErr } = await auth.service
    .from("vendors")
    .update({ user_id: auth.user.id })
    .eq("id", vendor.id)
    .is("user_id", null) // guard against race
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .single();

  if (linkErr || !linked) {
    console.error(
      "[setup/lookup-vendor] link error:",
      linkErr?.message
    );
    return NextResponse.json(
      { error: "Failed to link vendor account." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, vendor: linked });
}
