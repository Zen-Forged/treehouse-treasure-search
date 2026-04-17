// app/api/admin/vendor-requests/route.ts
// Admin-gated server API for vendor_requests table operations.
//
// GET   → list all vendor_requests (newest first, limit 50)
// POST  → { action: "approve", requestId } → creates vendor + marks request
//         approved + sends EMAIL #2 "Your booth is ready" to vendor via Resend
//         (per docs/onboarding-journey.md — Sprint 4 T4a)
//
// Gated by requireAdmin() — email must match NEXT_PUBLIC_ADMIN_EMAIL.
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS on vendor_requests
// (which has service-role-only policy).
//
// Email is best-effort — a failed send is surfaced via the `warning` field
// on the response (admin UI already renders this inside the approval toast),
// but still returns ok:true so the approval is not undone. The vendor row
// exists, the request is marked approved, and admin can manually re-send or
// reach out to the vendor out-of-band.
//
// ── Session 13 (2026-04-17) — KI-004 resolution ─────────────────────────────
// The 23505 duplicate-key branch used to silently reuse any existing vendor
// row at (mall_id, booth_number) regardless of whether it was stale, linked
// to a different user, or had a different display_name. It also assumed the
// constraint that fired was vendors_mall_booth_unique — but vendors has FOUR
// unique constraints (booth, slug, user_id, pkey). A slug collision would
// silently fall through and throw "Cannot coerce the result to a single
// JSON object" from the booth lookup's .single() call.
//
// New policy:
//   - Inspect the constraint name from the error to know which collision it is
//   - Slug collision → auto-append suffix (-2, -3, ...) and retry insert
//   - Booth collision + unlinked + name match → safe claim (reuse existing row)
//   - Booth collision + unlinked + name differs → reject with named detail
//   - Booth collision + already linked → reject hard with named detail
//   - All error responses include `diagnosis` and `conflict` fields so the
//     admin UI can render specifics without a separate diagnose call

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { sendApprovalInstructions } from "@/lib/email";
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

  // 2. Create vendor with collision-aware handling
  const createResult = await createVendorForRequest(auth.service, {
    name:         request.name,
    mallId:       request.mall_id,
    boothNumber:  request.booth_number || null,
  });

  if (!createResult.ok) {
    return NextResponse.json(createResult.errorPayload, {
      status: createResult.status,
    });
  }

  const vendorRow = createResult.vendor;

  // 3. Mark request as approved
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

  // 4. Email #2: Approval + sign-in instructions (best-effort)
  const emailResult = await sendApprovalInstructions({
    name:        request.name,
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

  return NextResponse.json({
    ok: true,
    vendor: vendorRow,
    ...(createResult.note ? { note: createResult.note } : {}),
    ...(warnings.length > 0 ? { warning: warnings.join(" ") } : {}),
  });
}

// ── vendor creation with collision handling ──────────────────────────────────

interface CreateVendorArgs {
  name:         string;
  mallId:       string;
  boothNumber:  string | null;
}

type CreateVendorResult =
  | { ok: true; vendor: any; note?: string }
  | { ok: false; status: number; errorPayload: Record<string, any> };

async function createVendorForRequest(
  service: SupabaseClient,
  args: CreateVendorArgs
): Promise<CreateVendorResult> {
  // ── Pre-flight check: is there already a vendor at this (mall, booth)? ──
  // If yes, decide whether to safely claim, reject on name mismatch, or
  // reject hard on an already-claimed booth. This avoids the noisy insert
  // attempt in the common cases.
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
        // Hard block — booth is actively claimed by some user.
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

      if (boothOccupant.display_name !== args.name) {
        // Unlinked row with a different name — admin needs to decide
        // whether to rename the request or clean up the stale row.
        return {
          ok: false,
          status: 409,
          errorPayload: {
            error:
              `Booth ${args.boothNumber} has an unlinked vendor row named "${boothOccupant.display_name}" — ` +
              `different from this request ("${args.name}"). Rename the request, or delete the stale row.`,
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
      return {
        ok: true,
        vendor: boothOccupant,
        note: `Claimed existing unlinked vendor row at booth ${args.boothNumber}.`,
      };
    }
  }

  // ── No booth conflict. Try insert with auto-suffix on slug collision. ──
  const baseSlug = slugify(args.name);
  if (!baseSlug) {
    return {
      ok: false,
      status: 400,
      errorPayload: {
        error: `Vendor name "${args.name}" produced an empty slug after normalization. Rename the request.`,
        diagnosis: "empty_slug",
      },
    };
  }

  for (let attempt = 0; attempt < MAX_SLUG_SUFFIX_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const insertPayload = {
      mall_id:      args.mallId,
      display_name: args.name,
      booth_number: args.boothNumber,
      slug,
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

    // 23505 — identify which constraint fired via the error details/message.
    // PostgREST surfaces constraint names in `details` or `message`.
    const constraintText =
      `${insertErr.details ?? ""} ${insertErr.message ?? ""}`.toLowerCase();
    const isSlugCollision = constraintText.includes("vendors_slug_key");
    const isBoothCollision = constraintText.includes("vendors_mall_booth_unique");
    const isUserIdCollision = constraintText.includes("vendors_user_id_key");

    if (isSlugCollision) {
      // Loop again with an incremented suffix.
      continue;
    }

    if (isBoothCollision) {
      // We pre-checked booth at the top of this function but a race could
      // still produce this. Surface a clear error.
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
      // We don't insert user_id — this would mean an orphan constraint
      // state and warrants an explicit error.
      return {
        ok: false,
        status: 500,
        errorPayload: {
          error: `Unexpected user_id conflict on insert. This shouldn't happen — contact an engineer.`,
          diagnosis: "unexpected_user_id_conflict",
        },
      };
    }

    // Unknown 23505 — surface the raw detail so we can learn what happened.
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

  // Ran out of suffix attempts — extremely unlikely (would need 20 vendors
  // named "David Butler" before this fires) but handle it cleanly.
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
