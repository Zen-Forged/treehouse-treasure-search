// app/api/vendor/profile/route.ts
// Vendor self-edit endpoint (Wave 1 Task 4, session 91).
//
// PATCH { vendorId, display_name?, bio?, facebook_url?, instagram_url?,
//         directions_text? }                          → { ok: true, vendor }
//
// Auth model: requireAuth + ownership check (vendors.user_id === auth.user.id)
// with admin bypass (Arc 7.4.5, session 148). Distinct from /api/admin/vendors
// PATCH which is admin-only and can edit any vendor's display_name +
// booth_number + mall_id. This route is the vendor's path to edit ONLY their
// own profile fields (booth_number stays the dedup key + mall reassignment
// stays admin-only). Admin impersonating a vendor via /my-shelf?vendor=<id>
// uses this same endpoint via the ownership bypass — keeps vendor + admin
// affordances on /my-shelf at parity. Slug is auto-derived from
// display_name to keep URLs in sync (only when display_name changes).
//
// Session 186 — extended with 4 vendor profile enrichment fields per
// `docs/vendor-profile-enrichment-design.md` D7+D8+D10. All four new fields
// are optional in the payload (a partial-update PATCH); each is independently
// nullable. Lenient URL validation (any string starting with http:// or
// https://) per D8 — server doesn't enforce host allowlist.
//
// `vendor_profile_enriched` fires server-side per D12 when one or more of
// the 5 enrichment fields (avatar_url is handled by /api/vendor-avatar)
// flip from NULL to non-empty for the first time. Payload carries
// `fields_filled: string[]` listing which fields transitioned. Avatar
// uploads fire `vendor_avatar_uploaded` from the avatar route directly +
// also re-fire `vendor_profile_enriched` if it's the avatar's first set
// (handled atomically there since the avatar route updates avatar_url).

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";
import { isAdmin } from "@/lib/auth";
import { slugify } from "@/lib/posts";
import { recordEvent } from "@/lib/events";
import { normalizeFacebookUrl, normalizeInstagramUrl } from "@/lib/socialUrls";

export const dynamic = "force-dynamic";

const BIO_MAX_LEN             = 280;  // D7 — UI counter mirrors this
// Session 191 — D10 reversed (`feedback_surface_locked_design_reversals`).
// Session 186 D10 said "directions are short by nature; cap is defensive
// not user-facing" → 500-char server cap with no UI counter. Session 191
// EditBoothSheet revisit (docs/edit-booth-sheet-revisit-design.md D10)
// reverses: vendor-facing UI counter at 280 matches bio's pattern + the
// Twitter mental model. Server cap moves 500 → 280 to mirror.
const DIRECTIONS_TEXT_MAX_LEN = 280;  // D10 — vendor-facing cap; UI counter mirrors this
const URL_MAX_LEN              = 500;  // length cap on raw input before normalization

// Normalizes incoming optional string fields. Three intents collapse to:
//   - undefined  → field absent from payload → don't touch column
//   - ""         → caller cleared the field → write null
//   - "  text  " → trimmed + written
function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: {
    vendorId?:        string;
    display_name?:    string;
    bio?:             string | null;
    facebook_url?:    string | null;
    instagram_url?:   string | null;
    directions_text?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const vendorId       = body.vendorId?.trim();
  const displayName    = body.display_name?.trim();
  const bio            = normalizeOptionalString(body.bio);
  const facebookInput  = normalizeOptionalString(body.facebook_url);
  const instagramInput = normalizeOptionalString(body.instagram_url);
  const directionsText = normalizeOptionalString(body.directions_text);

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required." }, { status: 400 });
  }

  // Validate field shapes BEFORE the ownership round-trip so callers get
  // fast 400s on bad input.
  if (bio !== undefined && bio !== null && bio.length > BIO_MAX_LEN) {
    return NextResponse.json(
      { error: `bio must be ${BIO_MAX_LEN} characters or fewer.` },
      { status: 400 },
    );
  }
  if (directionsText !== undefined && directionsText !== null && directionsText.length > DIRECTIONS_TEXT_MAX_LEN) {
    return NextResponse.json(
      { error: `directions_text must be ${DIRECTIONS_TEXT_MAX_LEN} characters or fewer.` },
      { status: 400 },
    );
  }

  // Session 186 URL UX refinement — accept any shape the vendor pastes
  // (bare handle / @handle / host+path / full URL / share-page URL) and
  // normalize to canonical form via lib/socialUrls helpers. The client
  // also normalizes pre-PATCH; the server is defensive against admin
  // tools / direct API hits / future ingest paths sending raw input.
  let facebookUrl: string | null | undefined = facebookInput;
  if (facebookInput !== undefined && facebookInput !== null) {
    if (facebookInput.length > URL_MAX_LEN) {
      return NextResponse.json(
        { error: `facebook_url must be ${URL_MAX_LEN} characters or fewer.` },
        { status: 400 },
      );
    }
    const normalized = normalizeFacebookUrl(facebookInput);
    if (normalized === null) {
      return NextResponse.json(
        { error: "facebook_url isn't recognized. Use a Facebook URL or handle (e.g. facebook.com/yourbooth)." },
        { status: 400 },
      );
    }
    facebookUrl = normalized;
  }
  let instagramUrl: string | null | undefined = instagramInput;
  if (instagramInput !== undefined && instagramInput !== null) {
    if (instagramInput.length > URL_MAX_LEN) {
      return NextResponse.json(
        { error: `instagram_url must be ${URL_MAX_LEN} characters or fewer.` },
        { status: 400 },
      );
    }
    const normalized = normalizeInstagramUrl(instagramInput);
    if (normalized === null) {
      return NextResponse.json(
        { error: "instagram_url isn't recognized. Use a handle or Instagram URL (e.g. @yourbooth, instagram.com/yourbooth)." },
        { status: 400 },
      );
    }
    instagramUrl = normalized;
  }

  // Must have AT LEAST one mutating field. Empty PATCH is a no-op error
  // (callers shouldn't hit this; defensive).
  const hasDisplayNameChange  = displayName !== undefined && displayName.length > 0;
  const hasEnrichmentChange   =
    bio !== undefined ||
    facebookUrl !== undefined ||
    instagramUrl !== undefined ||
    directionsText !== undefined;
  if (!hasDisplayNameChange && !hasEnrichmentChange) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  // Ownership check — fetch existing row for ownership gate AND for
  // null→non-null detection on the enrichment fields.
  const { data: existing, error: fetchErr } = await auth.service
    .from("vendors")
    .select("id, user_id, slug, avatar_url, bio, facebook_url, instagram_url, directions_text")
    .eq("id", vendorId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[vendor/profile PATCH] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }
  const actingAsAdmin = isAdmin(auth.user) && existing.user_id !== auth.user.id;
  if (existing.user_id !== auth.user.id && !actingAsAdmin) {
    return NextResponse.json(
      { error: "You can only edit your own booth." },
      { status: 403 },
    );
  }

  // Assemble UPDATE payload — only fields that were actually present in the
  // request body get written. Undefined means "don't touch."
  type VendorPatch = {
    display_name?:    string;
    slug?:            string;
    bio?:             string | null;
    facebook_url?:    string | null;
    instagram_url?:   string | null;
    directions_text?: string | null;
  };
  const patch: VendorPatch = {};
  if (hasDisplayNameChange) {
    // Re-derive slug from display_name (matches /api/admin/vendors PATCH
    // D2). Bookmarks/finds reference vendor_id, not slug — URL change is
    // the only consequence.
    patch.display_name = displayName;
    patch.slug         = slugify(displayName);
  }
  if (bio !== undefined)            patch.bio             = bio;
  if (facebookUrl !== undefined)    patch.facebook_url    = facebookUrl;
  if (instagramUrl !== undefined)   patch.instagram_url   = instagramUrl;
  if (directionsText !== undefined) patch.directions_text = directionsText;

  const { data, error } = await auth.service
    .from("vendors")
    .update(patch)
    .eq("id", vendorId)
    .select("*, mall:malls(id, name, slug, city, state, address, status)")
    .single();

  if (error) {
    console.error("[vendor/profile PATCH] update:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[vendor/profile PATCH] updated", {
    vendorId,
    user_id: auth.user.id,
    fields:  Object.keys(patch),
  });

  // Existing display_name-edit event preserved verbatim. Only fires when
  // display_name actually changed (matches pre-186 behavior).
  if (hasDisplayNameChange) {
    await recordEvent("vendor_profile_edited", {
      user_id: auth.user.id,
      payload: {
        vendor_id:    vendorId,
        vendor_slug:  data.slug,
        display_name: displayName,
        ...(actingAsAdmin ? { acting_as_admin: true } : {}),
      },
    });
  }

  // D12 — `vendor_profile_enriched` fires when one or more of the 4 enrichment
  // fields (bio + facebook_url + instagram_url + directions_text) flip from
  // NULL → non-empty for the FIRST time in this row. Avatar transitions are
  // recorded by /api/vendor-avatar (vendor_avatar_uploaded). Captures the
  // load-bearing signal: "vendor crossed from blank profile to storefront."
  const fieldsFilled: string[] = [];
  if (bio !== undefined && bio !== null && !existing.bio) fieldsFilled.push("bio");
  if (facebookUrl !== undefined && facebookUrl !== null && !existing.facebook_url) fieldsFilled.push("facebook_url");
  if (instagramUrl !== undefined && instagramUrl !== null && !existing.instagram_url) fieldsFilled.push("instagram_url");
  if (directionsText !== undefined && directionsText !== null && !existing.directions_text) fieldsFilled.push("directions_text");
  if (fieldsFilled.length > 0) {
    await recordEvent("vendor_profile_enriched", {
      user_id: auth.user.id,
      payload: {
        vendor_id:     vendorId,
        vendor_slug:   data.slug,
        fields_filled: fieldsFilled,
        ...(actingAsAdmin ? { acting_as_admin: true } : {}),
      },
    });
  }

  return NextResponse.json({ ok: true, vendor: data });
}
