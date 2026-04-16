// app/api/admin/posts/route.ts
// Admin-gated endpoint for managing posts.
// Gated by requireAdmin (server-side check of bearer token + email match).
// Prior to 2026-04-16 this route had no server-side auth check — the UI was
// the only gate, which meant any authenticated user could hit it directly.
// Closed via lib/adminAuth.ts.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.service
    .from("posts")
    .select(
      "id, title, status, image_url, vendor_id, created_at, vendor:vendors(id, display_name, booth_number)"
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { ids?: string[]; deleteAll?: boolean };
  const { ids, deleteAll } = body;

  const fetchQuery = auth.service.from("posts").select("id, image_url");
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
    const { data: removed } = await auth.service.storage
      .from("post-images")
      .remove(storagePaths);
    storageDeleted = removed?.length ?? 0;
  }

  const deleteQuery = auth.service.from("posts").delete({ count: "exact" });
  const { error: deleteErr, count } = deleteAll
    ? await deleteQuery.neq("id", "00000000-0000-0000-0000-000000000000")
    : await deleteQuery.in("id", ids ?? []);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, postsDeleted: count ?? 0, storageDeleted });
}
