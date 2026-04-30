// app/api/admin/featured-image/route.ts
// Admin-gated upload + persistence for featured banner images — v1.1l.
//
// POST   { base64DataUrl, settingKey } → { url }            (set/replace)
// DELETE { settingKey }                → { ok: true }       (clear)
//
// Flow (POST):
//   1. requireAdmin(req) — bearer token + admin email match
//   2. Upload base64 to the site-assets Supabase Storage bucket (service role,
//      bypasses RLS) with a key-prefixed filename
//   3. Upsert { key: settingKey, value: { url: publicUrl }, updated_by } into
//      site_settings
//   4. Return public URL
//
// Flow (DELETE — session 61):
//   1. requireAdmin(req)
//   2. Read current site_settings row to get the existing URL
//   3. Parse the bucket path from the URL and remove the storage object
//      (best-effort — DB row deletion is the source of truth, so we don't
//      fail the request on a storage-side miss)
//   4. Delete the site_settings row
//
// Mirrors the lib/imageUpload.ts + /api/post-image pattern but writes to the
// site-assets bucket and updates site_settings on success.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { recordEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "featured_find_image_url",
  "find_map_banner_image_url",
] as const;

type SettingKey = typeof ALLOWED_KEYS[number];

function isAllowedKey(k: unknown): k is SettingKey {
  return typeof k === "string" && (ALLOWED_KEYS as readonly string[]).includes(k);
}

export async function POST(req: NextRequest) {
  // 1. Admin gate
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { service, user } = auth;

  let body: { base64DataUrl?: string; settingKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { base64DataUrl, settingKey } = body;

  if (!base64DataUrl || typeof base64DataUrl !== "string") {
    return NextResponse.json({ error: "Missing base64DataUrl" }, { status: 400 });
  }
  if (!isAllowedKey(settingKey)) {
    return NextResponse.json(
      { error: `Invalid settingKey. Must be one of: ${ALLOWED_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  // 2. Upload to site-assets bucket
  const [header, base64] = base64DataUrl.split(",");
  if (!header || !base64) {
    return NextResponse.json({ error: "Malformed base64DataUrl" }, { status: 400 });
  }
  const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
  const ext      = mimeType.split("/")[1] ?? "jpg";
  // Key-prefixed filename so we can see at a glance in the bucket which
  // asset belongs to which setting. Timestamp prevents name collisions and
  // breaks CDN caching when the admin replaces an image.
  const filename = `${settingKey}/${Date.now()}.${ext}`;
  const binary   = Buffer.from(base64, "base64");

  console.log(`[featured-image] Uploading ${filename} (${binary.length} bytes)`);

  const { error: uploadError } = await service.storage
    .from("site-assets")
    .upload(filename, binary, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error("[featured-image] Upload failed:", uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = service.storage.from("site-assets").getPublicUrl(filename);
  const publicUrl = pub.publicUrl;

  // 3. Upsert site_settings row
  const { error: upsertError } = await service
    .from("site_settings")
    .upsert(
      {
        key:        settingKey,
        value:      { url: publicUrl },
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "key" },
    );

  if (upsertError) {
    console.error("[featured-image] Upsert failed:", upsertError.message);
    // Image is in storage but the DB row didn't update — return error so the
    // admin UI can surface the partial-failure state. Not deleting the
    // orphan blob since a retry can reuse it.
    return NextResponse.json(
      { error: `Uploaded but couldn't save setting: ${upsertError.message}` },
      { status: 500 },
    );
  }

  console.log(`[featured-image] Success: ${settingKey} → ${publicUrl}`);

  await recordEvent("featured_image_uploaded_by_admin", {
    user_id: user.id,
    payload: { setting_key: settingKey, mime_type: mimeType, size_bytes: binary.length },
  });

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(req: NextRequest) {
  // 1. Admin gate
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { service, user } = auth;

  // settingKey can ride in the body OR as a ?settingKey= query param.
  // Body is the canonical shape (matches POST); query is a convenience for
  // clients that can't easily attach a body to a DELETE.
  let settingKey: unknown = req.nextUrl.searchParams.get("settingKey");
  if (!settingKey) {
    try {
      const body = await req.json();
      settingKey = body?.settingKey;
    } catch {
      // No body is fine if query param was provided. If neither, the
      // isAllowedKey check below catches it.
    }
  }

  if (!isAllowedKey(settingKey)) {
    return NextResponse.json(
      { error: `Invalid settingKey. Must be one of: ${ALLOWED_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  // 2. Look up the current URL so we can clean up the storage object too.
  const { data: existing, error: readError } = await service
    .from("site_settings")
    .select("value")
    .eq("key", settingKey)
    .maybeSingle();

  if (readError) {
    console.error("[featured-image:DELETE] Read failed:", readError.message);
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  // 3. Best-effort storage cleanup. The DB row is the source of truth — a
  // missed storage object becomes an orphan blob, not a user-visible bug.
  const currentUrl: string | undefined = (existing?.value as { url?: string } | null)?.url;
  if (currentUrl) {
    const marker = "/site-assets/";
    const idx = currentUrl.indexOf(marker);
    if (idx !== -1) {
      const path = currentUrl.slice(idx + marker.length);
      const { error: storageError } = await service.storage
        .from("site-assets")
        .remove([path]);
      if (storageError) {
        console.warn(
          `[featured-image:DELETE] Storage remove failed (continuing): ${storageError.message}`,
        );
      } else {
        console.log(`[featured-image:DELETE] Removed storage object: ${path}`);
      }
    }
  }

  // 4. Delete the settings row. If the row didn't exist this is a no-op,
  // which is the right outcome — the caller asked for "cleared" and it's cleared.
  const { error: deleteError } = await service
    .from("site_settings")
    .delete()
    .eq("key", settingKey);

  if (deleteError) {
    console.error("[featured-image:DELETE] Row delete failed:", deleteError.message);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  console.log(`[featured-image:DELETE] Success: ${settingKey} cleared`);

  await recordEvent("featured_image_removed_by_admin", {
    user_id: user.id,
    payload: { setting_key: settingKey },
  });

  return NextResponse.json({ ok: true });
}
