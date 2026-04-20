// app/api/my-posts/[id]/route.ts
// v1.2 — PATCH endpoint used by /find/[id]/edit for autosave + status toggle
// + photo replacement. See docs/design-system-v1.2-build-spec.md §9.
//
// Accepts a partial update to a post the authenticated user owns (or that
// admin owns via isAdmin bypass). Whitelists only the v1.2 editable fields:
// title, caption, price_asking, status, image_url.
//
// Auth pattern matches the rest of /api/*: bearer token in Authorization,
// requireAuth returns { user, service } where service is a service-role
// client that bypasses RLS. Ownership is checked server-side against
// post.vendor_id joined to vendors.user_id — the browser anon client is
// read-only for ecosystem data, so the gate here is load-bearing.
//
// Ownership logic:
//   1. Read the post to get post.vendor_id.
//   2. Admin (isAdmin(user)) bypasses the vendor-match check.
//   3. Otherwise, resolve the caller's vendor row via user_id and require
//      caller.vendor.id === post.vendor_id.
//
// Rate limit: 20/60s per user, in-memory. Same in-memory shape as other
// endpoints; not process-shared, intentional for beta.
//
// Response shape:
//   200: { ok: true, post: Post }
//   400: { ok: false, error: <validation message> }
//   401/403: { ok: false, error: "Unauthorized." | "Forbidden." }
//   404: { ok: false, error: "Post not found." }
//   429: { ok: false, error: "Too many requests..." }
//   500: { ok: false, error: "Internal error." }

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";
import { isAdmin } from "@/lib/auth";

// ── Rate limit ────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 20;
const rateLog: Record<string, number[]> = {};

function rateLimited(userId: string): boolean {
  const now    = Date.now();
  const recent = (rateLog[userId] ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateLog[userId] = recent;
    return true;
  }
  recent.push(now);
  rateLog[userId] = recent;
  return false;
}

// ── Validation ────────────────────────────────────────────────────────────
// Whitelist + coerce. We do NOT trust the client to send well-formed types.

interface PatchBody {
  title?:        unknown;
  caption?:      unknown;
  price_asking?: unknown;
  status?:       unknown;
  image_url?:    unknown;
}

interface ValidUpdate {
  title?:        string;
  caption?:      string | null;
  price_asking?: number | null;
  status?:       "available" | "sold";
  image_url?:    string;
}

function validateBody(
  raw: PatchBody,
): { ok: true; updates: ValidUpdate } | { ok: false; error: string } {
  const updates: ValidUpdate = {};

  if ("title" in raw) {
    if (typeof raw.title !== "string") return { ok: false, error: "title must be a string." };
    const t = raw.title.trim();
    if (t.length < 1)   return { ok: false, error: "title cannot be empty." };
    if (t.length > 200) return { ok: false, error: "title too long." };
    updates.title = t;
  }

  if ("caption" in raw) {
    if (raw.caption === null || raw.caption === "") {
      updates.caption = null;
    } else if (typeof raw.caption === "string") {
      if (raw.caption.length > 1000) return { ok: false, error: "caption too long." };
      updates.caption = raw.caption.trim() || null;
    } else {
      return { ok: false, error: "caption must be a string or null." };
    }
  }

  if ("price_asking" in raw) {
    if (raw.price_asking === null || raw.price_asking === "") {
      updates.price_asking = null;
    } else {
      const n = typeof raw.price_asking === "number"
        ? raw.price_asking
        : typeof raw.price_asking === "string"
          ? parseFloat(raw.price_asking.replace(/[^0-9.]/g, ""))
          : NaN;
      if (!isFinite(n) || n < 0) return { ok: false, error: "price must be a positive number." };
      updates.price_asking = n;
    }
  }

  if ("status" in raw) {
    if (raw.status !== "available" && raw.status !== "sold") {
      return { ok: false, error: "status must be 'available' or 'sold'." };
    }
    updates.status = raw.status;
  }

  if ("image_url" in raw) {
    if (typeof raw.image_url !== "string" || raw.image_url.length < 1) {
      return { ok: false, error: "image_url must be a non-empty string." };
    }
    // Sanity check — must be absolute http(s). Storage URLs from Supabase
    // are; we never want image_url set to a data: URL.
    if (!/^https?:\/\//i.test(raw.image_url)) {
      return { ok: false, error: "image_url must be an absolute http(s) URL." };
    }
    updates.image_url = raw.image_url;
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: "no updatable fields in request body." };
  }

  return { ok: true, updates };
}

// ── PATCH handler ─────────────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { user, service } = auth;

  if (rateLimited(user.id)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  const postId = params.id;
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ ok: false, error: "Missing post id." }, { status: 400 });
  }

  // Parse + validate body
  let rawBody: PatchBody;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const check = validateBody(rawBody);
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  }
  const updates = check.updates;

  // Fetch the post (need vendor_id for ownership)
  const { data: post, error: postErr } = await service
    .from("posts")
    .select("id, vendor_id")
    .eq("id", postId)
    .maybeSingle();
  if (postErr) {
    console.error("[api/my-posts PATCH] fetch post failed:", postErr.message);
    return NextResponse.json({ ok: false, error: "Internal error." }, { status: 500 });
  }
  if (!post) {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }

  // Ownership: admin bypass, else vendor_id must match caller's vendor
  const admin = isAdmin(user);
  if (!admin) {
    const { data: vendor, error: vendorErr } = await service
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (vendorErr) {
      console.error("[api/my-posts PATCH] fetch vendor failed:", vendorErr.message);
      return NextResponse.json({ ok: false, error: "Internal error." }, { status: 500 });
    }
    if (!vendor || vendor.id !== post.vendor_id) {
      return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
    }
  }

  // Apply update. Service client bypasses RLS — already gated above.
  const { data: updated, error: updateErr } = await service
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .select(`
      *,
      vendor:vendors ( id, display_name, booth_number, slug, user_id, avatar_url, facebook_url ),
      mall:malls     ( id, name, city, state, slug, address )
    `)
    .single();

  if (updateErr || !updated) {
    console.error("[api/my-posts PATCH] update failed:", updateErr?.message);
    return NextResponse.json(
      { ok: false, error: updateErr?.message ?? "Update failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, post: updated });
}
