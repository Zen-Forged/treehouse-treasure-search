// app/api/vendor-request/route.ts
// POST { first_name, last_name, email, booth_number, booth_name, mall_id,
//        mall_name, proof_image_data_url }
//   → dedup pre-check (pending/approved match by email)
//   → if pending → returns { ok: true, status: "already_pending" } (no insert, no email)
//   → if approved → returns { ok: true, status: "already_approved" } (no insert, no email)
//   → else: uploads booth-proof photo to site-assets bucket, inserts vendor_requests
//     row, fires Email #1 receipt
//
// Session 32 (v1.2) changes:
//  - Name split into first_name + last_name. `name` column kept populated as
//    `first_name + ' ' + last_name` for backwards compat with any downstream
//    reader that still references it.
//  - New optional booth_name field. Honored at approval time by the admin
//    route — if set, becomes vendors.display_name; if null/empty, display_name
//    defaults to first + last.
//  - Required booth proof photo (Model B). Uploaded as base64 data URL,
//    written to site-assets bucket under booth-proof/<timestamp>.<ext>.
//  - Server-side dedup pre-check on (lower(email), status). Returns a
//    structured status response so the client can render an in-place
//    "already pending" state without treating it as an error.
//  - Partial unique index on (lower(email)) WHERE status='pending' is the
//    DB safety net (see 005_vendor_request_onboarding_refresh.sql).
//
// Email is still best-effort — the DB insert is the contract, email is a
// notification. Approved-email branch does NOT re-fire the receipt email
// because the vendor already got one when they originally requested.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRequestReceived } from "@/lib/email";

// ─── Error logging utility ────────────────────────────────────────────────────
function logError(message: string, context: { ip: string; error?: any; details?: Record<string, any> }) {
  const timestamp = new Date().toISOString();
  const { ip, error, details = {} } = context;

  console.error(`[vendor-request] ${timestamp} - ${message}`, {
    ip,
    userAgent: context.details?.userAgent || "unknown",
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    ...details,
  });
}

// ─── Rate limit ───────────────────────────────────────────────────────────────
const attempts = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 10 * 60_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROOF_PHOTO_MAX_BYTES = 12_000_000; // 12MB — same ceiling as hero image upload

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip        = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  if (!rateLimit(ip)) {
    logError("Rate limit exceeded", {
      ip,
      details: { userAgent, rateLimitMaxRequests: 3, rateLimitWindowMinutes: 10 },
    });
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json().catch((parseError) => {
      logError("JSON parse error", {
        ip,
        error: parseError,
        details: { userAgent, contentType: req.headers.get("content-type") },
      });
      throw new Error("Invalid JSON body");
    });

    const {
      first_name,
      last_name,
      email,
      booth_number,
      booth_name,
      mall_id,
      mall_name,
      proof_image_data_url,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!first_name?.trim()) {
      return NextResponse.json({ error: "Please enter your first name." }, { status: 400 });
    }
    if (!last_name?.trim()) {
      return NextResponse.json({ error: "Please enter your last name." }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!proof_image_data_url || typeof proof_image_data_url !== "string") {
      return NextResponse.json(
        { error: "Please add a photo of your booth so we can make sure it's yours." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!supabaseUrl || !serviceKey) {
      logError("Configuration error: missing Supabase environment variables", {
        ip,
        error: new Error("Missing required environment variables"),
        details: { userAgent, hasSupabaseUrl: !!supabaseUrl, hasServiceKey: !!serviceKey },
      });
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const trimmedFirst = first_name.trim();
    const trimmedLast  = last_name.trim();
    const trimmedName  = `${trimmedFirst} ${trimmedLast}`;
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedBooth = booth_name?.trim() || null;
    const trimmedMall  = mall_name?.trim() || null;

    // ── Dedup pre-check ───────────────────────────────────────────────────
    // Look for any existing request for this email. The partial unique
    // index prevents two pending rows at the DB level, but the UX surface
    // is here: we want to tell the client which state the email is in
    // without letting a duplicate insert attempt reach the DB.
    const { data: existing, error: existingErr } = await supabase
      .from("vendor_requests")
      .select("id, status")
      .eq("email", trimmedEmail)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      logError("Dedup pre-check failed", { ip, error: existingErr, details: { userAgent } });
      // Don't fail hard — fall through to insert and let the unique index
      // catch any race. Worst case: user sees a generic error.
    }

    if (existing?.status === "pending") {
      console.log(`[vendor-request] Dedup hit (pending) for ${trimmedEmail}`);
      return NextResponse.json({ ok: true, status: "already_pending" });
    }
    if (existing?.status === "approved") {
      console.log(`[vendor-request] Dedup hit (approved) for ${trimmedEmail}`);
      return NextResponse.json({ ok: true, status: "already_approved" });
    }

    // ── Upload booth proof photo to site-assets bucket ────────────────────
    const [header, base64] = proof_image_data_url.split(",");
    if (!header || !base64) {
      return NextResponse.json({ error: "Couldn't read the booth photo. Try a different image." }, { status: 400 });
    }
    const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
    const ext      = mimeType.split("/")[1] ?? "jpg";
    const binary   = Buffer.from(base64, "base64");

    if (binary.length > PROOF_PHOTO_MAX_BYTES) {
      return NextResponse.json(
        { error: "Photo is too large. Please choose one smaller than 12MB." },
        { status: 400 },
      );
    }

    const filename = `booth-proof/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(filename, binary, { contentType: mimeType, upsert: false });

    if (uploadError) {
      logError("Booth proof upload failed", { ip, error: uploadError, details: { userAgent, filename } });
      return NextResponse.json(
        { error: "Couldn't save your booth photo. Please try again." },
        { status: 500 },
      );
    }

    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(filename);
    const proofImageUrl = pub.publicUrl;

    // ── Insert vendor_requests row ────────────────────────────────────────
    // Populate both the new split fields AND the legacy `name` column so
    // any downstream reader that still references `name` keeps working
    // through the transition.
    const insertPayload = {
      name:            trimmedName,   // backwards-compat
      first_name:      trimmedFirst,
      last_name:       trimmedLast,
      email:           trimmedEmail,
      booth_number:    booth_number?.trim() || null,
      booth_name:      trimmedBooth,
      mall_id:         mall_id || null,
      mall_name:       trimmedMall,
      proof_image_url: proofImageUrl,
      status:          "pending",
    };

    const { error: insertError } = await supabase.from("vendor_requests").insert(insertPayload);

    if (insertError) {
      // If the partial unique index fires (race between our pre-check and
      // insert), normalize to the same already_pending response the
      // pre-check would have returned.
      if (insertError.code === "23505") {
        console.log(`[vendor-request] Insert race hit partial unique index for ${trimmedEmail}`);
        return NextResponse.json({ ok: true, status: "already_pending" });
      }

      logError("Database insert error", {
        ip,
        error: insertError,
        details: {
          userAgent,
          insertPayload: { ...insertPayload, email: "[redacted]" },
          errorCode:    insertError.code,
          errorDetails: insertError.details,
          errorHint:    insertError.hint,
        },
      });
      return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
    }

    console.log(
      `[vendor-request] ${new Date().toISOString()} - New request from ${trimmedName} (${trimmedEmail}) — ` +
      `Booth: ${booth_number || "not specified"} · ${trimmedBooth ? `"${trimmedBooth}"` : "no booth name"} — ` +
      `Mall: ${trimmedMall || "not specified"} — IP: ${ip}`
    );

    // ── Email #1: Request received (best-effort) ──────────────────────────
    const emailResult = await sendRequestReceived({
      firstName: trimmedFirst,
      email:     trimmedEmail,
      mallName:  trimmedMall,
    });

    if (!emailResult.ok) {
      logError("Request received email failed to send", {
        ip,
        error: emailResult.error,
        details: { userAgent, vendorEmail: trimmedEmail },
      });
    }

    return NextResponse.json({ ok: true, status: "created" });

  } catch (err) {
    logError("Unexpected error", { ip, error: err, details: { userAgent } });
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
