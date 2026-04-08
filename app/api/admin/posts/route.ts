// app/api/admin/posts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  const supabase = createClient(url, anon);
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, status, image_url, vendor_id, created_at, vendor:vendors(id, display_name, booth_number)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function DELETE(req: Request) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  const supabase = createClient(url, anon);
  const body = await req.json() as { ids?: string[]; deleteAll?: boolean };
  const { ids, deleteAll } = body;

  const fetchQuery = supabase.from("posts").select("id, image_url");
  const { data: posts, error: fetchErr } = deleteAll
    ? await fetchQuery.neq("id", "00000000-0000-0000-0000-000000000000")
    : await fetchQuery.in("id", ids ?? []);
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const storagePaths: string[] = [];
  for (const post of posts ?? []) {
    if (post.image_url) {
      const match = post.image_url.match(/post-images\/(.+)$/);
      if (match?.[1]) storagePaths.push(decodeURIComponent(match[1]));
    }
  }
  let storageDeleted = 0;
  if (storagePaths.length > 0) {
    const { data: removed } = await supabase.storage.from("post-images").remove(storagePaths);
    storageDeleted = removed?.length ?? 0;
  }

  const deleteQuery = supabase.from("posts").delete({ count: "exact" });
  const { error: deleteErr, count } = deleteAll
    ? await deleteQuery.neq("id", "00000000-0000-0000-0000-000000000000")
    : await deleteQuery.in("id", ids ?? []);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, postsDeleted: count ?? 0, storageDeleted });
}
