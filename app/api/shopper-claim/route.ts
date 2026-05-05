// app/api/shopper-claim/route.ts
// R1 Arc 3 — server endpoint for the silent localStorage→DB claim migration
// per design record D8 + D13 (docs/r1-shopper-accounts-design.md).
//
// POST { handle, savedPostIds?, bookmarkedVendorIds? }
//   → { ok: true, shopper: { id, handle, created_at } }
//
// Auth model: requireAuth — any authenticated user can claim a shopper
// account. Service role does the writes so RLS stays strict (shoppers
// INSERT has no policy at MVP — service role only). Idempotent: if the
// authed user already has a shoppers row, returns it unchanged and runs
// the bulk-migrate against new IDs (so re-running the claim from a
// device with NEW localStorage saves picks them up).
//
// Handle uniqueness is enforced at the DB layer (UNIQUE constraint
// `shoppers.handle`). The cheap pre-check + race-protected insert path
// covers both happy + collision cases. 23505 → 409 with
// `code: "HANDLE_TAKEN"` so the UI can surface a clean retry prompt.
//
// Saves + booth bookmarks are bulk-inserted with ignoreDuplicates: true
// (supabase-js v2 sugar for ON CONFLICT DO NOTHING). Stale localStorage
// IDs that reference deleted posts/vendors are pre-filtered via SELECT
// so a single bad ID doesn't reject the whole batch (FK violations
// would fail the upsert wholesale otherwise).
//
// Failure mode: silent + idempotent per D13. If the saves bulk-insert
// fails after the shopper row landed, we still return ok:true. The
// shopper can re-trigger the claim flow or the next save action will
// correct (idempotent insert again).

import { NextResponse } from "next/server";
import { requireAuth }  from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

interface ShopperClaimBody {
  handle:               string;
  savedPostIds?:        string[];
  bookmarkedVendorIds?: string[];
}

const HANDLE_RE     = /^[a-z0-9-]{3,32}$/;
const MAX_SAVES     = 500;
const MAX_BOOKMARKS = 100;
// Loose UUID v4-ish — enough to reject obviously-bad inputs cheaply
// without locking us into a specific UUID version.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: Partial<ShopperClaimBody>;
  try {
    body = (await req.json()) as Partial<ShopperClaimBody>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const handle = String(body.handle ?? "").trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) {
    return NextResponse.json(
      { error: "Handle must be 3–32 chars, lowercase letters/numbers/hyphens only." },
      { status: 400 },
    );
  }

  const savedPostIds = Array.isArray(body.savedPostIds)
    ? body.savedPostIds.filter(id => typeof id === "string" && UUID_RE.test(id)).slice(0, MAX_SAVES)
    : [];
  const bookmarkedVendorIds = Array.isArray(body.bookmarkedVendorIds)
    ? body.bookmarkedVendorIds.filter(id => typeof id === "string" && UUID_RE.test(id)).slice(0, MAX_BOOKMARKS)
    : [];

  // ── Step 1: existing shopper row? ────────────────────────────────────────
  const { data: existing, error: fetchErr } = await auth.service
    .from("shoppers")
    .select("id, handle, created_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (fetchErr) {
    console.error("[shopper-claim] fetch existing:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  let shopperId: string;
  let shopperHandle: string;
  let createdAt: string;

  if (existing) {
    shopperId     = existing.id;
    shopperHandle = existing.handle;
    createdAt     = existing.created_at;
  } else {
    // ── Step 2: handle pre-check (cheap; race-protected by DB UNIQUE) ─────
    const { data: handleTaken, error: takenErr } = await auth.service
      .from("shoppers")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();
    if (takenErr) {
      console.error("[shopper-claim] handle check:", takenErr.message);
      return NextResponse.json({ error: takenErr.message }, { status: 500 });
    }
    if (handleTaken) {
      return NextResponse.json(
        { error: "That handle is taken — please pick another.", code: "HANDLE_TAKEN" },
        { status: 409 },
      );
    }

    // ── Step 3: insert shoppers row ───────────────────────────────────────
    const { data: inserted, error: insertErr } = await auth.service
      .from("shoppers")
      .insert({ user_id: auth.user.id, handle })
      .select("id, handle, created_at")
      .single();
    if (insertErr) {
      // 23505 = UNIQUE violation. Could be either user_id (race with a
      // concurrent claim from same user) or handle (race after the
      // pre-check). Distinguish via constraint name; if either, refetch
      // and treat as idempotent re-claim.
      if (insertErr.code === "23505") {
        const { data: recheck } = await auth.service
          .from("shoppers")
          .select("id, handle, created_at")
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (recheck) {
          shopperId     = recheck.id;
          shopperHandle = recheck.handle;
          createdAt     = recheck.created_at;
        } else {
          return NextResponse.json(
            { error: "That handle is taken — please pick another.", code: "HANDLE_TAKEN" },
            { status: 409 },
          );
        }
      } else {
        console.error("[shopper-claim] insert:", insertErr.message, insertErr.code);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    } else if (!inserted) {
      return NextResponse.json({ error: "Insert returned no row." }, { status: 500 });
    } else {
      shopperId     = inserted.id;
      shopperHandle = inserted.handle;
      createdAt     = inserted.created_at;
    }
  }

  // ── Step 4: bulk-migrate saves (silently filters stale FK-violating IDs) ─
  if (savedPostIds.length > 0) {
    const { data: validPosts, error: validErr } = await auth.service
      .from("posts")
      .select("id")
      .in("id", savedPostIds);
    if (validErr) {
      console.error("[shopper-claim] post validation:", validErr.message);
    } else if (validPosts && validPosts.length > 0) {
      const validIdSet = new Set(validPosts.map(r => r.id as string));
      const rows = savedPostIds
        .filter(id => validIdSet.has(id))
        .map(postId => ({ shopper_id: shopperId!, post_id: postId }));
      if (rows.length > 0) {
        const { error: savesErr } = await auth.service
          .from("shopper_saves")
          .upsert(rows, { onConflict: "shopper_id,post_id", ignoreDuplicates: true });
        if (savesErr) {
          // Silent per D13 — log + continue.
          console.error("[shopper-claim] saves migration:", savesErr.message);
        }
      }
    }
  }

  // ── Step 5: bulk-migrate booth bookmarks ─────────────────────────────────
  if (bookmarkedVendorIds.length > 0) {
    const { data: validVendors, error: validErr } = await auth.service
      .from("vendors")
      .select("id")
      .in("id", bookmarkedVendorIds);
    if (validErr) {
      console.error("[shopper-claim] vendor validation:", validErr.message);
    } else if (validVendors && validVendors.length > 0) {
      const validIdSet = new Set(validVendors.map(r => r.id as string));
      const rows = bookmarkedVendorIds
        .filter(id => validIdSet.has(id))
        .map(vendorId => ({ shopper_id: shopperId!, vendor_id: vendorId }));
      if (rows.length > 0) {
        const { error: bmErr } = await auth.service
          .from("shopper_booth_bookmarks")
          .upsert(rows, { onConflict: "shopper_id,vendor_id", ignoreDuplicates: true });
        if (bmErr) {
          console.error("[shopper-claim] bookmarks migration:", bmErr.message);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    shopper: {
      id:         shopperId!,
      handle:     shopperHandle!,
      created_at: createdAt!,
    },
  });
}
