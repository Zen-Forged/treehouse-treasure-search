// app/api/vendor-hero/route.ts
// Server-side vendor hero image upload + remove using service role key.
// Bypasses RLS entirely — safe because this is server-only code.
//
// POST   { base64DataUrl: string, vendorId: string } → { url: string }
// DELETE { vendorId: string }                        → { ok: true }   (R4b session 91)
//
// SECURITY NOTE (session 91 Wave 1): this route does NOT call requireAuth
// or check ownership. UI gates the affordance to the booth's owner (or
// admin via impersonation), but a direct request can target any vendor.
// Hardening lands in Wave 1.5 security continuation — see CLAUDE.md
// audit-gap follow-ups.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { recordEvent } from "@/lib/events";

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
      console.error("[vendor-hero] Missing env vars — NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
      return NextResponse.json({ error: "Server misconfiguration — missing env vars" }, { status: 500 });
    }

    // Service role client — bypasses all RLS policies
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Parse base64
    const [header, base64] = base64DataUrl.split(",");
    const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
    const filename  = `vendor-hero/${vendorId}.jpg`;

    const binary = Buffer.from(base64, "base64");

    console.log(`[vendor-hero] Uploading ${filename} (${binary.length} bytes)`);

    const { error: uploadError } = await admin.storage
      .from("post-images")
      .upload(filename, binary, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[vendor-hero] Storage upload failed:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = admin.storage
      .from("post-images")
      .getPublicUrl(filename);

    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    console.log(`[vendor-hero] Upload succeeded. URL: ${publicUrl}`);

    // Update the vendors table — also uses service role so no RLS issues
    const { error: dbError } = await admin
      .from("vendors")
      .update({ hero_image_url: publicUrl })
      .eq("id", vendorId);

    if (dbError) {
      console.error("[vendor-hero] DB update failed:", dbError.message);
      // Image is already uploaded — return the URL with a warning
      return NextResponse.json({
        url: publicUrl,
        warning: `DB update failed: ${dbError.message}`,
      });
    }

    console.log(`[vendor-hero] vendors.hero_image_url updated for ${vendorId}`);
    return NextResponse.json({ url: publicUrl });

  } catch (err) {
    console.error("[vendor-hero] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// R4b — DELETE: remove vendor hero. Nulls the column + best-effort storage
// cleanup of `vendor-hero/{vendorId}.jpg`. Storage miss does NOT fail the
// request — orphaned blobs are preferable to a half-completed delete (the
// vendors row is the source of truth for the user-visible state).
export async function DELETE(req: NextRequest) {
  try {
    const { vendorId } = await req.json();

    if (!vendorId || typeof vendorId !== "string") {
      return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });
    }

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[vendor-hero:DELETE] Missing env vars");
      return NextResponse.json({ error: "Server misconfiguration — missing env vars" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Best-effort storage cleanup. Continue on miss.
    const filename = `vendor-hero/${vendorId}.jpg`;
    const { error: storageError } = await admin.storage
      .from("post-images")
      .remove([filename]);
    if (storageError) {
      console.warn(
        `[vendor-hero:DELETE] Storage remove failed (continuing): ${storageError.message}`,
      );
    } else {
      console.log(`[vendor-hero:DELETE] Removed storage object: ${filename}`);
    }

    // 2. Null the column.
    const { error: dbError } = await admin
      .from("vendors")
      .update({ hero_image_url: null })
      .eq("id", vendorId);

    if (dbError) {
      console.error("[vendor-hero:DELETE] DB update failed:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log(`[vendor-hero:DELETE] vendors.hero_image_url cleared for ${vendorId}`);

    await recordEvent("vendor_hero_removed", {
      payload: { vendor_id: vendorId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vendor-hero:DELETE] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
