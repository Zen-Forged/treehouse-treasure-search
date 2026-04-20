// app/api/vendor-request/route.ts
// POST { first_name, last_name, email, booth_number, booth_name, mall_id,
//        mall_name, proof_image_data_url }
//   → dedup pre-check (pending/approved match by composite key)
//   → if pending same (email, mall, booth) → { status: "already_pending" } (no insert, no email)
//   → if approved same (email, mall, booth) → { status: "already_approved" } (no insert, no email)
//   → else: uploads booth-proof photo to site-assets bucket, inserts vendor_requests
//     row, fires Email #1 receipt
//
// Session 35 (2026-04-20) — multi-booth dedup widening:
//  - Dedup key was (lower(email), status) from session 32. Too strict once
//    a vendor can legitimately hold multiple booths across malls. Rekeyed
//    to (lower(email), mall_id, booth_number, status).
//  - DB safety-net index rekeyed in migration 007 to match.
//  - Same email + same mall + same booth + pending → still blocked.
//  - Same email + different (mall, booth) → proceeds.
//
// Session 32 (v1.2) onboarding refresh (unchanged in this session):
//  - Name split into first_name + last_name. `name` column kept populated
//    as `first_name + ' ' + last_name` for backwards compat with any
//    downstream reader that still references it.
//  - Optional booth_name. Honored at approval time by admin route.
//  - Required booth proof photo (Model B). Uploaded to site-assets bucket
//    under booth-proof/<timestamp>.<ext>.
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
    const trimmedBoothNumber = booth_number?.trim() || null;
    const normalizedMallId   = mall_id || null;

    // ── Dedup pre-check (session 35 — composite key) ──────────────────────
    // Same email + same mall + same booth + pending → block.
    // Same email + same mall + same booth + approved → block (already linked).
    // Same email + different (mall, booth) → proceed.
    //
    // The partial unique index in migration 007 enforces the pending branch
    // at the DB layer for race safety. The approved branch is pre-check
    // only because an approved request has a vendors row attached and
    // re-submitting the same (email, mall, booth) would collide on
    // vendors_mall_booth_unique at approval anyway — we catch it here for
    // clearer UX.
    let dedupQuery = supabase
      .from("vendor_requests")
      .select("id, status")
      .eq("email", trimmedEmail)
      .in("status", ["pending", "approved"]);

    if (normalizedMallId) {
      dedupQuery = dedupQuery.eq("mall_id", normalizedMallId);
    } else {
      dedupQuery = dedupQuery.is("mall_id", null);
    }

    if (trimmedBoothNumber) {
      dedupQuery = dedupQuery.eq("booth_number", trimmedBoothNumber);
    } else {
      dedupQuery = dedupQuery.is("booth_number", null);
    }

    const { data: existing, error: existingErr } = await dedupQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      logError("Dedup pre-check failed", { ip, error: existingErr, details: { userAgent } });
      // Don't fail hard — fall through to insert and let the unique index
      // catch any race. Worst case: user sees a generic error.
    }

    if (existing?.status === "pending") {
      console.log(`[vendor-request] Dedup hit (pending, composite) for ${trimmedEmail} @ mall=${normalizedMallId ?? "null"} booth=${trimmedBoothNumber ?? "null"}`);
      return NextResponse.json({ ok: true, status: "already_pending" });
    }
    if (existing?.status === "approved") {
      console.log(`[vendor-request] Dedup hit (approved, composite) for ${trimmedEmail} @ mall=${normalizedMallId ?? "null"} booth=${trimmedBoothNumber ?? "null"}`);
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
      booth_number:    trimmedBoothNumber,
      booth_name:      trimmedBooth,
      mall_id:         normalizedMallId,
      mall_name:       trimmedMall,
      proof_image_url: proofImageUrl,
      status:          "pending",
    };

    const { error: insertError } = await supabase.from("vendor_requests").insert(insertPayload);

    if (insertError) {
      // If the partial unique index fires (race between our pre-check and
      // insert on the composite key), normalize to the same already_pending
      // response the pre-check would have returned.
      if (insertError.code === "23505") {
        console.log(`[vendor-request] Insert race hit composite partial unique index for ${trimmedEmail} @ mall=${normalizedMallId ?? "null"} booth=${trimmedBoothNumber ?? "null"}`);
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
      `Booth: ${trimmedBoothNumber || "not specified"} · ${trimmedBooth ? `"${trimmedBooth}"` : "no booth name"} — ` +
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
