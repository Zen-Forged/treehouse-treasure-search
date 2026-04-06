import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const sb   = createClient(url, anon);

  // 1. Read malls
  const { data: malls, error: mallsErr } = await sb
    .from("malls").select("id,name").limit(3);

  const mallId = (malls as { id: string }[] | null)?.[0]?.id ?? null;

  // 2. Test vendor insert with real mall_id
  const testSlug = "debug-test-" + Date.now();
  const { data: vendorTest, error: vendorErr } = await sb
    .from("vendors")
    .insert([{ mall_id: mallId, display_name: "__debug__", slug: testSlug }])
    .select("id")
    .single();

  const vendorId = (vendorTest as { id?: string } | null)?.id ?? null;

  // 3. Test post insert with real vendor_id (if vendor created)
  let postErr = null;
  let postOk  = false;
  if (vendorId && mallId) {
    const { error: pe } = await sb
      .from("posts")
      .insert([{ vendor_id: vendorId, mall_id: mallId, title: "__debug__", status: "available" }])
      .select("id").single();
    postErr = pe;
    postOk  = !pe;
  }

  // 4. Clean up
  if (vendorId) await sb.from("vendors").delete().eq("id", vendorId);

  return NextResponse.json({
    env:          { hasUrl: !!url, hasAnon: !!anon, anonPrefix: anon.slice(0, 30) },
    malls:        { ok: !mallsErr, data: malls, error: mallsErr?.message ?? null },
    vendorInsert: { ok: !vendorErr, mallIdUsed: mallId, error: vendorErr?.message ?? null, code: vendorErr?.code ?? null, details: vendorErr?.details ?? null, hint: vendorErr?.hint ?? null },
    postInsert:   { ok: postOk, skipped: !vendorId, error: (postErr as { message?: string } | null)?.message ?? null, code: (postErr as { code?: string } | null)?.code ?? null },
  });
}
