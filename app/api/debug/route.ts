import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Error logging utility
// ---------------------------------------------------------------------------
function logError(message: string, context: { error?: any; details?: Record<string, any> }) {
  const timestamp = new Date().toISOString();
  const { error, details = {} } = context;
  
  console.error(`[debug] ${timestamp} - ${message}`, {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    ...details
  });
}

export async function GET() {
  try {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

    if (!url || !anon) {
      logError("Configuration error: missing Supabase environment variables", {
        details: {
          hasUrl: !!url,
          hasAnon: !!anon,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }

    const sb = createClient(url, anon);

    // 1. Read malls
    const { data: malls, error: mallsErr } = await sb
      .from("malls").select("id,name").limit(3);

    if (mallsErr) {
      logError("Malls query error", { 
        error: mallsErr,
        details: { 
          code: mallsErr.code,
          details: mallsErr.details,
          hint: mallsErr.hint
        }
      });
    }

    const mallId = (malls as { id: string }[] | null)?.[0]?.id ?? null;

    // 2. Test vendor insert with real mall_id
    const testSlug = "debug-test-" + Date.now();
    const { data: vendorTest, error: vendorErr } = await sb
      .from("vendors")
      .insert([{ mall_id: mallId, display_name: "__debug__", slug: testSlug }])
      .select("id")
      .single();

    if (vendorErr) {
      logError("Vendor insert test error", { 
        error: vendorErr,
        details: { 
          mallId,
          testSlug,
          code: vendorErr.code,
          details: vendorErr.details,
          hint: vendorErr.hint
        }
      });
    }

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
      
      if (pe) {
        logError("Post insert test error", { 
          error: pe,
          details: { 
            vendorId,
            mallId,
            code: (pe as any).code,
            details: (pe as any).details,
            hint: (pe as any).hint
          }
        });
      }
    }

    // 4. Clean up
    if (vendorId) {
      const { error: cleanupError } = await sb.from("vendors").delete().eq("id", vendorId);
      if (cleanupError) {
        logError("Cleanup error", { 
          error: cleanupError,
          details: { vendorId }
        });
      }
    }

    return NextResponse.json({
      env:          { hasUrl: !!url, hasAnon: !!anon, anonPrefix: anon.slice(0, 30) },
      malls:        { ok: !mallsErr, data: malls, error: mallsErr?.message ?? null },
      vendorInsert: { ok: !vendorErr, mallIdUsed: mallId, error: vendorErr?.message ?? null, code: vendorErr?.code ?? null, details: vendorErr?.details ?? null, hint: vendorErr?.hint ?? null },
      postInsert:   { ok: postOk, skipped: !vendorId, error: (postErr as { message?: string } | null)?.message ?? null, code: (postErr as { code?: string } | null)?.code ?? null },
    });
  } catch (err) {
    logError("Unexpected error in debug endpoint", {
      error: err,
      details: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
    
    return NextResponse.json(
      { error: "Debug endpoint failed", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
