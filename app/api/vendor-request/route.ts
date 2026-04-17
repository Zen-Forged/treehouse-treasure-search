// app/api/vendor-request/route.ts
// POST { name, email, booth_number, mall_id, mall_name }
// → writes to vendor_requests table (Supabase, service-role to bypass RLS)
// → sends EMAIL #1 "Request received" receipt to vendor via Resend
//   (per docs/onboarding-journey.md — Sprint 4 T4a)
//
// Email is best-effort — a failed send logs but does not fail the HTTP
// response, because the vendor_requests row was successfully created and
// admin can still approve from /admin. Vendor not receiving the receipt
// email is a UX regression, not a data integrity issue.
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
import { sendRequestReceived } from "@/lib/email";

// ---------------------------------------------------------------------------
// Error logging utility
// ---------------------------------------------------------------------------
function logError(message: string, context: { ip: string; error?: any; details?: Record<string, any> }) {
  const timestamp = new Date().toISOString();
  const { ip, error, details = {} } = context;
  
  console.error(`[vendor-request] ${timestamp} - ${message}`, {
    ip,
    userAgent: context.details?.userAgent || 'unknown',
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    ...details
  });
}

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
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  if (!rateLimit(ip)) {
    logError("Rate limit exceeded", {
      ip,
      details: { userAgent, rateLimitMaxRequests: 3, rateLimitWindowMinutes: 10 }
    });
    
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json().catch((parseError) => {
      logError("JSON parse error", { 
        ip, 
        error: parseError,
        details: { userAgent, contentType: req.headers.get("content-type") }
      });
      throw new Error("Invalid JSON body");
    });
    
    const { name, email, booth_number, mall_id, mall_name } = body;

    if (!name?.trim() || !email?.trim()) {
      logError("Validation error: missing required fields", {
        ip,
        details: { 
          userAgent, 
          hasName: !!name?.trim(), 
          hasEmail: !!email?.trim(),
          boothNumber: booth_number || null,
          mallName: mall_name || null
        }
      });
      
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      logError("Validation error: invalid email format", {
        ip,
        details: { 
          userAgent, 
          emailLength: email.length,
          name: name.trim()
        }
      });
      
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const adminEmail   = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

    if (!supabaseUrl || !serviceKey) {
      logError("Configuration error: missing Supabase environment variables", {
        ip,
        error: new Error("Missing required environment variables"),
        details: { 
          userAgent,
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!serviceKey,
          hasAdminEmail: !!adminEmail
        }
      });
      
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    // Use service role to bypass RLS on vendor_requests
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const trimmedName  = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMall  = mall_name?.trim() || null;

    const insertPayload = {
      name:         trimmedName,
      email:        trimmedEmail,
      booth_number: booth_number?.trim() || null,
      mall_id:      mall_id || null,
      mall_name:    trimmedMall,
      status:       "pending",
    };

    const { error: insertError } = await supabase.from("vendor_requests").insert(insertPayload);

    if (insertError) {
      logError("Database insert error", {
        ip,
        error: insertError,
        details: { 
          userAgent,
          insertPayload: { ...insertPayload, email: "[redacted]" }, // Don't log email in error context
          errorCode: insertError.code,
          errorDetails: insertError.details,
          errorHint: insertError.hint
        }
      });
      
      return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
    }

    // Success logging
    console.log(
      `[vendor-request] ${new Date().toISOString()} - New request from ${trimmedName} (${trimmedEmail}) — ` +
      `Booth: ${booth_number || "not specified"} — Mall: ${trimmedMall || "not specified"} — IP: ${ip}`
    );

    // ── Email #1: Request received (best-effort) ──
    // Per docs/onboarding-journey.md: fires consistently for Flows 2 and 3
    // (admin-initiated and vendor-initiated). Serves as data-integrity check —
    // a typo'd email will bounce and the vendor will notice before admin
    // wastes time approving a dead-letter request.
    const emailResult = await sendRequestReceived({
      name:     trimmedName,
      email:    trimmedEmail,
      mallName: trimmedMall,
    });

    if (!emailResult.ok) {
      // Log but don't fail the request — the vendor_requests row is already
      // saved and the admin can still approve from /admin.
      logError("Request received email failed to send", {
        ip,
        error: emailResult.error,
        details: { userAgent, vendorEmail: trimmedEmail },
      });
    }

    return NextResponse.json({ ok: true });
    
  } catch (err) {
    logError("Unexpected error", {
      ip,
      error: err,
      details: { userAgent }
    });
    
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
