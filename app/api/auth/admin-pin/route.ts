// app/api/auth/admin-pin/route.ts
// PIN-based admin login — no magic link email required.
//
// POST { pin: string }
// → verifies PIN against ADMIN_PIN env var (server-only, never sent to client)
// → uses Supabase service role to create a session directly for ADMIN_EMAIL
// → returns { access_token, refresh_token } so the client can call supabase.auth.setSession()
//
// WHY setSession instead of verifyOtp:
//   verifyOtp tokens expire in ~60s and are single-use. Network latency + Vercel cold starts
//   can cause the token to expire before the client can use it. setSession with a real
//   access_token + refresh_token bypasses this entirely.
//
// Security model:
// - PIN is server-side only (never in NEXT_PUBLIC_* vars)
// - Rate limited: max 5 attempts per IP per minute
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

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Look up or create the admin user, then create a session directly.
  // This avoids the short-lived verifyOtp token race condition.
  const { data: userList, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error("[admin-pin] listUsers error:", listErr.message);
    return NextResponse.json({ error: "Failed to look up admin user." }, { status: 500 });
  }

  const adminUser = userList.users.find(u => u.email === adminEmail);
  if (!adminUser) {
    console.error("[admin-pin] admin user not found for email:", adminEmail);
    return NextResponse.json({ error: "Admin user not found. Sign in via magic link once first." }, { status: 404 });
  }

  // Create a session for the admin user directly — no token TTL risk
  const { data: sessionData, error: sessionErr } = await admin.auth.admin.createSession({
    user_id: adminUser.id,
  });

  if (sessionErr || !sessionData?.session) {
    console.error("[admin-pin] createSession error:", sessionErr?.message);
    return NextResponse.json({ error: "Failed to create admin session." }, { status: 500 });
  }

  return NextResponse.json({
    access_token:  sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    email:         adminEmail,
  });
}
