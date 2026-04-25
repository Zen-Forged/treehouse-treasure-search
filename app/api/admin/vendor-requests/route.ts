// app/api/admin/vendor-requests/route.ts
// Admin-gated server API for vendor_requests table operations.
//
// GET   → list all vendor_requests (newest first, limit 50)
// POST  → { action: "approve", requestId } → creates vendor + marks request
//         approved + sends EMAIL #2 "Your booth is ready" to vendor via Resend
//
// Session 32 (2026-04-20) — v1.2 onboarding refresh:
//  - Approval now honors `vendor_requests.booth_name` if set. If null/empty,
//    falls back to `first_name + ' ' + last_name` (new split fields), then
//    to the legacy `name` column as a final fallback for pre-v1.2 rows that
//    predate the migration.
//  - Email #2 now uses first_name for salutation ("Hi Sarah") and passes no
//    link at all — the vendor opens the PWA themselves (PWA session-
//    continuity fix, see docs/design-system.md v1.2 + lib/email.ts).
//
// Session 13 (2026-04-17) — KI-004 resolution:
//  - Inspect 23505 constraint name to distinguish slug/booth/user_id collisions
//  - Slug collision → auto-append suffix (-2, -3, ...) and retry insert
//  - Booth collision + unlinked + name match → safe claim (reuse existing row)
//  - Booth collision + unlinked + name differs → reject with named detail
//  - Booth collision + already linked → reject hard with named detail
//  - All error responses include `diagnosis` and `conflict` fields
//
// Gated by requireAdmin() — email must match NEXT_PUBLIC_ADMIN_EMAIL.
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS on vendor_requests.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { sendApprovalInstructions } from "@/lib/email";
import { recordEvent } from "@/lib/events";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const MAX_SLUG_SUFFIX_ATTEMPTS = 20;

// ── GET: list vendor requests ─────────────────────────────────────────────────
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.service
    .from("vendor_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[admin/vendor-requests] GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to load vendor requests." },
      { status: 500 }
    );
  }

  return NextResponse.json({ requests: data ?? [] });
}

// ── POST: approve a vendor request ────────────────────────────────────────────
interface ApproveBody {
  action: "approve";
  requestId: string;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: ApproveBody;
  try {
    body = (await req.json()) as ApproveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "approve" || !body.requestId) {
    return NextResponse.json(
      { error: "Missing action or requestId." },
      { status: 400 }
    );
  }

  // 1. Fetch the request
  const { data: request, error: fetchErr } = await auth.service
    .from("vendor_requests")
    .select("*")
    .eq("id", body.requestId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/vendor-requests] fetch:", fetchErr.message);
    return NextResponse.json(
      { error: "Failed to fetch vendor request." },
      { status: 500 }
    );
  }

  if (!request) {
    return NextResponse.json(
      { error: "Vendor request not found.", diagnosis: "not_found" },
      { status: 404 }
    );
  }

  if (request.status === "approved") {
    return NextResponse.json(
      { error: "Request already approved.", diagnosis: "already_approved" },
      { status: 409 }
    );
  }

  if (!request.mall_id) {
    return NextResponse.json(
      {
        error: "Request is missing mall_id — cannot create vendor.",
        diagnosis: "missing_mall",
      },
      { status: 400 }
    );
  }

  // 2. Resolve display_name for vendors row.
  // Priority: booth_name (v1.2) → first_name + last_name (v1.2) → name (legacy).
  // Legacy `name` is populated on v1.2 inserts too, so this fallback covers
  // pre-migration rows but never fires for new requests.
  const firstName   = (request.first_name as string | null)?.trim() ?? "";
  const lastName    = (request.last_name  as string | null)?.trim() ?? "";
  const boothName   = (request.booth_name as string | null)?.trim() ?? "";
  const legacyName  = (request.name       as string | null)?.trim() ?? "";

  const displayName =
    boothName ||
    (firstName && lastName ? `${firstName} ${lastName}` : "") ||
    legacyName;

  if (!displayName) {
    return NextResponse.json(
      {
        error: "Request has no name data — cannot create vendor.",
        diagnosis: "missing_name",
      },
      { status: 400 }
    );
  }

  // Salutation for Email #2. Prefer first_name, fall back to first token of
  // legacyName, fall back to "there".
  const salutationFirstName =
    firstName ||
    legacyName.split(/\s+/)[0] ||
    "there";

  // 3. Create vendor with collision-aware handling
  const createResult = await createVendorForRequest(auth.service, {
    displayName,
    mallId:        request.mall_id,
    boothNumber:   request.booth_number || null,
    proofImageUrl: (request.proof_image_url as string | null) || null,
  });

  if (!createResult.ok) {
    return NextResponse.json(createResult.errorPayload, {
      status: createResult.status,
    });
  }

  const vendorRow = createResult.vendor;

  // 4. Mark request as approved
  const { error: updateErr } = await auth.service
    .from("vendor_requests")
    .update({ status: "approved" })
    .eq("id", body.requestId);

  const warnings: string[] = [];

  if (updateErr) {
    console.error(
      "[admin/vendor-requests] mark approved failed:",
      updateErr.message
    );
    warnings.push("Vendor created but request status update failed.");
  }

  // 5. Email #2: Approval + sign-in instructions (best-effort)
  const emailResult = await sendApprovalInstructions({
    firstName:   salutationFirstName,
    email:       request.email,
    mallName:    request.mall_name,
    boothNumber: request.booth_number,
  });

  if (!emailResult.ok) {
    console.error(
      "[admin/vendor-requests] approval email failed:",
      emailResult.error,
    );
    warnings.push(
      `Approval email failed to send — reach out to ${request.email} manually.`
    );
  }

  // R3 — analytics event for the approval action. Vendor email is NOT
  // captured (PII per D3); slug + mall identify the booth uniquely.
  await recordEvent("vendor_request_approved", {
    user_id: auth.user.id,
    payload: {
      vendor_slug:    vendorRow.slug,
      mall_id:        request.mall_id,
      mall_name:      request.mall_name,
      booth_number:   request.booth_number,
      had_warnings:   warnings.length > 0,
    },
  });

  return NextResponse.json({
    ok: true,
    vendor: vendorRow,
    ...(createResult.note ? { note: createResult.note } : {}),
    ...(warnings.length > 0 ? { warning: warnings.join(" ") } : {}),
  });
}

// ── vendor creation with collision handling ──────────────────────────────────

interface CreateVendorArgs {
  displayName:   string;
  mallId:        string;
  boothNumber:   string | null;
  proofImageUrl: string | null;
}

type CreateVendorResult =
  | { ok: true; vendor: any; note?: string }
  | { ok: false; status: number; errorPayload: Record<string, any> };

async function createVendorForRequest(
  service: SupabaseClient,
  args: CreateVendorArgs
): Promise<CreateVendorResult> {
  // Pre-flight: is there already a vendor at this (mall, booth)?
  if (args.boothNumber) {
    const { data: boothOccupant, error: boothErr } = await service
      .from("vendors")
      .select("*")
      .eq("mall_id", args.mallId)
      .eq("booth_number", args.boothNumber)
      .maybeSingle();

    if (boothErr) {
      console.error("[admin/vendor-requests] booth pre-check:", boothErr.message);
      return {
        ok: false,
        status: 500,
        errorPayload: {
          error: `Could not verify booth availability: ${boothErr.message}`,
          diagnosis: "booth_check_failed",
        },
      };
    }

    if (boothOccupant) {
      if (boothOccupant.user_id) {
        return {
          ok: false,
          status: 409,
          errorPayload: {
            error:
              `Booth ${args.boothNumber} is already claimed by ${boothOccupant.display_name}. ` +
              `Pick a different booth, or contact the existing vendor.`,
            diagnosis: "booth_already_claimed",
            conflict: {
              display_name: boothOccupant.display_name,
              booth_number: boothOccupant.booth_number,
              user_id:      boothOccupant.user_id,
              slug:         boothOccupant.slug,
            },
          },
        };
      }

      if (boothOccupant.display_name !== args.displayName) {
        return {
          ok: false,
          status: 409,
          errorPayload: {
            error:
              `Booth ${args.boothNumber} has an unlinked vendor row named "${boothOccupant.display_name}" — ` +
              `different from this request ("${args.displayName}"). Rename the request, or delete the stale row.`,
            diagnosis: "booth_unlinked_name_diff",
            conflict: {
              display_name: boothOccupant.display_name,
              booth_number: boothOccupant.booth_number,
              user_id:      null,
              slug:         boothOccupant.slug,
            },
          },
        };
      }

      // Safe claim path — unlinked row, matching name. Reuse it.
      // Backfill hero_image_url from the proof photo if the row doesn't have one.
      let claimedVendor = boothOccupant;
      if (args.proofImageUrl && !boothOccupant.hero_image_url) {
        const { data: updated } = await service
          .from("vendors")
          .update({ hero_image_url: args.proofImageUrl })
          .eq("id", boothOccupant.id)
          .select()
          .single();
        if (updated) claimedVendor = updated;
      }
      return {
        ok: true,
        vendor: claimedVendor,
        note: `Claimed existing unlinked vendor row at booth ${args.boothNumber}.`,
      };
    }
  }

  // No booth conflict. Try insert with auto-suffix on slug collision.
  const baseSlug = slugify(args.displayName);
  if (!baseSlug) {
    return {
      ok: false,
      status: 400,
      errorPayload: {
        error: `Display name "${args.displayName}" produced an empty slug after normalization. Rename the request.`,
        diagnosis: "empty_slug",
      },
    };
  }

  for (let attempt = 0; attempt < MAX_SLUG_SUFFIX_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const insertPayload = {
      mall_id:        args.mallId,
      display_name:   args.displayName,
      booth_number:   args.boothNumber,
      slug,
      hero_image_url: args.proofImageUrl,
    };

    const { data: inserted, error: insertErr } = await service
      .from("vendors")
      .insert([insertPayload])
      .select()
      .single();

    if (!insertErr && inserted) {
      return {
        ok: true,
        vendor: inserted,
        ...(attempt > 0
          ? { note: `Slug "${baseSlug}" was taken; assigned "${slug}" instead.` }
          : {}),
      };
    }

    if (insertErr?.code !== "23505") {
      console.error(
        "[admin/vendor-requests] insert vendor error:",
        insertErr?.message,
        insertErr?.code
      );
      return {
        ok: false,
        status: 500,
        errorPayload: {
          error: `Could not create vendor: ${insertErr?.message ?? "unknown error"}`,
          diagnosis: "insert_failed",
          ...(insertErr?.code ? { error_code: insertErr.code } : {}),
        },
      };
    }

    const constraintText =
      `${insertErr.details ?? ""} ${insertErr.message ?? ""}`.toLowerCase();
    const isSlugCollision   = constraintText.includes("vendors_slug_key");
    const isBoothCollision  = constraintText.includes("vendors_mall_booth_unique");
    const isUserIdCollision = constraintText.includes("vendors_user_id_key");

    if (isSlugCollision) {
      continue;
    }

    if (isBoothCollision) {
      return {
        ok: false,
        status: 409,
        errorPayload: {
          error:
            `Booth ${args.boothNumber} was claimed between our check and our insert. ` +
            `Refresh and try again, or pick a different booth.`,
          diagnosis: "booth_race",
        },
      };
    }

    if (isUserIdCollision) {
      return {
        ok: false,
        status: 500,
        errorPayload: {
          error: `Unexpected user_id conflict on insert. This shouldn't happen — contact an engineer.`,
          diagnosis: "unexpected_user_id_conflict",
        },
      };
    }

    console.error(
      "[admin/vendor-requests] unknown 23505:",
      insertErr.details,
      insertErr.message
    );
    return {
      ok: false,
      status: 500,
      errorPayload: {
        error: `Duplicate key on vendor insert (unknown constraint): ${insertErr.details ?? insertErr.message}`,
        diagnosis: "unknown_duplicate_key",
      },
    };
  }

  return {
    ok: false,
    status: 500,
    errorPayload: {
      error: `Exhausted ${MAX_SLUG_SUFFIX_ATTEMPTS} slug-suffix attempts for "${baseSlug}". Rename the request.`,
      diagnosis: "slug_suffix_exhausted",
    },
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}
