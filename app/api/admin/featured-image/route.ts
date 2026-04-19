// app/api/admin/featured-image/route.ts
// Admin-gated upload + persistence for featured banner images — v1.1l.
//
// Accepts: POST { base64DataUrl: string, settingKey: "featured_find_image_url" | "find_map_banner_image_url" }
// Returns: { url: string } on 200 or { error: string } on 4xx/5xx
//
// Flow:
//   1. requireAdmin(req) — bearer token + admin email match
//   2. Upload base64 to the site-assets Supabase Storage bucket (service role,
//      bypasses RLS) with a key-prefixed filename
//   3. Upsert { key: settingKey, value: { url: publicUrl }, updated_by } into
//      site_settings
//   4. Return public URL
//
// Mirrors the lib/imageUpload.ts + /api/post-image pattern but writes to the
// site-assets bucket and updates site_settings on success.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

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
  return NextResponse.json({ url: publicUrl });
}
