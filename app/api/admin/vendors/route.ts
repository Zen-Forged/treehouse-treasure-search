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
import { requireAdmin, type AuthResult } from "@/lib/adminAuth";
import { slugify } from "@/lib/posts";
import { recordEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

// Authenticated branch of AuthResult — handlers below skip the not-ok check
// because the dispatcher already gated on it.
type AuthOk = Extract<AuthResult, { ok: true }>;

// ─── GET ─────────────────────────────────────────────────────────────────────
// Arc 4 Arc 1.1 — feeds the new admin Vendors tab. Returns every vendors row
// with mall join + posts_count + linked_user_email + per-row diagnosis. The
// diagnosis payload runs the diagnose-request-equivalent collision check
// inline for unlinked rows (D5 — server-side fanout, no on-demand button).
//
// N+1 footprint: O(unlinked) vendor_requests queries + 1 auth.users.listUsers
// page. At ~50 vendors with ~30 unlinked this is ~31 sequential round trips
// — acceptable for current scale per design record §Component contracts.
// Past 200 vendors, refactor to a single bulk-fetch with composite-key match
// client-side.

type DiagnosisRequest = {
  id:         string;
  name:       string;
  email:      string;
  status:     "pending" | "approved" | "denied";
  created_at: string;
};

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // ── 1. Fetch all vendors + mall + posts count ──
  const { data: vendors, error: vendorsErr } = await auth.service
    .from("vendors")
    .select(`
      id, display_name, slug, booth_number, mall_id, user_id,
      hero_image_url, created_at,
      mall:malls(id, name, slug, city, state, address, status),
      posts:posts(count)
    `)
    .order("created_at", { ascending: false });

  if (vendorsErr) {
    console.error("[admin/vendors GET] fetch:", vendorsErr.message);
    return NextResponse.json({ error: vendorsErr.message }, { status: 500 });
  }

  // ── 2. Single auth.users page → id-to-email Map ──
  // listUsers is paginated; perPage=1000 covers current scale in one round
  // trip. Mirrors diagnose-request:170-195 + relink at line ~365.
  const emailById = new Map<string, string>();
  const { data: usersPage, error: usersErr } = await auth.service.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersErr) {
    console.error("[admin/vendors GET] auth.users lookup:", usersErr.message);
    // Continue — emails will be null on linked rows but the tab still works.
  } else {
    for (const u of usersPage.users) {
      if (u.email) emailById.set(u.id, u.email);
    }
  }

  // ── 3. Per-row enrichment: linked_user_email + diagnosis ──
  const enriched = await Promise.all(
    (vendors ?? []).map(async (v) => {
      const postsCount =
        Array.isArray(v.posts) && v.posts[0]
          ? Number((v.posts[0] as { count: number }).count)
          : 0;

      const linked_user_email =
        v.user_id !== null ? emailById.get(v.user_id) ?? null : null;

      // Diagnosis only runs for unlinked rows. Linked rows get null.
      let diagnosis: { matchingRequest: DiagnosisRequest | null; isCollision: boolean } | null = null;
      if (v.user_id === null) {
        // PostgREST quirk: `.eq("col", null)` does not match null rows; null
        // requires `.is("col", null)`. Branch the query accordingly.
        let q = auth.service
          .from("vendor_requests")
          .select("id, name, email, status, created_at")
          .eq("mall_id", v.mall_id)
          .in("status", ["pending", "approved"])
          .order("created_at", { ascending: false })
          .limit(1);
        q = v.booth_number === null
          ? q.is("booth_number", null)
          : q.eq("booth_number", v.booth_number);
        const { data: requests, error: reqErr } = await q;

        if (reqErr) {
          console.error("[admin/vendors GET] diagnose lookup:", reqErr.message);
          diagnosis = { matchingRequest: null, isCollision: false };
        } else {
          const matchingRequest = requests && requests[0]
            ? (requests[0] as DiagnosisRequest)
            : null;
          const isCollision =
            matchingRequest !== null &&
            matchingRequest.name.trim() !== v.display_name.trim();
          diagnosis = { matchingRequest, isCollision };
        }
      }

      // Strip the raw `posts` array — return the count only on the row shape.
      const { posts: _posts, ...rest } = v as typeof v & { posts?: unknown };
      return {
        ...rest,
        posts_count: postsCount,
        linked_user_email,
        diagnosis,
      };
    }),
  );

  // ── 4. Counts for chip badges ──
  // `problematic` = needs admin action. Distinct from raw `unlinked` because
  // a successfully-relinked row whose vendor_request.email has no auth user
  // yet stays user_id=null (session-123 auto-claim attaches on first sign-in)
  // — that's expected pending state, NOT problematic. Predicate must match
  // client-side isProblematic() in VendorsTab.tsx.
  const counts = {
    total:     enriched.length,
    linked:    enriched.filter((v) => v.user_id !== null).length,
    unlinked:  enriched.filter((v) => v.user_id === null).length,
    collision: enriched.filter((v) => v.diagnosis?.isCollision === true).length,
    problematic: enriched.filter((v) =>
      v.user_id === null &&
      (v.diagnosis?.isCollision === true || v.diagnosis?.matchingRequest === null)
    ).length,
  };

  return NextResponse.json({ ok: true, vendors: enriched, counts });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
// Three actions, discriminated by the `action` field on the body:
//
//   • (none)         → Edit: display_name + booth_number + mall_id (session 74)
//   • "force-unlink" → Arc 4 D13: clear vendors.user_id, leave row in place
//   • "relink"       → Arc 4 D14: assign user_id from a vendor_request, sync
//                       display_name + slug from request, auto-approve if pending
//
// Edit auto-derives slug from display_name. All three catch 23505 (unique-
// constraint violation, typically the (mall_id, booth_number) pair OR slug
// uniqueness) and return a clean 409 with code BOOTH_CONFLICT so the client
// can surface a conflict pill rather than a 500.
//
// Implementation-time deviations from the design record (locked at session 124)
// surfaced here per feedback_design_record_as_execution_spec.md:
//   D14 spec assumed `vendor_requests.user_id` and `vendor_requests.approved_at`
//   columns exist; neither does (verified against migrations 001 + 005). User_id
//   is derived via auth.users lookup by request.email (matches the pattern at
//   diagnose-request:170-195). The auto-approve step on a pending request only
//   updates `status`; approved_at is captured by the R3 event timestamp.

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: {
    vendorId?:        string;
    action?:          "force-unlink" | "relink";
    vendorRequestId?: string;
    display_name?:    string;
    booth_number?:    string | null;
    mall_id?:         string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const vendorId = body.vendorId?.trim();
  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required." }, { status: 400 });
  }

  // ── Action dispatch ──
  if (body.action === "force-unlink") {
    return handleForceUnlink(auth, vendorId);
  }
  if (body.action === "relink") {
    const requestId = body.vendorRequestId?.trim();
    if (!requestId) {
      return NextResponse.json(
        { error: "vendorRequestId is required for relink." },
        { status: 400 },
      );
    }
    return handleRelink(auth, vendorId, requestId);
  }

  // ── No action → Edit (existing session-74 path) ──
  const displayName = body.display_name?.trim();
  const mallId      = body.mall_id?.trim();
  const boothNumber =
    typeof body.booth_number === "string"
      ? body.booth_number.trim() || null
      : null;

  if (!displayName) return NextResponse.json({ error: "display_name is required." }, { status: 400 });
  if (!mallId)      return NextResponse.json({ error: "mall_id is required." },      { status: 400 });

  // Re-derive slug from display_name (D2). Bookmarks/finds reference
  // vendor_id, not slug, so URL change is the only consequence.
  const slug = slugify(displayName);

  const { data, error } = await auth.service
    .from("vendors")
    .update({
      display_name: displayName,
      booth_number: boothNumber,
      mall_id:      mallId,
      slug,
    })
    .eq("id", vendorId)
    .select("*, mall:malls(id, name, slug, city, state, address, status)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error:
            "A booth with that number already exists at this location. Pick a different number, or change the location.",
          code: "BOOTH_CONFLICT",
        },
        { status: 409 },
      );
    }
    console.error("[admin/vendors PATCH] update:", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }

  console.log("[admin/vendors PATCH] updated", {
    vendorId,
    display_name: displayName,
    mall_id:      mallId,
    booth_number: boothNumber,
  });

  await recordEvent("booth_edited_by_admin", {
    user_id: auth.user.id,
    payload: {
      vendor_id:    vendorId,
      vendor_slug:  data.slug,
      display_name: displayName,
      mall_id:      mallId,
      booth_number: boothNumber,
    },
  });

  return NextResponse.json({ ok: true, vendor: data });
}

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

  // Arc 4 D12 — `?force=1` query flag bypasses the user_id != null safety
  // gate. Set by the new admin Vendors tab `<ForceDeleteConfirm>` modal
  // (which always runs the typed-name confirmation step regardless of
  // claim state). The /shelves Trash bubble continues to call without
  // the flag and inherits the existing safety gate.
  const force = new URL(req.url).searchParams.get("force") === "1";

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

  // ── 2. Safety gate — refuse to delete a claimed booth (unless ?force=1) ──
  if (!force && vendor.user_id !== null) {
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
    force,
  });

  // Arc 4 D12 — when called with ?force=1, fire the new event with the
  // expanded audit payload (had_user_id + prev_user_id) regardless of
  // whether vendor.user_id was null. The flag captures admin intent
  // ("explicit force-delete from Vendors tab"), not just outcome.
  if (force) {
    await recordEvent("vendor_force_deleted_by_admin", {
      user_id: auth.user.id,
      payload: {
        vendor_id:          vendorId,
        prev_display_name:  vendor.display_name,
        had_user_id:        vendor.user_id !== null,
        prev_user_id:       vendor.user_id ?? null,
        posts_deleted:      posts?.length ?? 0,
        images_deleted:     imagesDeleted,
      },
    });
  } else {
    await recordEvent("booth_deleted_by_admin", {
      user_id: auth.user.id,
      payload: {
        vendor_id:      vendorId,
        display_name:   vendor.display_name,
        posts_deleted:  posts?.length ?? 0,
        images_deleted: imagesDeleted,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    vendorId,
    postsDeleted: posts?.length ?? 0,
    imagesDeleted,
  });
}

// ─── Arc 4 D13 — force-unlink ────────────────────────────────────────────────
// Clear vendors.user_id on a claimed booth without deleting the row. The auth
// user keeps their session but loses /my-shelf access (lands on <NoBooth>);
// session-123 auto-claim will re-claim on their next sign-in if a matching
// approved vendor_request still exists. Reversible by design — that's why
// the modal has no type-to-confirm step (D13).
async function handleForceUnlink(auth: AuthOk, vendorId: string) {
  const { data: vendor, error: fetchErr } = await auth.service
    .from("vendors")
    .select("id, display_name, slug, user_id")
    .eq("id", vendorId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/vendors PATCH force-unlink] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }
  if (vendor.user_id === null) {
    return NextResponse.json(
      { error: "Booth is already unlinked.", code: "ALREADY_UNLINKED" },
      { status: 409 },
    );
  }

  const prevUserId = vendor.user_id;

  const { data: updated, error: updateErr } = await auth.service
    .from("vendors")
    .update({ user_id: null })
    .eq("id", vendorId)
    .select("*, mall:malls(id, name, slug, city, state, address, status)")
    .single();

  if (updateErr) {
    console.error("[admin/vendors PATCH force-unlink] update:", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  console.log("[admin/vendors PATCH force-unlink] unlinked", {
    vendorId,
    display_name: vendor.display_name,
    prev_user_id: prevUserId,
  });

  await recordEvent("vendor_force_unlinked_by_admin", {
    user_id: auth.user.id,
    payload: {
      vendor_id:    vendorId,
      vendor_slug:  vendor.slug,
      display_name: vendor.display_name,
      prev_user_id: prevUserId,
    },
  });

  return NextResponse.json({ ok: true, vendor: updated });
}

// ─── Arc 4 D14 — relink ──────────────────────────────────────────────────────
// Production-clean replacement for SQL paste: assign the vendors row to a
// matching vendor_request (same mall_id + booth_number, status pending or
// approved) and sync display_name + slug. user_id is derived via auth.users
// lookup by request.email — vendor_requests itself has no user_id column.
// If status was 'pending', auto-approves the request as a side effect.
async function handleRelink(auth: AuthOk, vendorId: string, requestId: string) {
  // ── 1. Fetch vendors row ──
  const { data: vendor, error: vendorErr } = await auth.service
    .from("vendors")
    .select("id, display_name, slug, user_id, mall_id, booth_number")
    .eq("id", vendorId)
    .maybeSingle();
  if (vendorErr) {
    return NextResponse.json({ error: vendorErr.message }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }

  // ── 2. Fetch vendor_request ──
  const { data: request, error: requestErr } = await auth.service
    .from("vendor_requests")
    .select("id, name, first_name, last_name, booth_name, email, mall_id, booth_number, status")
    .eq("id", requestId)
    .maybeSingle();
  if (requestErr) {
    return NextResponse.json({ error: requestErr.message }, { status: 500 });
  }
  if (!request) {
    return NextResponse.json({ error: "Vendor request not found." }, { status: 404 });
  }

  // ── 3. Validation: status + (mall_id, booth_number) match ──
  if (request.status !== "pending" && request.status !== "approved") {
    return NextResponse.json(
      { error: `Request status is "${request.status}". Only pending or approved requests can be relinked.` },
      { status: 400 },
    );
  }
  if (request.mall_id !== vendor.mall_id || (request.booth_number ?? null) !== (vendor.booth_number ?? null)) {
    return NextResponse.json(
      {
        error: "Request mall + booth number do not match this vendor row. Pick a different request or edit the booth first.",
        code:  "BOOTH_MISMATCH",
      },
      { status: 400 },
    );
  }

  // ── 4. Resolve target display_name (matches approve-flow priority order) ──
  const firstName  = (request.first_name as string | null)?.trim() ?? "";
  const lastName   = (request.last_name  as string | null)?.trim() ?? "";
  const boothName  = (request.booth_name as string | null)?.trim() ?? "";
  const legacyName = (request.name       as string | null)?.trim() ?? "";
  const newDisplayName =
    boothName ||
    (firstName && lastName ? `${firstName} ${lastName}` : "") ||
    legacyName;

  if (!newDisplayName) {
    return NextResponse.json(
      { error: "Request has no usable name (booth_name + first/last + name all empty)." },
      { status: 400 },
    );
  }

  // ── 5. Resolve user_id via auth.users lookup by email ──
  // Mirrors the diagnose-request:170-195 pattern. If no auth user exists for
  // the request email yet, leave user_id null and let session-123 auto-claim
  // pick up linkage on their first sign-in.
  let newUserId: string | null = null;
  if (request.email) {
    const { data: usersPage, error: usersErr } = await auth.service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersErr) {
      console.error("[admin/vendors PATCH relink] auth.users lookup:", usersErr.message);
    } else {
      const targetEmail = request.email.trim().toLowerCase();
      const match = usersPage.users.find(
        (u) => (u.email ?? "").trim().toLowerCase() === targetEmail,
      );
      newUserId = match?.id ?? null;
    }
  }

  // ── 6. UPDATE vendors row ──
  const newSlug = slugify(newDisplayName);
  const { data: updated, error: updateErr } = await auth.service
    .from("vendors")
    .update({
      user_id:      newUserId,
      display_name: newDisplayName,
      slug:         newSlug,
    })
    .eq("id", vendorId)
    .select("*, mall:malls(id, name, slug, city, state, address, status)")
    .single();

  if (updateErr) {
    if (updateErr.code === "23505") {
      return NextResponse.json(
        {
          error: "Slug or booth-number conflict on relink. Edit the conflicting booth first.",
          code:  "BOOTH_CONFLICT",
        },
        { status: 409 },
      );
    }
    console.error("[admin/vendors PATCH relink] update:", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // ── 7. Auto-approve pending request as side effect ──
  // Design record D14 step 4. vendor_requests has no approved_at column
  // (verified migration 001) so only status updates; R3 event timestamp
  // captures the time.
  if (request.status === "pending") {
    const { error: approveErr } = await auth.service
      .from("vendor_requests")
      .update({ status: "approved" })
      .eq("id", requestId);
    if (approveErr) {
      console.error("[admin/vendors PATCH relink] auto-approve request:", approveErr.message);
      // Vendors row already updated; don't fail the request — just log.
    }
  }

  console.log("[admin/vendors PATCH relink] relinked", {
    vendorId,
    requestId,
    prev_display_name: vendor.display_name,
    new_display_name:  newDisplayName,
    prev_user_id:      vendor.user_id,
    new_user_id:       newUserId,
  });

  await recordEvent("vendor_relinked_by_admin", {
    user_id: auth.user.id,
    payload: {
      vendor_id:         vendorId,
      vendor_request_id: requestId,
      prev_display_name: vendor.display_name,
      new_display_name:  newDisplayName,
      prev_user_id:      vendor.user_id,
      new_user_id:       newUserId,
      pending_promoted:  request.status === "pending",
    },
  });

  return NextResponse.json({ ok: true, vendor: updated });
}
