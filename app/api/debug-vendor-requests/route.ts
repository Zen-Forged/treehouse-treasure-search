// app/api/debug-vendor-requests/route.ts
// Debug endpoint to check vendor_requests table data

import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use service role key for admin access
    const serviceSupabase = await import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    );

    // Check if table exists and get all data
    const { data, error, count } = await serviceSupabase
      .from('vendor_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        }
      });
    }

    // Group by status
    const pending = data?.filter(r => r.status === 'pending') || [];
    const approved = data?.filter(r => r.status === 'approved') || [];

    return NextResponse.json({
      success: true,
      summary: {
        total: count || 0,
        pending: pending.length,
        approved: approved.length,
      },
      requests: data || [],
      tableExists: true,
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        tableExists: false,
      }
    });
  }
}
