// app/api/admin/vendors/route.ts
// Admin-gated endpoint for deleting a vendor (booth) and its dependent data.
//
// Session 45 (2026-04-22) — NEW. Added alongside the /shelves admin delete
// affordance so admins can remove unclaimed booths without opening Supabase.
// Follows the same shape as /api/admin/posts DELETE: requireAdmin gate first,
// then fetch dependents, then storage cleanup, then row deletion.
//
// Safety gate: refuses to delete a vendor whose `user_id` is NOT null.
// Claimed booths have a live vendor on the auth.users side; deleting the
// vendor row would leave that auth user permanently stranded on <NoBooth>.
// For those cases admin still uses Supabase. This keeps the blast radius
// of the typed-confirm UI on /shelves bounded to pre-seeded (Flow 1) and
// unclaimed booths — which is exactly the mall-walk pre-seed workflow
// session 44 opened up.
//
// Cleanup order (all via service role, RLS-bypassing):
//   1. Fetch vendor — confirm it exists, read user_id + hero_image_url
//   2. Safety gate: 409 if user_id != null
//   3. Fetch all posts for this vendor — collect image_url paths
//   4. Storage: remove all post-image blobs (fire-and-forget on miss)
//   5. Storage: remove vendor-hero/{vendorId}.jpg (fire-and-forget on miss)
//   6. Delete posts rows (explicit, not relying on FK cascade)
//   7. Delete vendor row
//
// Returns { ok, postsDeleted, imagesDeleted } for optimistic UI updates.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // Parse body defensively — malformed JSON should return a clean 400.
  let body: { vendorId?: string };
  try {
    body = (await req.json()) as { vendorId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const vendorId = body.vendorId?.trim();
  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required." }, { status: 400 });
  }

  // ── 1. Fetch vendor ──
  const { data: vendor, error: fetchErr } = await auth.service
    .from("vendors")
    .select("id, display_name, user_id, hero_image_url")
    .eq("id", vendorId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/vendors DELETE] fetch vendor:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }

  // ── 2. Safety gate — refuse to delete a claimed booth ──
  if (vendor.user_id !== null) {
    return NextResponse.json(
      {
        error:
          "This booth is claimed by a vendor. Unlink the vendor in Supabase before deleting.",
        code: "CLAIMED_VENDOR",
      },
      { status: 409 },
    );
  }

  // ── 3. Fetch posts + collect storage paths ──
  const { data: posts, error: postsErr } = await auth.service
    .from("posts")
    .select("id, image_url")
    .eq("vendor_id", vendorId);

  if (postsErr) {
    console.error("[admin/vendors DELETE] fetch posts:", postsErr.message);
    return NextResponse.json({ error: postsErr.message }, { status: 500 });
  }

  const storagePaths: string[] = [];
  for (const post of posts ?? []) {
    if (post.image_url) {
      const match = post.image_url.match(/post-images\/(.+)$/);
      if (match?.[1]) {
        // Strip query string (the uploadVendorHeroImage cache-bust param
        // would never be on post images, but be defensive anyway).
        const path = decodeURIComponent(match[1]).split("?")[0];
        storagePaths.push(path);
      }
    }
  }

  // ── 4. Storage: remove post images ──
  let imagesDeleted = 0;
  if (storagePaths.length > 0) {
    const { data: removed, error: storageErr } = await auth.service.storage
      .from("post-images")
      .remove(storagePaths);
    if (storageErr) {
      // Log but continue — storage miss shouldn't block the row delete.
      // Orphaned blobs are preferable to a half-completed delete.
      console.warn(
        "[admin/vendors DELETE] post-image storage remove:",
        storageErr.message,
      );
    }
    imagesDeleted = removed?.length ?? 0;
  }

  // ── 5. Storage: remove hero image if present ──
  // Always attempt regardless of whether vendor.hero_image_url is set —
  // a row-level null does not guarantee the file is absent (session-44
  // hero upload could race ahead of the vendors-row update in theory).
  const heroPath = `vendor-hero/${vendorId}.jpg`;
  const { data: heroRemoved, error: heroErr } = await auth.service.storage
    .from("post-images")
    .remove([heroPath]);
  if (heroErr) {
    console.warn(
      "[admin/vendors DELETE] hero storage remove:",
      heroErr.message,
    );
  }
  imagesDeleted += heroRemoved?.length ?? 0;

  // ── 6. Delete posts rows ──
  if ((posts ?? []).length > 0) {
    const { error: postDeleteErr } = await auth.service
      .from("posts")
      .delete()
      .eq("vendor_id", vendorId);
    if (postDeleteErr) {
      console.error(
        "[admin/vendors DELETE] delete posts:",
        postDeleteErr.message,
      );
      return NextResponse.json({ error: postDeleteErr.message }, { status: 500 });
    }
  }

  // ── 7. Delete vendor row ──
  const { error: vendorDeleteErr } = await auth.service
    .from("vendors")
    .delete()
    .eq("id", vendorId);
  if (vendorDeleteErr) {
    console.error(
      "[admin/vendors DELETE] delete vendor:",
      vendorDeleteErr.message,
    );
    return NextResponse.json({ error: vendorDeleteErr.message }, { status: 500 });
  }

  console.log("[admin/vendors DELETE] deleted", {
    vendorId,
    display_name: vendor.display_name,
    postsDeleted: posts?.length ?? 0,
    imagesDeleted,
  });

  return NextResponse.json({
    ok: true,
    vendorId,
    postsDeleted: posts?.length ?? 0,
    imagesDeleted,
  });
}
