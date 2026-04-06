import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return NextResponse.json({
    // Supabase
    hasSupabaseUrl:   !!supabaseUrl,
    hasSupabaseAnon:  !!supabaseAnon,
    supabaseUrlHost:  supabaseUrl ? new URL(supabaseUrl).hostname : "not set",
    supabaseAnonLen:  supabaseAnon.length,
    // AI / comps
    hasAnthropicKey:  !!process.env.ANTHROPIC_API_KEY,
    hasSerpApiKey:    !!process.env.SERPAPI_KEY,
    compSource:       process.env.COMP_SOURCE ?? "not set",
    hasApifyToken:    !!process.env.APIFY_TOKEN,
  });
}
