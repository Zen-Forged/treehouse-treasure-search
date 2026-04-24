// app/api/admin/malls/route.ts
// R4c (session 57) — admin-gated endpoint for toggling a mall's lifecycle
// status between draft / coming_soon / active.
//
// Design record: docs/r4c-mall-active-design.md §API route.
//
// Semantics:
//   - PATCH { id, status } → updates malls.status for the given row.
//   - If the new status is 'active' AND activated_at is currently null,
//     also sets activated_at = now() in the same UPDATE. Never cleared on
//     deactivation — activated_at is a one-way "has this mall ever been
//     live" signal that R3 analytics will layer events on top of.
//   - No GET route. /admin reads via the browser anon client through
//     getAllMalls() (public SELECT RLS policy already returns status +
//     activated_at without additional work).

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["draft", "coming_soon", "active"] as const;
type MallStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: { id?: string; status?: string };
  try {
    body = (await req.json()) as { id?: string; status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const id = body.id?.trim();
  const status = body.status?.trim() as MallStatus | undefined;

  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  // Read the current row so we can decide whether this is the first
  // transition to 'active' (and therefore whether to stamp activated_at).
  const { data: current, error: fetchErr } = await auth.service
    .from("malls")
    .select("id, status, activated_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/malls PATCH] fetch:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: "Mall not found." }, { status: 404 });
  }

  const stampActivatedAt = status === "active" && !current.activated_at;

  const update: { status: MallStatus; activated_at?: string } = { status };
  if (stampActivatedAt) update.activated_at = new Date().toISOString();

  const { data: updated, error: updateErr } = await auth.service
    .from("malls")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (updateErr) {
    console.error("[admin/malls PATCH] update:", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  console.log("[admin/malls PATCH] updated", {
    id,
    status,
    stampedActivatedAt: stampActivatedAt,
  });

  return NextResponse.json({ ok: true, mall: updated });
}
