// app/api/vendor-request/route.ts
// POST { name, email, booth_number, mall_id, mall_name }
// → writes to vendor_requests table (Supabase)
// → sends notification email to NEXT_PUBLIC_ADMIN_EMAIL via Resend (if configured)
//    or logs to console as fallback
//
// Table required (run in Supabase SQL editor):
//   CREATE TABLE vendor_requests (
//     id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     name         text NOT NULL,
//     email        text NOT NULL,
//     booth_number text,
//     mall_id      uuid REFERENCES malls(id),
//     mall_name    text,
//     status       text DEFAULT 'pending',
//     created_at   timestamptz DEFAULT now()
//   );
//   ALTER TABLE vendor_requests ENABLE ROW LEVEL SECURITY;
//   -- Service role only — no public access
//   CREATE POLICY "service role only" ON vendor_requests
//     USING (false) WITH CHECK (false);

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Simple in-memory rate limiter — max 3 requests per IP per 10 minutes
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

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, email, booth_number, mall_id, mall_name } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const adminEmail   = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

  if (!supabaseUrl || !serviceKey) {
    console.error("[vendor-request] Missing Supabase env vars");
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Use service role to bypass RLS on vendor_requests
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: insertError } = await supabase.from("vendor_requests").insert({
    name:         name.trim(),
    email:        email.trim().toLowerCase(),
    booth_number: booth_number?.trim() || null,
    mall_id:      mall_id || null,
    mall_name:    mall_name?.trim() || null,
    status:       "pending",
  });

  if (insertError) {
    console.error("[vendor-request] Insert error:", insertError.message);
    return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
  }

  // Notify admin — log to console (upgrade to Resend/SendGrid in Sprint 4)
  console.log(
    `[vendor-request] New request from ${name} (${email}) — ` +
    `Booth: ${booth_number || "not specified"} — Mall: ${mall_name || "not specified"}`
  );

  // TODO Sprint 4: Send email via Resend
  // await sendAdminNotification({ name, email, booth_number, mall_name, adminEmail });

  return NextResponse.json({ ok: true });
}
