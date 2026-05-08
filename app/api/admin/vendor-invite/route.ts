// app/api/admin/vendor-invite/route.ts
// Admin-gated endpoint: invite a vendor to claim a pre-seeded booth row.
//
// Closes the gap surfaced at Arc 4 Arc 2.4 QA (2026-05-08): admin pre-seeds
// a booth via /shelves AddBoothSheet → vendors row inserted with user_id=NULL
// + NO matching vendor_request → orphan booth with no claim path. The Edit
// sheet doesn't capture email because vendors table doesn't store email
// (auth lives in Supabase auth + vendor_requests). Without an invite
// affordance, SQL is the only fix.
//
// Shape: synthesize a vendor_requests row marked approved with the entered
// email, then fire the existing approval email. All downstream infrastructure
// (sendApprovalInstructions template, tryAutoClaimVendorRows in lib/auth.ts,
// /api/setup/lookup-vendor email-keyed match) just works — vendor receives
// the same onboarding as a self-registered + approved vendor, claim attaches
// on first sign-in.
//
// Idempotent: if a vendor_request already exists for the same
// (email, mall_id, booth_number), reuse it (status flipped to approved if
// pending; left alone if already approved). Resending the email is safe.
//
// Endpoint surfaces only on rows where:
//   vendor.user_id IS NULL AND vendor.diagnosis.matchingRequest IS NULL
// (i.e., orphan-unlinked). When a matching request already exists, admin
// uses Relink instead. Server still validates these conditions on its own
// in case the client gates drift.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { recordEvent } from "@/lib/events";
import { sendApprovalInstructions } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: {
    vendorId?:  string;
    email?:     string;
    firstName?: string;
    lastName?:  string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const vendorId  = body.vendorId?.trim();
  const email     = body.email?.trim().toLowerCase();
  const firstName = body.firstName?.trim() ?? "";
  const lastName  = body.lastName?.trim()  ?? "";

  if (!vendorId) return NextResponse.json({ error: "vendorId is required." }, { status: 400 });
  if (!email)    return NextResponse.json({ error: "email is required." },    { status: 400 });

  // Loose email shape check — server-side validation; trust client minimal.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email format looks off." }, { status: 400 });
  }

  // ── 1. Fetch vendor row + mall ──
  const { data: vendor, error: vendorErr } = await auth.service
    .from("vendors")
    .select("id, display_name, user_id, mall_id, booth_number, hero_image_url, mall:malls(id, name)")
    .eq("id", vendorId)
    .maybeSingle();

  if (vendorErr) {
    console.error("[admin/vendor-invite] vendor fetch:", vendorErr.message);
    return NextResponse.json({ error: vendorErr.message }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }
  if (vendor.user_id !== null) {
    return NextResponse.json(
      { error: "Booth is already linked to a vendor.", code: "ALREADY_LINKED" },
      { status: 409 },
    );
  }

  // ── 2. Resolve display values for the synthesized request ──
  // name (legacy column) — required, fall back to vendor.display_name.
  // first_name + last_name optional but feed the email salutation.
  // booth_name = vendor.display_name so relink-priority resolves correctly
  // if Relink ever runs against this synthesized request (boothName wins).
  const fullName    = [firstName, lastName].filter(Boolean).join(" ").trim();
  const legacyName  = fullName || vendor.display_name;
  const boothName   = vendor.display_name;

  // ── 3. Find or insert vendor_requests row ──
  // Composite identity: (lower(email), mall_id, booth_number) — partial
  // unique index covers status='pending' but we need to handle approved
  // duplicates manually. SELECT first.
  const { data: existing, error: existingErr } = await auth.service
    .from("vendor_requests")
    .select("id, status")
    .ilike("email", email)
    .eq("mall_id",  vendor.mall_id)
    .eq("booth_number", vendor.booth_number)
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    console.error("[admin/vendor-invite] existing lookup:", existingErr.message);
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  let requestId:    string;
  let wasResend = false;

  if (existing) {
    // Re-invite path: flip to approved + refresh fields. Email goes out
    // again so vendor can re-attempt sign-in with fresh instructions.
    const { error: updateErr } = await auth.service
      .from("vendor_requests")
      .update({
        status:     "approved",
        name:       legacyName,
        first_name: firstName || null,
        last_name:  lastName  || null,
        booth_name: boothName,
      })
      .eq("id", existing.id);

    if (updateErr) {
      console.error("[admin/vendor-invite] update existing:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    requestId  = existing.id;
    wasResend  = true;
  } else {
    // Fresh invite path.
    const { data: inserted, error: insertErr } = await auth.service
      .from("vendor_requests")
      .insert({
        email,
        mall_id:      vendor.mall_id,
        booth_number: vendor.booth_number,
        status:       "approved",
        name:         legacyName,
        first_name:   firstName || null,
        last_name:    lastName  || null,
        booth_name:   boothName,
      })
      .select("id")
      .single();

    if (insertErr) {
      // 23505 = unique violation. Shouldn't fire because the partial unique
      // index on pending+email+mall+booth doesn't cover status='approved',
      // but defensive in case schema drifts.
      console.error("[admin/vendor-invite] insert:", insertErr.message, insertErr.code);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    requestId = inserted.id;
  }

  // ── 4. Fire approval email ──
  // sendApprovalInstructions uses Resend; failures don't roll back the
  // synthesized request — admin can re-invite to retry the email.
  const emailFirstName = firstName || "there";
  const mallName = (vendor.mall as { name?: string } | null)?.name ?? null;
  const emailResult = await sendApprovalInstructions({
    firstName:    emailFirstName,
    email,
    mallName,
    boothNumber:  vendor.booth_number,
    heroImageUrl: vendor.hero_image_url,
  });

  if (!emailResult.ok) {
    console.warn(
      "[admin/vendor-invite] email send failed (request still saved):",
      emailResult.error,
    );
  }

  await recordEvent("vendor_invited_by_admin", {
    user_id: auth.user.id,
    payload: {
      vendor_id:         vendorId,
      vendor_request_id: requestId,
      email,
      mall_id:           vendor.mall_id,
      booth_number:      vendor.booth_number,
      was_resend:        wasResend,
      email_sent:        emailResult.ok,
    },
  });

  console.log("[admin/vendor-invite] invited", {
    vendorId,
    requestId,
    email,
    wasResend,
    email_sent: emailResult.ok,
  });

  return NextResponse.json({
    ok:           true,
    requestId,
    wasResend,
    emailSent:    emailResult.ok,
    emailError:   emailResult.ok ? null : (emailResult.error ?? "Unknown email error"),
  });
}
