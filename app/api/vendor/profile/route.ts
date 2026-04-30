// app/api/vendor/profile/route.ts
// Vendor self-edit endpoint (Wave 1 Task 4, session 91).
//
// PATCH { vendorId, display_name } → { ok: true, vendor }
//
// Auth model: requireAuth + ownership check (vendors.user_id === auth.user.id).
// Distinct from /api/admin/vendors PATCH which is admin-only and can edit any
// vendor's display_name + booth_number + mall_id. This route is the vendor's
// path to edit ONLY their own display_name (booth_number stays the dedup key
// + mall reassignment stays admin-only). Slug is auto-derived from
// display_name to keep URLs in sync.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";
import { slugify } from "@/lib/posts";
import { recordEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: { vendorId?: string; display_name?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const vendorId    = body.vendorId?.trim();
  const displayName = body.display_name?.trim();

  if (!vendorId)    return NextResponse.json({ error: "vendorId is required." },     { status: 400 });
  if (!displayName) return NextResponse.json({ error: "display_name is required." }, { status: 400 });

  // Ownership check — verify the requesting user owns this vendor row.
  const { data: existing, error: fetchErr } = await auth.service
    .from("vendors")
    .select("id, user_id")
    .eq("id", vendorId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[vendor/profile PATCH] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }
  if (existing.user_id !== auth.user.id) {
    return NextResponse.json(
      { error: "You can only edit your own booth." },
      { status: 403 },
    );
  }

  // Re-derive slug from display_name (matches /api/admin/vendors PATCH D2).
  // Bookmarks/finds reference vendor_id, not slug — URL change is the only
  // consequence.
  const slug = slugify(displayName);

  const { data, error } = await auth.service
    .from("vendors")
    .update({ display_name: displayName, slug })
    .eq("id", vendorId)
    .select("*, mall:malls(id, name, slug, city, state, address, status)")
    .single();

  if (error) {
    console.error("[vendor/profile PATCH] update:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[vendor/profile PATCH] updated", {
    vendorId,
    user_id:      auth.user.id,
    display_name: displayName,
  });

  await recordEvent("vendor_profile_edited", {
    user_id: auth.user.id,
    payload: {
      vendor_id:    vendorId,
      vendor_slug:  data.slug,
      display_name: displayName,
    },
  });

  return NextResponse.json({ ok: true, vendor: data });
}
