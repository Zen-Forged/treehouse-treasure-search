// lib/posts.ts

import { supabase } from "./supabase";
import type { Post, Vendor, Mall } from "@/types/treehouse";

// ── POSTS ─────────────────────────────────────────────────────────────────────

export async function getFeedPosts(limit = 40): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      vendor:vendors ( id, display_name, booth_number, slug, avatar_url, facebook_url ),
      mall:malls     ( id, name, city, state, slug )
    `)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[posts] getFeedPosts:", error.message); return []; }
  return (data ?? []) as Post[];
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      vendor:vendors ( id, display_name, booth_number, slug, avatar_url, bio, facebook_url ),
      mall:malls     ( id, name, city, state, slug, address )
    `)
    .eq("id", id)
    .single();
  if (error) { console.error("[posts] getPost:", error.message); return null; }
  return data as Post;
}

/**
 * Fetch multiple posts by ID in a single Supabase query.
 * Used by the Flagged screen to hydrate saved post IDs efficiently.
 * No status filter — saved finds are shown regardless of availability.
 */
export async function getPostsByIds(ids: string[]): Promise<Post[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      vendor:vendors ( id, display_name, booth_number, slug, avatar_url, facebook_url ),
      mall:malls     ( id, name, city, state, slug )
    `)
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (error) { console.error("[posts] getPostsByIds:", error.message); return []; }
  return (data ?? []) as Post[];
}

export async function getMallPosts(mallId: string, limit = 60): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`*, vendor:vendors ( id, display_name, booth_number, slug )`)
    .eq("mall_id", mallId)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[posts] getMallPosts:", error.message); return []; }
  return (data ?? []) as Post[];
}

export async function getVendorPosts(vendorId: string, limit = 40): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`*, mall:malls ( id, name, city, slug )`)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[posts] getVendorPosts:", error.message); return []; }
  return (data ?? []) as Post[];
}

export interface CreatePostInput {
  vendor_id:       string;
  mall_id:         string;
  title:           string;
  description?:    string;
  caption?:        string;
  image_url?:      string;
  price_asking?:   number | null;
  location_label?: string;
}

export async function createPost(input: CreatePostInput): Promise<{ data: Post | null; error: string | null }> {
  const { data, error } = await supabase
    .from("posts")
    .insert([{ ...input, status: "available" }])
    .select()
    .single();
  if (error) {
    console.error("[posts] createPost:", error.message, error.details, error.hint);
    return { data: null, error: `${error.message}${error.details ? " | " + error.details : ""}${error.hint ? " | hint: " + error.hint : ""}` };
  }
  return { data: data as Post, error: null };
}

export async function updatePostStatus(id: string, status: "available" | "sold"): Promise<boolean> {
  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", id);
  if (error) { console.error("[posts] updatePostStatus:", error.message); return false; }
  return true;
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);
  if (error) { console.error("[posts] deletePost:", error.message); return false; }
  return true;
}

// ── VENDORS ───────────────────────────────────────────────────────────────────

export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("slug", slug)
    .single();
  if (error) { console.error("[posts] getVendorBySlug:", error.message); return null; }
  return data as Vendor;
}

/**
 * Look up a vendor by the authenticated user's Supabase user_id.
 * This is the authoritative identity lookup for logged-in users.
 * Returns null if no vendor row is linked to this user yet (first-time setup).
 */
export async function getVendorByUserId(userId: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("user_id", userId)
    .maybeSingle(); // returns null (not error) if no row found
  if (error) { console.error("[posts] getVendorByUserId:", error.message); return null; }
  return data as Vendor | null;
}

/**
 * Fetch all vendors at a given mall, sorted by booth number.
 * Used by admin and internal lookups.
 */
export async function getVendorsByMall(mallId: string): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, display_name, booth_number, slug, avatar_url, facebook_url, hero_image_url, user_id, mall_id")
    .eq("mall_id", mallId)
    .order("booth_number", { ascending: true, nullsFirst: false });
  if (error) { console.error("[posts] getVendorsByMall:", error.message); return []; }
  return (data ?? []) as Vendor[];
}

export interface CreateVendorInput {
  mall_id:       string;
  display_name:  string;
  booth_number?: string;
  slug:          string;
  user_id?:      string;
}

/**
 * Creates a vendor row, or recovers the existing one if the
 * (mall_id, booth_number) unique constraint fires (code 23505).
 * This handles the case where iPhone lost its vendor_id from storage
 * but the row already exists in Supabase.
 * Accepts optional user_id for auth session linking.
 */
export async function createVendor(input: CreateVendorInput): Promise<{ data: Vendor | null; error: string | null }> {
  const { data, error } = await supabase
    .from("vendors")
    .insert([input])
    .select()
    .single();

  if (!error) {
    return { data: data as Vendor, error: null };
  }

  // code 23505 = duplicate key — vendor already exists (iPhone lost its vendor_id from storage)
  // Look up the existing row by mall_id + booth_number and update user_id if provided
  if (error.code === "23505" && input.booth_number) {
    console.warn("[posts] createVendor: duplicate, looking up existing vendor");
    const { data: existing, error: fetchErr } = await supabase
      .from("vendors")
      .select("*")
      .eq("mall_id", input.mall_id)
      .eq("booth_number", input.booth_number)
      .single();

    if (existing) {
      // If we have a user_id and the existing row doesn't, update it now
      if (input.user_id && !existing.user_id) {
        await supabase
          .from("vendors")
          .update({ user_id: input.user_id })
          .eq("id", existing.id);
      }
      return { data: existing as Vendor, error: null };
    }
    return { data: null, error: `Duplicate vendor but lookup failed: ${fetchErr?.message ?? "unknown"}` };
  }

  // Some other error
  console.error("[posts] createVendor:", error.message, error.details, error.hint, error.code);
  return {
    data: null,
    error: `code=${error.code} | ${error.message}${error.details ? " | " + error.details : ""}${error.hint ? " | hint: " + error.hint : ""}`,
  };
}

export function slugify(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

// ── MALLS ─────────────────────────────────────────────────────────────────────

export async function getAllMalls(): Promise<Mall[]> {
  const { data, error } = await supabase
    .from("malls").select("*").order("name", { ascending: true });
  if (error) { console.error("[posts] getAllMalls:", error.message); return []; }
  return (data ?? []) as Mall[];
}

export async function getMallBySlug(slug: string): Promise<Mall | null> {
  const { data, error } = await supabase
    .from("malls").select("*").eq("slug", slug).single();
  if (error) { console.error("[posts] getMallBySlug:", error.message); return null; }
  return data as Mall;
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────

export async function uploadPostImage(base64DataUrl: string, vendorId: string): Promise<string | null> {
  try {
    const [header, base64] = base64DataUrl.split(",");
    const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
    const ext      = mimeType.split("/")[1] ?? "jpg";
    const filename = `${vendorId}/${Date.now()}.${ext}`;

    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { error } = await supabase.storage
      .from("post-images")
      .upload(filename, bytes, { contentType: mimeType, upsert: false });

    if (error) { console.error("[posts] uploadPostImage:", error.message); return null; }

    const { data } = supabase.storage.from("post-images").getPublicUrl(filename);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("[posts] uploadPostImage exception:", err);
    return null;
  }
}

/**
 * Upload a vendor hero/banner image to Supabase Storage.
 * Uses upsert: true so re-uploads replace the previous hero image.
 * Path: vendor-hero/{vendorId}.jpg — one canonical file per vendor.
 */
export async function uploadVendorHeroImage(base64DataUrl: string, vendorId: string): Promise<string | null> {
  try {
    const [header, base64] = base64DataUrl.split(",");
    const mimeType = header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
    const filename = `vendor-hero/${vendorId}.jpg`;

    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { error } = await supabase.storage
      .from("post-images")
      .upload(filename, bytes, { contentType: mimeType, upsert: true });

    if (error) { console.error("[posts] uploadVendorHeroImage:", error.message); return null; }

    // Bust the CDN cache by appending a timestamp — upsert won't change the URL otherwise
    const { data } = supabase.storage.from("post-images").getPublicUrl(filename);
    const publicUrl = data?.publicUrl ?? null;
    return publicUrl ? `${publicUrl}?t=${Date.now()}` : null;
  } catch (err) {
    console.error("[posts] uploadVendorHeroImage exception:", err);
    return null;
  }
}

/**
 * Persist the hero image URL to the vendors table.
 */
export async function updateVendorHeroImage(vendorId: string, heroImageUrl: string): Promise<boolean> {
  const { error } = await supabase
    .from("vendors")
    .update({ hero_image_url: heroImageUrl })
    .eq("id", vendorId);
  if (error) { console.error("[posts] updateVendorHeroImage:", error.message); return false; }
  return true;
}
