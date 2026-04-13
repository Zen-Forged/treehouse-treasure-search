// app/api/auth/admin-pin/route.ts
// PIN-based admin login — no magic link email required.
//
// POST { pin: string }
// → verifies PIN against ADMIN_PIN env var (server-only, never sent to client)
// → uses Supabase service role to generate a link for ADMIN_EMAIL
// → extracts the email_otp (6-digit code) from the response
// → returns { otp, email } so the client can call supabase.auth.verifyOtp({ type: "email" })
//
// WHY email_otp instead of hashed_token/action_link token:
//   The action_link token has a very short TTL (~60s) and is invalidated the moment the
//   verify endpoint is hit. The email_otp is the underlying 6-digit code with a longer
//   TTL and works reliably with verifyOtp({ type: "email" }).
//
// Security model:
// - PIN is server-side only (never in NEXT_PUBLIC_* vars)
// - Rate limited: max 5 attempts per IP per minute
// - OTP is single-use (Supabase invalidates after first use)
// - SUPABASE_SERVICE_ROLE_KEY is server-only

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Simple in-memory rate limiter (resets on cold start — good enough for admin)
const attempts = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }

  const { pin } = await req.json().catch(() => ({ pin: "" }));
  const adminPin    = process.env.ADMIN_PIN ?? "";
  const adminEmail  = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  if (!adminPin || !serviceKey) {
    return NextResponse.json({ error: "Admin PIN not configured." }, { status: 503 });
  }

  if (!pin || pin.trim() !== adminPin.trim()) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type:  "magiclink",
    email: adminEmail,
  });

  if (error || !data?.properties) {
    console.error("[admin-pin] generateLink error:", error?.message);
    return NextResponse.json({ error: "Failed to generate login token." }, { status: 500 });
  }

  // email_otp is the 6-digit code — more reliable than the action_link token
  // which has a very short TTL and single-use restriction that causes race conditions
  const otp = data.properties.email_otp;

  if (!otp) {
    console.error("[admin-pin] no email_otp in generateLink response:", JSON.stringify(data.properties));
    return NextResponse.json({ error: "No OTP in response." }, { status: 500 });
  }

  console.log("[admin-pin] OTP generated successfully for:", adminEmail);
  return NextResponse.json({ otp, email: adminEmail });
}
