// app/api/admin/vendor-requests/route.ts
// Admin-gated server API for vendor_requests table operations.
//
// GET   → list all vendor_requests (newest first, limit 50)
// POST  → { action: "approve", requestId } → creates vendor + marks request approved
//
// Gated by requireAdmin() — email must match NEXT_PUBLIC_ADMIN_EMAIL.
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS on vendor_requests
// (which has service-role-only policy).

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

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
    .single();

  if (fetchErr || !request) {
    console.error("[admin/vendor-requests] fetch:", fetchErr?.message);
    return NextResponse.json(
      { error: "Vendor request not found." },
      { status: 404 }
    );
  }

  if (request.status === "approved") {
    return NextResponse.json(
      { error: "Request already approved." },
      { status: 409 }
    );
  }

  if (!request.mall_id) {
    return NextResponse.json(
      { error: "Request is missing mall_id — cannot create vendor." },
      { status: 400 }
    );
  }

  // 2. Build vendor slug from display name
  const slug = slugify(request.name);

  // 3. Insert vendor — handle 23505 duplicate (mall_id + booth_number) by
  //    fetching the existing row (same pattern as lib/posts.ts createVendor).
  const vendorInput = {
    mall_id: request.mall_id,
    display_name: request.name,
    booth_number: request.booth_number || null,
    slug,
  };

  let vendorRow: any = null;

  const { data: inserted, error: insertErr } = await auth.service
    .from("vendors")
    .insert([vendorInput])
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === "23505" && request.booth_number) {
      // Duplicate — look up existing vendor
      const { data: existing, error: existingErr } = await auth.service
        .from("vendors")
        .select("*")
        .eq("mall_id", request.mall_id)
        .eq("booth_number", request.booth_number)
        .single();
      if (existing) {
        vendorRow = existing;
      } else {
        console.error(
          "[admin/vendor-requests] duplicate but lookup failed:",
          existingErr?.message
        );
        return NextResponse.json(
          { error: "Vendor exists but could not be loaded." },
          { status: 500 }
        );
      }
    } else {
      console.error(
        "[admin/vendor-requests] insert vendor error:",
        insertErr.message,
        insertErr.code
      );
      return NextResponse.json(
        { error: `Could not create vendor: ${insertErr.message}` },
        { status: 500 }
      );
    }
  } else {
    vendorRow = inserted;
  }

  // 4. Mark request as approved
  const { error: updateErr } = await auth.service
    .from("vendor_requests")
    .update({ status: "approved" })
    .eq("id", body.requestId);

  if (updateErr) {
    // Vendor was created but status flip failed — surface as a warning,
    // but don't fail the whole operation.
    console.error(
      "[admin/vendor-requests] mark approved failed:",
      updateErr.message
    );
    return NextResponse.json({
      ok: true,
      vendor: vendorRow,
      warning: "Vendor created but request status update failed.",
    });
  }

  return NextResponse.json({ ok: true, vendor: vendorRow });
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
