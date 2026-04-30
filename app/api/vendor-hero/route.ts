// app/api/vendor-hero/route.ts
// Server-side vendor hero image upload + remove.
//
// POST   { base64DataUrl: string, vendorId: string } → { url: string }
// DELETE { vendorId: string }                        → { ok: true }   (R4b session 91)
//
// Auth model (Wave 1.5, session 92): requireAuth + ownership-or-admin.
//   - Owners (vendors.user_id === auth.user.id) can upload + remove their hero.
//   - Admins (email matches NEXT_PUBLIC_ADMIN_EMAIL) can manage any booth's
//     hero — used by /shelves (any booth) and AddBoothSheet (newly-created
//     booth on behalf of another vendor).
// All four client callers (EditBoothSheet, AddBoothSheet, AddBoothInline) use
// authFetch so the bearer token flows.
//
// Service role still does the storage upload + DB update so RLS doesn't have
// to enable client writes against `vendors.hero_image_url`.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";
import { recordEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: { base64DataUrl?: string; vendorId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { base64DataUrl, vendorId } = body;
  if (!base64DataUrl || !vendorId) {
    return NextResponse.json(
      { error: "Missing base64DataUrl or vendorId" },
      { status: 400 },
    );
  }

  // Ownership-or-admin gate.
  const { data: existing, error: fetchErr } = await auth.service
    .from("vendors")
    .select("id, user_id")
    .eq("id", vendorId)
    .maybeSingle();
  if (fetchErr) {
    console.error("[vendor-hero POST] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }
  const owns  = existing.user_id === auth.user.id;
  const admin = isAdminEmail(auth.user.email);
  if (!owns && !admin) {
    return NextResponse.json(
      { error: "You can only edit your own booth's photo." },
      { status: 403 },
    );
  }

  try {
    const [header, base64] = base64DataUrl.split(",");
    const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
    const filename = `vendor-hero/${vendorId}.jpg`;
    const binary   = Buffer.from(base64, "base64");

    const { error: uploadError } = await auth.service.storage
      .from("post-images")
      .upload(filename, binary, {
        contentType: mimeType,
        upsert: true,
      });
    if (uploadError) {
      console.error("[vendor-hero POST] storage upload:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: pub } = auth.service.storage
      .from("post-images")
      .getPublicUrl(filename);
    const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await auth.service
      .from("vendors")
      .update({ hero_image_url: publicUrl })
      .eq("id", vendorId);
    if (dbError) {
      console.error("[vendor-hero POST] db update:", dbError.message);
      // Image is uploaded — return URL with warning rather than failing.
      return NextResponse.json({
        url: publicUrl,
        warning: `DB update failed: ${dbError.message}`,
      });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[vendor-hero POST] unexpected:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: { vendorId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const vendorId = body.vendorId?.trim();
  if (!vendorId) {
    return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });
  }

  // Ownership-or-admin gate.
  const { data: existing, error: fetchErr } = await auth.service
    .from("vendors")
    .select("id, user_id")
    .eq("id", vendorId)
    .maybeSingle();
  if (fetchErr) {
    console.error("[vendor-hero DELETE] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }
  const owns  = existing.user_id === auth.user.id;
  const admin = isAdminEmail(auth.user.email);
  if (!owns && !admin) {
    return NextResponse.json(
      { error: "You can only remove your own booth's photo." },
      { status: 403 },
    );
  }

  try {
    // Best-effort storage cleanup. Continue on miss — orphaned blobs are
    // preferable to a half-completed delete (vendors row is the source of truth
    // for user-visible state).
    const filename = `vendor-hero/${vendorId}.jpg`;
    const { error: storageError } = await auth.service.storage
      .from("post-images")
      .remove([filename]);
    if (storageError) {
      console.warn("[vendor-hero DELETE] storage remove (continuing):", storageError.message);
    }

    const { error: dbError } = await auth.service
      .from("vendors")
      .update({ hero_image_url: null })
      .eq("id", vendorId);
    if (dbError) {
      console.error("[vendor-hero DELETE] db update:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    await recordEvent("vendor_hero_removed", {
      user_id: auth.user.id,
      payload: { vendor_id: vendorId, by_admin: !owns && admin },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vendor-hero DELETE] unexpected:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
