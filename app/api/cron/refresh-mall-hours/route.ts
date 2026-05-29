// app/api/cron/refresh-mall-hours/route.ts
// Session 203 — Location hours Shape B Arc 2. Weekly Vercel cron (D2) that
// mirrors merchant-maintained hours from Google Places into malls.hours_json.
// Design: docs/location-hours-design.md.
//
// Schedule lives in vercel.json ("0 8 * * 1" — Mondays 08:00 UTC).
//
// Auth (D12): Vercel cron sends `Authorization: Bearer <CRON_SECRET>` when the
// CRON_SECRET env var is set. We reject anything else so the route can't be
// triggered by the public. (HITL: add CRON_SECRET to Vercel env — see the
// session-203 notes.)
//
// "Open now" is NOT computed or stored here — only the raw hours_json +
// timezone + businessStatus. The badge computes open/closed at display time
// from this data against the current moment (D8).

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/adminAuth";
import { fetchPlaceHours, toHoursUpdate } from "@/lib/googlePlaces";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = getServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "service client unavailable" }, { status: 500 });
  }

  const { data: malls, error } = await svc
    .from("malls")
    .select("id, name, place_id")
    .eq("status", "active")
    .not("place_id", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  let updated = 0;
  const failures: { name: string; error: string }[] = [];

  for (const m of malls ?? []) {
    try {
      const result = await fetchPlaceHours(m.place_id as string);
      const { error: upErr } = await svc
        .from("malls")
        .update(toHoursUpdate(result, nowIso))
        .eq("id", m.id);
      if (upErr) failures.push({ name: m.name as string, error: upErr.message });
      else updated++;
    } catch (e) {
      failures.push({ name: m.name as string, error: (e as Error).message });
    }
  }

  return NextResponse.json({
    ran_at: nowIso,
    total: malls?.length ?? 0,
    updated,
    failed: failures.length,
    failures,
  });
}
