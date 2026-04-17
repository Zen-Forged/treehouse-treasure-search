// app/api/admin/diagnose-request/route.ts
// Admin-gated diagnostic endpoint.
//
// POST { requestId } → returns full collision picture for a vendor_request:
//   - the request row itself
//   - any vendor rows matching (mall_id, booth_number) — booth collision
//   - any vendor rows matching display_name at that mall — slug collision
//   - any auth.users row for the request's email
//   - a computed diagnosis code + human-readable suggested action
//
// Exists because the /api/admin/vendor-requests approve path used to fail
// with generic "Vendor exists but couldn't be loaded" that gave admin zero
// visibility into what actually collided. This is the in-mall triage
// surface — admin taps "Diagnose" on a failed approval and sees specifics
// in 3 seconds instead of running 4 SQL queries.
//
// Added session 13 (2026-04-17) as part of KI-004 resolution.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

type DiagnosisCode =
  | "no_conflict"                // nothing blocks approval — should succeed
  | "booth_unlinked_name_match"  // safe claim: booth taken by unlinked row with same name
  | "booth_unlinked_name_diff"   // same booth, unlinked, DIFFERENT name → rename needed
  | "booth_already_claimed"      // booth taken by a linked user → hard block
  | "slug_collision"             // name collision → slug would duplicate
  | "already_approved"           // request is already approved
  | "missing_mall"               // request has no mall_id
  | "other";

interface VendorSnapshot {
  id:           string;
  display_name: string;
  booth_number: string | null;
  slug:         string;
  user_id:      string | null;
  mall_id:      string;
  created_at:   string;
}

interface RequestSnapshot {
  id:           string;
  name:         string;
  email:        string;
  booth_number: string | null;
  mall_id:      string | null;
  mall_name:    string | null;
  status:       string;
  created_at:   string;
}

interface AuthUserSnapshot {
  id:                 string;
  email:              string;
  email_confirmed_at: string | null;
  last_sign_in_at:    string | null;
  created_at:         string;
}

interface DiagnoseResponse {
  request: RequestSnapshot;
  conflicts: {
    booth_collision: VendorSnapshot[];
    name_collision:  VendorSnapshot[];
    auth_user:       AuthUserSnapshot | null;
  };
  diagnosis:        DiagnosisCode;
  suggested_action: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function pickVendorFields(row: any): VendorSnapshot {
  return {
    id:           row.id,
    display_name: row.display_name,
    booth_number: row.booth_number,
    slug:         row.slug,
    user_id:      row.user_id,
    mall_id:      row.mall_id,
    created_at:   row.created_at,
  };
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: { requestId?: string };
  try {
    body = (await req.json()) as { requestId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.requestId) {
    return NextResponse.json({ error: "Missing requestId." }, { status: 400 });
  }

  // 1. Fetch the request
  const { data: request, error: fetchErr } = await auth.service
    .from("vendor_requests")
    .select("*")
    .eq("id", body.requestId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/diagnose-request] fetch:", fetchErr.message);
    return NextResponse.json(
      { error: `Failed to fetch request: ${fetchErr.message}` },
      { status: 500 }
    );
  }

  if (!request) {
    return NextResponse.json(
      { error: "Vendor request not found." },
      { status: 404 }
    );
  }

  // 2. Booth collision — any vendor at (mall_id, booth_number)
  let boothCollision: VendorSnapshot[] = [];
  if (request.mall_id && request.booth_number) {
    const { data: boothRows, error: boothErr } = await auth.service
      .from("vendors")
      .select("id, display_name, booth_number, slug, user_id, mall_id, created_at")
      .eq("mall_id", request.mall_id)
      .eq("booth_number", request.booth_number);

    if (boothErr) {
      console.error("[admin/diagnose-request] booth lookup:", boothErr.message);
    } else {
      boothCollision = (boothRows ?? []).map(pickVendorFields);
    }
  }

  // 3. Name collision — any vendor at this mall with matching slug
  //    (display_name is the human-facing match; slug is what the unique
  //    constraint actually checks. We report by slug because that's what
  //    would fire 23505 on insert.)
  const proposedSlug = slugify(request.name);
  let nameCollision: VendorSnapshot[] = [];
  if (proposedSlug) {
    const { data: slugRows, error: slugErr } = await auth.service
      .from("vendors")
      .select("id, display_name, booth_number, slug, user_id, mall_id, created_at")
      .eq("slug", proposedSlug);

    if (slugErr) {
      console.error("[admin/diagnose-request] slug lookup:", slugErr.message);
    } else {
      nameCollision = (slugRows ?? []).map(pickVendorFields);
    }
  }

  // 4. Auth user lookup by email
  let authUser: AuthUserSnapshot | null = null;
  if (request.email) {
    // Supabase admin API — listUsers is the only way to look up by email
    // from service role. We filter client-side since the admin API doesn't
    // support email-exact filter in a single round trip.
    const { data: usersPage, error: usersErr } = await auth.service.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // generous — we'll rarely exceed this in a single project
    });

    if (usersErr) {
      console.error("[admin/diagnose-request] auth.users lookup:", usersErr.message);
    } else {
      const targetEmail = request.email.trim().toLowerCase();
      const match = usersPage.users.find(
        (u) => (u.email ?? "").trim().toLowerCase() === targetEmail
      );
      if (match) {
        authUser = {
          id:                 match.id,
          email:              match.email ?? "",
          email_confirmed_at: match.email_confirmed_at ?? null,
          last_sign_in_at:    match.last_sign_in_at ?? null,
          created_at:         match.created_at,
        };
      }
    }
  }

  // 5. Compute diagnosis
  let diagnosis: DiagnosisCode = "no_conflict";
  let suggested_action = "Approval should succeed. Try again.";

  if (request.status === "approved") {
    diagnosis = "already_approved";
    suggested_action = "Request is already approved. Check the vendors table for the linked row.";
  } else if (!request.mall_id) {
    diagnosis = "missing_mall";
    suggested_action = "Request has no mall_id. Cannot create vendor. Resubmit with a valid mall.";
  } else if (boothCollision.length > 0) {
    const boothRow = boothCollision[0];
    if (boothRow.user_id) {
      diagnosis = "booth_already_claimed";
      suggested_action = `Booth ${request.booth_number} at this mall is already claimed by ${boothRow.display_name} (linked to a user). Pick a different booth number, or unlink the existing claim via SQL.`;
    } else if (boothRow.display_name === request.name) {
      diagnosis = "booth_unlinked_name_match";
      suggested_action = `An unlinked vendor row already exists at this booth with a matching name. Approval should safely claim it.`;
    } else {
      diagnosis = "booth_unlinked_name_diff";
      suggested_action = `Booth ${request.booth_number} at this mall has an unlinked vendor named "${boothRow.display_name}" — different from this request ("${request.name}"). Either rename the request to match, or clean up the stale row via SQL.`;
    }
  } else if (nameCollision.length > 0) {
    diagnosis = "slug_collision";
    const existingVendor = nameCollision[0];
    suggested_action = `Slug "${proposedSlug}" is already taken by an existing vendor (${existingVendor.display_name}). Approval will auto-append a suffix (e.g. "${proposedSlug}-2") to avoid the collision.`;
  }

  const response: DiagnoseResponse = {
    request: {
      id:           request.id,
      name:         request.name,
      email:        request.email,
      booth_number: request.booth_number,
      mall_id:      request.mall_id,
      mall_name:    request.mall_name,
      status:       request.status,
      created_at:   request.created_at,
    },
    conflicts: {
      booth_collision: boothCollision,
      name_collision:  nameCollision,
      auth_user:       authUser,
    },
    diagnosis,
    suggested_action,
  };

  return NextResponse.json(response);
}
