// app/api/auth/admin-pin/route.ts
// PIN-based admin login — no magic link email required.
//
// POST { pin: string }
// → verifies PIN against ADMIN_PIN env var (server-only, never sent to client)
// → uses Supabase service role to generate a magic link for ADMIN_EMAIL
// → extracts the token_hash from the action_link URL
// → returns { token, email } so the client can call supabase.auth.verifyOtp()
//
// Security model:
// - PIN is server-side only (never in NEXT_PUBLIC_* vars)
// - Rate limited: max 5 attempts per IP per minute
// - Token is single-use (Supabase invalidates after first use)
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
    return true; // allowed
  }
  if (entry.count >= 5) return false; // blocked
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
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

  // Use service role to generate a magic link — no email is sent
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type:  "magiclink",
    email: adminEmail,
  });

  if (error || !data?.properties?.action_link) {
    console.error("[admin-pin] generateLink error:", error?.message, "data:", JSON.stringify(data?.properties));
    return NextResponse.json({ error: "Failed to generate session token." }, { status: 500 });
  }

  // The action_link is a URL like:
  //   https://<project>.supabase.co/auth/v1/verify?token=<token_hash>&type=magiclink&...
  // We need to extract the `token` query param — this is what verifyOtp expects.
  let token: string | null = null;
  try {
    const url = new URL(data.properties.action_link);
    token = url.searchParams.get("token");
  } catch (parseErr) {
    console.error("[admin-pin] failed to parse action_link:", parseErr);
  }

  if (!token) {
    // Fallback: use hashed_token directly (older Supabase versions)
    token = data.properties.hashed_token ?? null;
  }

  if (!token) {
    console.error("[admin-pin] no token found in generateLink response:", JSON.stringify(data.properties));
    return NextResponse.json({ error: "No token in response." }, { status: 500 });
  }

  return NextResponse.json({ token, email: adminEmail });
}
