// app/api/admin/malls/hero-image/route.ts
// R11 (Wave 1 Task 7, session 91) — admin-gated mall hero upload + remove.
//
// POST   { base64DataUrl, mallId } → { url }       (set/replace)
// DELETE { mallId }                → { ok: true }  (clear)
//
// Mirrors the /api/admin/featured-image pattern for site-wide banners,
// scoped per-mall instead of per-setting-key. Storage uses the
// `site-assets` bucket with `mall-hero/{mall-slug}/{timestamp}.{ext}`
// filenames so admins can audit bucket contents at a glance.
//
// Audit logging via R3 events: `mall_hero_uploaded_by_admin` /
// `mall_hero_removed_by_admin`.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { recordEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { service, user } = auth;

  let body: { base64DataUrl?: string; mallId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { base64DataUrl, mallId } = body;
  if (!base64DataUrl || typeof base64DataUrl !== "string") {
    return NextResponse.json({ error: "Missing base64DataUrl" }, { status: 400 });
  }
  if (!mallId || typeof mallId !== "string") {
    return NextResponse.json({ error: "Missing mallId" }, { status: 400 });
  }

  // Look up the mall to get its slug for the storage path + verify it
  // exists. Slug-based paths make the bucket browsable.
  const { data: mall, error: fetchErr } = await service
    .from("malls")
    .select("id, slug, hero_image_url")
    .eq("id", mallId)
    .maybeSingle();
  if (fetchErr) {
    console.error("[admin/malls/hero-image POST] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!mall) {
    return NextResponse.json({ error: "Mall not found." }, { status: 404 });
  }

  const [header, base64] = base64DataUrl.split(",");
  if (!header || !base64) {
    return NextResponse.json({ error: "Malformed base64DataUrl" }, { status: 400 });
  }
  const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
  const ext      = mimeType.split("/")[1] ?? "jpg";
  const filename = `mall-hero/${mall.slug}/${Date.now()}.${ext}`;
  const binary   = Buffer.from(base64, "base64");

  console.log(`[admin/malls/hero-image] Uploading ${filename} (${binary.length} bytes)`);

  const { error: uploadError } = await service.storage
    .from("site-assets")
    .upload(filename, binary, { contentType: mimeType, upsert: false });
  if (uploadError) {
    console.error("[admin/malls/hero-image] Upload failed:", uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = service.storage.from("site-assets").getPublicUrl(filename);
  const publicUrl = pub.publicUrl;

  const { error: dbErr } = await service
    .from("malls")
    .update({ hero_image_url: publicUrl })
    .eq("id", mallId);
  if (dbErr) {
    console.error("[admin/malls/hero-image] DB update failed:", dbErr.message);
    return NextResponse.json(
      { error: `Uploaded but couldn't save: ${dbErr.message}` },
      { status: 500 },
    );
  }

  await recordEvent("mall_hero_uploaded_by_admin", {
    user_id: user.id,
    payload: {
      mall_id:    mallId,
      mall_slug:  mall.slug,
      mime_type:  mimeType,
      size_bytes: binary.length,
    },
  });

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { service, user } = auth;

  let mallId: unknown = req.nextUrl.searchParams.get("mallId");
  if (!mallId) {
    try {
      const body = await req.json();
      mallId = body?.mallId;
    } catch {
      // Query param will be checked below.
    }
  }
  if (!mallId || typeof mallId !== "string") {
    return NextResponse.json({ error: "Missing mallId" }, { status: 400 });
  }

  const { data: mall, error: fetchErr } = await service
    .from("malls")
    .select("id, slug, hero_image_url")
    .eq("id", mallId)
    .maybeSingle();
  if (fetchErr) {
    console.error("[admin/malls/hero-image DELETE] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!mall) {
    return NextResponse.json({ error: "Mall not found." }, { status: 404 });
  }

  // Best-effort storage cleanup. Continue on miss.
  if (mall.hero_image_url) {
    const marker = "/site-assets/";
    const idx = mall.hero_image_url.indexOf(marker);
    if (idx !== -1) {
      const path = mall.hero_image_url.slice(idx + marker.length).split("?")[0];
      const { error: storageErr } = await service.storage
        .from("site-assets")
        .remove([path]);
      if (storageErr) {
        console.warn(
          `[admin/malls/hero-image DELETE] Storage remove failed (continuing): ${storageErr.message}`,
        );
      }
    }
  }

  const { error: dbErr } = await service
    .from("malls")
    .update({ hero_image_url: null })
    .eq("id", mallId);
  if (dbErr) {
    console.error("[admin/malls/hero-image DELETE] DB update failed:", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  await recordEvent("mall_hero_removed_by_admin", {
    user_id: user.id,
    payload: { mall_id: mallId, mall_slug: mall.slug },
  });

  return NextResponse.json({ ok: true });
}
