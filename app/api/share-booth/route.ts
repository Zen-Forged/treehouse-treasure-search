// app/api/share-booth/route.ts
// Window share email endpoint (Q-007, session 39).
//
// POST { recipientEmail, activeVendorId }
//   → requireAuth (bearer token)
//   → validate email RFC shape + UUID format
//   → rate-limit by IP (5 sends per 10 min, in-memory Map — mirrors /api/vendor-request)
//   → per-recipient dedup (60s in-memory guard keyed on activeVendorId + recipientEmail)
//   → ownership check: signed-in user must own activeVendorId (via vendors.user_id)
//     — OR admin bypass (session 45, Q-009): email matches NEXT_PUBLIC_ADMIN_EMAIL,
//       in which case we load the vendor by id alone. Admin-sent Windows still
//       attribute to vendor.display_name as the sender per David's session-45 call
//       ("ZenForged Finds sent you a Window into ZenForged Finds" — reads as
//       "from the booth" rather than "from the admin personally").
//   → load vendor (with mall) + 6 most-recent available posts
//   → empty-window guard: 409 Conflict if posts.length === 0
//   → sendBoothWindow(...) via Resend
//
// Auth pattern mirrors /api/setup/lookup-vendor (requireAuth → auth.service),
// not /api/vendor-request's service-role-per-call pattern. The two reference
// routes established this split: unauthenticated public writes build their
// own service client; authenticated user actions use requireAuth's context.
//
// Rate-limit + dedup are process-local (Map-based). That's fine for MVP on a
// single Vercel function instance — the vendor-facing load is tiny. When /my-
// shelf scales horizontally enough that rate-limit collisions matter, move
// both to Supabase (a share_events audit table would solve dedup + analytics
// + abuse visibility in one migration). Spec §Out of scope: audit table is
// Sprint 6+.
//
// Build-spec §Unresolved build-time decisions taken here:
//   1. Pronoun dropped \u2014 voice line uses vendor name instead
//      ("Sarah sent you a Window into ZenForged Finds."). Matches subject
//      pattern. No schema change, no guessing.
//   2. Sender first name source \u2014 vendor.display_name for MVP. Ownership
//      check guarantees the signed-in user owns the booth being shared, so
//      "vendor shares their own booth" is the only path that reaches here.
//      Session 45 Q-009: admin can now also reach here; admin sends still
//      attribute to vendor.display_name (David's explicit call at session-45).
//   3. Title truncation \u2014 handled downstream in renderWindowGrid via
//      max-height + overflow on the caption paragraph. No truncation here.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminAuth";
import { sendBoothWindow } from "@/lib/email";
import { getVendorWindowPosts } from "@/lib/posts";
import type { Vendor, Mall } from "@/types/treehouse";

export const dynamic = "force-dynamic";

// \u2500\u2500\u2500 Error logging utility (mirrors /api/vendor-request) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

// \u2500\u2500\u2500 Rate limit (5 sends / 10 min per IP) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Matches the pattern in /api/vendor-request but with a looser count (5 vs 3)
// per build-spec \u00a7Rate limiting + abuse. A vendor doing a walk-up demo may
// legitimately share with 3\u20135 people back-to-back.
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 10 * 60_000; // 10 min
const rateLimitAttempts = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = rateLimitAttempts.get(ip);
  if (!entry || entry.reset < now) {
    rateLimitAttempts.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// \u2500\u2500\u2500 Per-recipient dedup (60s guard) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Prevents accidental double-tap double-sends if the client CTA disable
// timing glitches. Keyed on activeVendorId + recipientEmail so independent
// sends to different people aren't blocked.
const DEDUP_WINDOW_MS = 60_000;
const recentSends = new Map<string, number>(); // key: `${vendorId}:${email}`, value: timestamp

function dedupBlock(vendorId: string, recipientEmail: string): boolean {
  const key    = `${vendorId}:${recipientEmail.toLowerCase()}`;
  const now    = Date.now();
  const last   = recentSends.get(key);
  if (last && (now - last) < DEDUP_WINDOW_MS) return true;
  recentSends.set(key, now);
  // Opportunistic cleanup: if the map gets big, prune entries older than 2x window.
  // Map.forEach avoids the `for...of Map` downlevelIteration requirement
  // (tsconfig target is below es2015 in this repo).
  if (recentSends.size > 500) {
    recentSends.forEach((ts, k) => {
      if (now - ts > DEDUP_WINDOW_MS * 2) recentSends.delete(k);
    });
  }
  return false;
}

// \u2500\u2500\u2500 Validation regexes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Same email regex as /api/vendor-request (build-spec \u00a73 requires matching).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// \u2500\u2500\u2500 POST handler \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export async function POST(req: Request) {
  const ip        = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

  // Rate limit BEFORE auth so hostile unauthenticated floods don't hit the DB.
  if (!rateLimit(ip)) {
    logError("Rate limit exceeded", { ip });
    return NextResponse.json(
      { ok: false, error: "Too many sends \u2014 try again in a few minutes." },
      { status: 429 },
    );
  }

  // \u2500\u2500 Auth \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Session 45 (Q-009) \u2014 admin bypass. Match pattern from requireAdmin in
  // lib/adminAuth.ts: compare lowercased user email to NEXT_PUBLIC_ADMIN_EMAIL.
  // When true, the ownership filter below uses vendor id alone instead of
  // (id, user_id). Admin can share ANY booth \u2014 Flow 1 pre-seeded, any
  // vendor's shelf they're viewing via /shelf/[slug], etc.
  const isAdminCaller = !!adminEmail
    && !!auth.user.email
    && auth.user.email.toLowerCase() === adminEmail.toLowerCase();

  // \u2500\u2500 Parse + validate body \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 Per-recipient dedup (post-validation, pre-DB) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  if (dedupBlock(activeVendorId, recipientEmail)) {
    logError("Per-recipient dedup block", {
      ip,
      details: { vendorId: activeVendorId, recipientMasked: maskEmail(recipientEmail) },
    });
    return NextResponse.json(
      { ok: false, error: "Already sent to that address a moment ago \u2014 give it a minute." },
      { status: 429 },
    );
  }

  // \u2500\u2500 Ownership check: signed-in user must own the vendor \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Session 45 (Q-009) \u2014 admin branch bypasses the user_id filter. Vendors
  // still see their booths only, admins see any. Shape of the select is
  // identical so nothing downstream cares which branch produced ownedVendor.
  const ownershipQuery = auth.service
    .from("vendors")
    .select(`
      id, display_name, booth_number, slug, hero_image_url, mall_id,
      mall:malls ( id, name, address, google_maps_url )
    `)
    .eq("id", activeVendorId);

  const { data: ownedVendor, error: ownershipErr } = await (
    isAdminCaller ? ownershipQuery : ownershipQuery.eq("user_id", auth.user.id)
  ).maybeSingle();

  if (ownershipErr) {
    logError("Ownership lookup failed", { ip, error: ownershipErr });
    return NextResponse.json(
      { ok: false, error: "Could not verify booth ownership." },
      { status: 500 },
    );
  }

  if (!ownedVendor) {
    // Don't leak whether the vendor exists at all \u2014 403 for any non-owned id.
    // Admin hitting 404 here is also 403 to keep the response shape identical
    // from the client's point of view; admin shouldn't be querying invalid
    // vendor ids in practice.
    logError("Ownership check rejected", {
      ip,
      details: {
        userId: auth.user.id,
        attemptedVendorId: activeVendorId,
        isAdminCaller,
      },
    });
    return NextResponse.json(
      { ok: false, error: isAdminCaller ? "Booth not found." : "You don't own this booth." },
      { status: isAdminCaller ? 404 : 403 },
    );
  }

  // \u2500\u2500 Load Window posts (6 most recent available) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const posts = await getVendorWindowPosts(activeVendorId);

  // Empty-window guard (build-spec \u00a71 step 7). Client should never reach here
  // because the share icon is hidden when posts.length < 1, but defense in
  // depth prevents a malformed direct POST from firing a blank email.
  if (posts.length === 0) {
    logError("Empty-window send rejected", {
      ip,
      details: { vendorId: activeVendorId, vendorName: ownedVendor.display_name },
    });
    return NextResponse.json(
      { ok: false, error: "empty_window" },
      { status: 409 },
    );
  }

  // \u2500\u2500 Shape payload for sendBoothWindow \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Supabase nested selects return the joined row as either a single object
  // or an array depending on the schema relationship cardinality. For a
  // belongsTo (vendors.mall_id \u2192 malls.id) it returns a single object, but
  // the generated type can be ambiguous; normalize here.
  const vendorRow = ownedVendor as unknown as (Vendor & { mall: Mall | Mall[] | null });
  const mallRow: Mall | null = Array.isArray(vendorRow.mall)
    ? (vendorRow.mall[0] ?? null)
    : vendorRow.mall;

  if (!mallRow) {
    logError("Vendor has no mall join \u2014 misconfigured row", {
      ip,
      details: { vendorId: activeVendorId },
    });
    return NextResponse.json(
      { ok: false, error: "This booth is missing its mall. Contact admin." },
      { status: 500 },
    );
  }

  const emailResult = await sendBoothWindow({
    recipientEmail,
    senderFirstName: vendorRow.display_name, // MVP: sender = vendor (ownership enforced, admin bypass preserves voice)
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
        adminEmail,
      },
    });
    return NextResponse.json(
      { ok: false, error: "Could not send. Please try again in a minute." },
      { status: 502 },
    );
  }

  // Success log: admin email for context, vendor slug, truncated recipient,
  // admin-bypass flag so logs distinguish admin sends from vendor sends.
  console.log(
    `[share-booth] ${new Date().toISOString()} - Window sent \u2014 ` +
    `from=${vendorRow.slug} to=${maskEmail(recipientEmail)} ` +
    `user=${auth.user.email ?? auth.user.id}${isAdminCaller ? " (admin-bypass)" : ""} ` +
    `posts=${posts.length}`,
  );

  return NextResponse.json({ ok: true });
}

// \u2500\u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
