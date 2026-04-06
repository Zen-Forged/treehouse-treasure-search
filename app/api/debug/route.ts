import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const sb = createClient(url, anon);

  // Test 1: read malls
  const { data: malls, error: mallsErr } = await sb
    .from("malls")
    .select("id,name")
    .limit(1);

  // Test 2: dummy insert to check posts RLS
  const { data: postTest, error: postErr } = await sb
    .from("posts")
    .insert([{
      vendor_id: "00000000-0000-0000-0000-000000000000",
      mall_id:   "00000000-0000-0000-0000-000000000000",
      title:     "__rls_test__",
      status:    "available",
    }])
    .select("id")
    .single();

  // Clean up if row was created
  const testId = (postTest as { id?: string } | null)?.id;
  if (testId) {
    await sb.from("posts").delete().eq("id", testId);
  }

  return NextResponse.json({
    env: {
      hasUrl:     !!url,
      hasAnon:    !!anon,
      anonPrefix: anon.slice(0, 30),
    },
    malls: {
      ok:    !mallsErr,
      data:  malls,
      error: mallsErr?.message ?? null,
      code:  mallsErr?.code   ?? null,
    },
    postInsert: {
      ok:      !postErr,
      error:   postErr?.message ?? null,
      code:    postErr?.code    ?? null,
      hint:    postErr?.hint    ?? null,
      details: postErr?.details ?? null,
    },
  });
}
