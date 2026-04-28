// app/api/share-booth/route.ts
// Window share email endpoint.
//
// POST { recipientEmail, activeVendorId }
//   → rate-limit by IP (cap depends on auth mode, see below)
//   → branch on Authorization header presence:
//       • header present → requireAuth → vendor/admin path (ownership check)
//       • header absent  → anonymous shopper path (no ownership check)
//   → validate email RFC shape + UUID format
//   → per-recipient dedup (60s)
//   → load vendor (+ mall) + 6 most-recent available posts
//   → empty-window guard (409)
//   → sendBoothWindow() via Resend, senderMode differs per branch
//
// ─── Auth branch history ─────────────────────────────────────────────────────
// Session 39 (Q-007): launched with requireAuth hard-gated — vendors only.
// Session 45 (Q-009): admin bypass added (NEXT_PUBLIC_ADMIN_EMAIL match).
// Session 50 (Q-008): anonymous shopper path added. Shoppers viewing a public
//   /shelf/[slug] can now share the booth with a friend without signing in.
//   Tighter rate limit (2/10min) and no ownership check; dedup + empty-window
//   guard still apply. Sender voice line is dropped per build-spec decision
//   3(a) — anonymous shares omit the "{X} sent you a Window..." attribution
//   because the shopper, not the vendor, is the sender and forging vendor
//   attribution would be dishonest.
//
// ─── Rate-limit design ───────────────────────────────────────────────────────
// Two IP maps, one per branch, with independent quotas:
//   • auth branch: 5 per 10 min (existing; a vendor demoing back-to-back)
//   • anon branch: 2 per 10 min (tighter; shoppers need fewer sends, and the
//     anon path has less abuse friction)
// Separate namespaces ensure a vendor's quota isn't consumed by anonymous
// traffic from the same household IP and vice versa.
//
// Both maps are process-local. Per build-spec §Out of scope, a Supabase
// share_events audit table is Sprint 6+ — moving rate-limit + dedup there
// would also unlock analytics, which is valuable but not beta-gating.

import { NextResponse } from "next/server";
import { requireAuth, getServiceClient } from "@/lib/adminAuth";
import { sendBoothWindow } from "@/lib/email";
import { getVendorWindowPosts } from "@/lib/posts";
import { recordEvent } from "@/lib/events";
import type { Vendor, Mall } from "@/types/treehouse";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ─── Error logging utility ───────────────────────────────────────────────────
function logError(
  message: string,
  context: { ip: string; error?: unknown; details?: Record<string, unknown> },
) {
  const timestamp = new Date().toISOString();
  const { ip, error, details = {} } = context;

  console.error(`[share-booth] ${timestamp} - ${message}`, {
    ip,
    error: error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error,
    ...details,
  });
}

// ─── Rate limit ──────────────────────────────────────────────────────────────
const AUTH_RATE_LIMIT_MAX   = 5;
const ANON_RATE_LIMIT_MAX   = 2;
const RATE_LIMIT_WINDOW_MS  = 10 * 60_000; // 10 min
const authRateLimitAttempts = new Map<string, { count: number; reset: number }>();
const anonRateLimitAttempts = new Map<string, { count: number; reset: number }>();

function rateLimit(
  ip: string,
  mode: "auth" | "anon",
): boolean {
  const bucket = mode === "auth" ? authRateLimitAttempts : anonRateLimitAttempts;
  const max    = mode === "auth" ? AUTH_RATE_LIMIT_MAX : ANON_RATE_LIMIT_MAX;
  const now    = Date.now();
  const entry  = bucket.get(ip);
  if (!entry || entry.reset < now) {
    bucket.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// ─── Per-recipient dedup (60s) ───────────────────────────────────────────────
const DEDUP_WINDOW_MS = 60_000;
const recentSends = new Map<string, number>();

function dedupBlock(vendorId: string, recipientEmail: string): boolean {
  const key  = `${vendorId}:${recipientEmail.toLowerCase()}`;
  const now  = Date.now();
  const last = recentSends.get(key);
  if (last && (now - last) < DEDUP_WINDOW_MS) return true;
  recentSends.set(key, now);
  if (recentSends.size > 500) {
    recentSends.forEach((ts, k) => {
      if (now - ts > DEDUP_WINDOW_MS * 2) recentSends.delete(k);
    });
  }
  return false;
}

// ─── Validation regexes ──────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── POST handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const ip         = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  const hasAuthHeader = !!(req.headers.get("authorization") ?? req.headers.get("Authorization"));

  // ── Branch on auth header presence ───────────────────────────────────────
  // hasAuthHeader determines which rate-limit bucket and which downstream
  // path we take. A malformed/expired token on the "auth" branch will 401
  // via requireAuth below — we don't silently fall through to the anon
  // path, because that would obscure token errors for genuine vendors.
  const mode: "auth" | "anon" = hasAuthHeader ? "auth" : "anon";

  // Rate limit BEFORE any DB/auth work so hostile floods don't hit Supabase.
  if (!rateLimit(ip, mode)) {
    logError("Rate limit exceeded", { ip, details: { mode } });
    return NextResponse.json(
      { ok: false, error: "Too many sends — try again in a few minutes." },
      { status: 429 },
    );
  }

  // ── Auth + service client resolution per branch ──────────────────────────
  let service: SupabaseClient;
  let user: User | null = null;
  let isAdminCaller = false;

  if (mode === "auth") {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    service = auth.service;
    user    = auth.user;
    isAdminCaller = !!adminEmail
      && !!user.email
      && user.email.toLowerCase() === adminEmail.toLowerCase();
  } else {
    const anonService = getServiceClient();
    if (!anonService) {
      logError("Service client unavailable for anon path", { ip });
      return NextResponse.json(
        { ok: false, error: "Service unavailable." },
        { status: 503 },
      );
    }
    service = anonService;
  }

  // ── Parse + validate body ────────────────────────────────────────────────
  let body: { recipientEmail?: unknown; activeVendorId?: unknown };
  try {
    body = await req.json();
  } catch (parseErr) {
    logError("JSON parse error", { ip, error: parseErr });
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const recipientRaw = typeof body.recipientEmail === "string" ? body.recipientEmail.trim() : "";
  const vendorIdRaw  = typeof body.activeVendorId === "string" ? body.activeVendorId.trim() : "";

  if (!recipientRaw || !EMAIL_REGEX.test(recipientRaw)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (!vendorIdRaw || !UUID_REGEX.test(vendorIdRaw)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid booth id." },
      { status: 400 },
    );
  }

  const recipientEmail = recipientRaw.toLowerCase();
  const activeVendorId = vendorIdRaw;

  // ── Per-recipient dedup ──────────────────────────────────────────────────
  if (dedupBlock(activeVendorId, recipientEmail)) {
    logError("Per-recipient dedup block", {
      ip,
      details: { vendorId: activeVendorId, recipientMasked: maskEmail(recipientEmail), mode },
    });
    return NextResponse.json(
      { ok: false, error: "Already sent to that address a moment ago — give it a minute." },
      { status: 429 },
    );
  }

  // ── Load vendor (with mall) ──────────────────────────────────────────────
  // Auth branch: enforce ownership unless admin.
  // Anon branch: load by id alone — no ownership concept without a session.
  const vendorQuery = service
    .from("vendors")
    .select(`
      id, display_name, booth_number, slug, hero_image_url, mall_id,
      mall:malls ( id, name, address, google_maps_url )
    `)
    .eq("id", activeVendorId);

  const finalQuery = (mode === "auth" && !isAdminCaller)
    ? vendorQuery.eq("user_id", user!.id)
    : vendorQuery;

  const { data: vendorRecord, error: vendorErr } = await finalQuery.maybeSingle();

  if (vendorErr) {
    logError("Vendor lookup failed", { ip, error: vendorErr, details: { mode } });
    return NextResponse.json(
      { ok: false, error: "Could not load this booth." },
      { status: 500 },
    );
  }

  if (!vendorRecord) {
    // Auth non-admin: don't leak whether the vendor exists — 403 for any
    // non-owned id. Admin + anon: 404 (vendor genuinely not found).
    if (mode === "auth" && !isAdminCaller) {
      logError("Ownership check rejected", {
        ip,
        details: { userId: user!.id, attemptedVendorId: activeVendorId },
      });
      return NextResponse.json(
        { ok: false, error: "You don't own this booth." },
        { status: 403 },
      );
    }
    logError("Vendor not found", {
      ip,
      details: { attemptedVendorId: activeVendorId, mode, isAdminCaller },
    });
    return NextResponse.json(
      { ok: false, error: "Booth not found." },
      { status: 404 },
    );
  }

  // ── Load Window posts (6 most recent available) ─────────────────────────
  const posts = await getVendorWindowPosts(activeVendorId);

  if (posts.length === 0) {
    logError("Empty-window send rejected", {
      ip,
      details: { vendorId: activeVendorId, vendorName: vendorRecord.display_name, mode },
    });
    return NextResponse.json(
      { ok: false, error: "empty_window" },
      { status: 409 },
    );
  }

  // ── Shape payload for sendBoothWindow ────────────────────────────────────
  const vendorRow = vendorRecord as unknown as (Vendor & { mall: Mall | Mall[] | null });
  const mallRow: Mall | null = Array.isArray(vendorRow.mall)
    ? (vendorRow.mall[0] ?? null)
    : vendorRow.mall;

  if (!mallRow) {
    logError("Vendor has no mall join — misconfigured row", {
      ip,
      details: { vendorId: activeVendorId },
    });
    return NextResponse.json(
      { ok: false, error: "This booth is missing its location. Contact admin." },
      { status: 500 },
    );
  }

  const emailResult = await sendBoothWindow({
    recipientEmail,
    // Auth path preserves the vendor-as-sender voice. Anon path drops it —
    // senderFirstName is ignored downstream when senderMode is "anonymous".
    senderFirstName: vendorRow.display_name,
    senderMode:      mode === "auth" ? "vendor" : "anonymous",
    vendor: {
      displayName:  vendorRow.display_name,
      boothNumber:  vendorRow.booth_number,
      heroImageUrl: vendorRow.hero_image_url,
      slug:         vendorRow.slug,
    },
    mall: {
      name:          mallRow.name,
      address:       mallRow.address,
      googleMapsUrl: mallRow.google_maps_url ?? null,
    },
    posts: posts.map(p => ({
      id:       p.id,
      title:    p.title,
      imageUrl: p.image_url,
    })),
  });

  if (!emailResult.ok) {
    logError("sendBoothWindow failed", {
      ip,
      error: emailResult.error,
      details: {
        vendorSlug:      vendorRow.slug,
        recipientMasked: maskEmail(recipientEmail),
        mode,
      },
    });
    return NextResponse.json(
      { ok: false, error: "Could not send. Please try again in a minute." },
      { status: 502 },
    );
  }

  // Success log — mode distinguishes anon from vendor from admin-bypass.
  const actor = mode === "auth"
    ? `${user!.email ?? user!.id}${isAdminCaller ? " (admin-bypass)" : ""}`
    : "anonymous";
  console.log(
    `[share-booth] ${new Date().toISOString()} - Window sent — ` +
    `from=${vendorRow.slug} to=${maskEmail(recipientEmail)} ` +
    `actor=${actor} posts=${posts.length}`,
  );

  // R3 — analytics event. recipient email is NOT captured (PII per D3).
  // auth_mode mirrors the existing rate-limit / sender-voice branching.
  // Diagnostic log added session 58 after the first prod QA showed
  // share_sent count stuck at 0 — log lets us verify the call is reached.
  console.log(`[share-booth] recording share_sent event — vendor=${vendorRow.slug} mode=${mode}`);
  await recordEvent("share_sent", {
    user_id: user?.id ?? null,
    payload: {
      vendor_slug:     vendorRow.slug,
      auth_mode:       mode === "auth" ? (isAdminCaller ? "admin" : "authed") : "anon",
      recipient_count: 1,
      post_count:      posts.length,
    },
  });

  return NextResponse.json({ ok: true });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
