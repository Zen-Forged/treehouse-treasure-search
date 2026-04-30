// app/api/post-image/route.ts
// Server-side post-image upload to the post-images Supabase bucket.
//
// POST { base64DataUrl, vendorId } → { url }
//
// Auth model (Wave 1.5, session 92): requireAuth + ownership-or-admin —
// matches /api/vendor-hero. Owners (vendors.user_id === auth.user.id) can
// upload images keyed under their booth's vendorId; admins can upload on
// behalf of any booth (used by admin-impersonation flows).
//
// Service role still does the storage write (anon RLS doesn't allow public
// bucket writes); the auth gate above is what keeps the path honest.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";

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
    console.error("[post-image] fetch vendor:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Booth not found." }, { status: 404 });
  }
  const owns  = existing.user_id === auth.user.id;
  const admin = isAdminEmail(auth.user.email);
  if (!owns && !admin) {
    return NextResponse.json(
      { error: "You can only upload to your own booth." },
      { status: 403 },
    );
  }

  try {
    const [header, base64] = base64DataUrl.split(",");
    const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
    const ext      = mimeType.split("/")[1] ?? "jpg";
    const filename = `${vendorId}/${Date.now()}.${ext}`;
    const binary   = Buffer.from(base64, "base64");

    console.log(`[post-image] Uploading ${filename} (${binary.length} bytes)`);

    const { error: uploadError } = await auth.service.storage
      .from("post-images")
      .upload(filename, binary, {
        contentType: mimeType,
        upsert: false,
      });
    if (uploadError) {
      console.error("[post-image] Upload failed:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = auth.service.storage.from("post-images").getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("[post-image] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
