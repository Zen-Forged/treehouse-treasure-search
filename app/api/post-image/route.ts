// app/api/post-image/route.ts
// Server-side post image upload using service role key.
// Bypasses RLS — safe because this is server-only code.
// Accepts: POST { base64DataUrl: string, vendorId: string }
// Returns: { url: string } or { error: string }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { base64DataUrl, vendorId } = await req.json();

    if (!base64DataUrl || !vendorId) {
      return NextResponse.json({ error: "Missing base64DataUrl or vendorId" }, { status: 400 });
    }

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[post-image] Missing env vars");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const [header, base64] = base64DataUrl.split(",");
    const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
    const ext      = mimeType.split("/")[1] ?? "jpg";
    const filename = `${vendorId}/${Date.now()}.${ext}`;

    const binary = Buffer.from(base64, "base64");

    console.log(`[post-image] Uploading ${filename} (${binary.length} bytes)`);

    const { error: uploadError } = await admin.storage
      .from("post-images")
      .upload(filename, binary, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[post-image] Upload failed:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = admin.storage.from("post-images").getPublicUrl(filename);
    console.log(`[post-image] Success: ${data.publicUrl}`);
    return NextResponse.json({ url: data.publicUrl });

  } catch (err) {
    console.error("[post-image] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
