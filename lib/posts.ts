// lib/posts.ts
// Data access layer for Treehouse posts, vendors, and malls.
// All functions return typed results and never throw —
// they return null / [] on error so the UI can degrade gracefully.

import { supabase } from "./supabase";
import type { Post, Vendor, Mall, LocalVendorProfile } from "@/types/treehouse";

// ─────────────────────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getFeedPosts(limit = 40): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      vendor:vendors ( id, display_name, booth_number, slug, avatar_url ),
      mall:malls     ( id, name, city, state, slug )
    `)
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
      vendor:vendors ( id, display_name, booth_number, slug, avatar_url, bio ),
      mall:malls     ( id, name, city, state, slug, address )
    `)
    .eq("id", id)
    .single();

  if (error) { console.error("[posts] getPost:", error.message); return null; }
  return data as Post;
}

export async function getMallPosts(mallId: string, limit = 60): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`*, vendor:vendors ( id, display_name, booth_number, slug )`)
    .eq("mall_id", mallId)
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

export async function createPost(input: CreatePostInput): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .insert([{ ...input, status: "available" }])
    .select()
    .single();

  if (error) { console.error("[posts] createPost:", error.message, error.details, error.hint); return null; }
  return data as Post;
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDORS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("slug", slug)
    .single();

  if (error) { console.error("[posts] getVendorBySlug:", error.message); return null; }
  return data as Vendor;
}

export interface CreateVendorInput {
  mall_id:       string;
  display_name:  string;
  booth_number?: string;
  slug:          string;
}

export async function createVendor(input: CreateVendorInput): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from("vendors")
    .insert([input])
    .select()
    .single();

  if (error) { console.error("[posts] createVendor:", error.message, error.details, error.hint); return null; }
  return data as Vendor;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

// ─────────────────────────────────────────────────────────────────────────────
// MALLS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllMalls(): Promise<Mall[]> {
  const { data, error } = await supabase
    .from("malls")
    .select("*")
    .order("name", { ascending: true });

  if (error) { console.error("[posts] getAllMalls:", error.message); return []; }
  return (data ?? []) as Mall[];
}

export async function getMallBySlug(slug: string): Promise<Mall | null> {
  const { data, error } = await supabase
    .from("malls")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) { console.error("[posts] getMallBySlug:", error.message); return null; }
  return data as Mall;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a base64 image data URL to Supabase Storage.
 * Bucket: "post-images" — must exist with public access.
 * Requires storage RLS policy allowing anon INSERT on post-images bucket.
 * Returns the public URL or null on failure.
 */
export async function uploadPostImage(
  base64DataUrl: string,
  vendorId: string
): Promise<string | null> {
  try {
    const [header, base64] = base64DataUrl.split(",");
    const mimeMatch = header.match(/data:([^;]+);/);
    const mimeType  = mimeMatch?.[1] ?? "image/jpeg";
    const ext       = mimeType.split("/")[1] ?? "jpg";
    const filename  = `${vendorId}/${Date.now()}.${ext}`;

    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filename, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("[posts] uploadPostImage error:", uploadError.message, uploadError);
      return null;
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(filename);
    console.log("[posts] uploadPostImage success:", data?.publicUrl);
    return data?.publicUrl ?? null;

  } catch (err) {
    console.error("[posts] uploadPostImage exception:", err);
    return null;
  }
}
