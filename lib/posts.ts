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

export interface UpdatePostInput {
  title?:        string;
  caption?:      string;
  price_asking?: number | null;
  image_url?:    string;
}

/**
 * Update editable fields on an existing post.
 * Used by the edit flow — owners can update title, caption, price, and image.
 */
export async function updatePost(id: string, input: UpdatePostInput): Promise<boolean> {
  const { error } = await supabase
    .from("posts")
    .update(input)
    .eq("id", id);
  if (error) { console.error("[posts] updatePost:", error.message); return false; }
  return true;
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
 * Look up a vendor directly by their Supabase row ID.
 * Used by admin to load any vendor's shelf without needing user_id linkage.
 */
export async function getVendorById(id: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from("vendors")
    .select(`*, mall:malls ( id, name, city, state, slug, address )`)
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[posts] getVendorById:", error.message); return null; }
  return data as Vendor | null;
}

/**
 * Look up vendor records that match a given email in vendor_requests.
 * Used by setup flow to find the vendor account created by admin for this email.
 * Searches by cross-referencing with vendor_requests table entries.
 * Returns null if no matching vendor found or vendor already has user_id linked.
 */
export async function getVendorByEmail(email: string): Promise<Vendor | null> {
  try {
    // Query vendor_requests to get name and mall info for this email
    const { data: requests, error: requestError } = await supabase
      .from("vendor_requests")
      .select("name, mall_id, booth_number, mall_name")
      .eq("email", email.trim().toLowerCase())
      .eq("status", "pending");
    
    if (requestError || !requests || requests.length === 0) {
      console.error("[posts] getVendorByEmail: no pending requests found for", email);
      return null;
    }
    
    // Use the most recent request (in case of duplicates)
    const request = requests[0];
    
    // Look for vendor by name and mall - admin may have created vendor from this request
    const { data, error } = await supabase
      .from("vendors")
      .select(`*, mall:malls ( id, name, city, state, slug, address )`)
      .eq("display_name", request.name)
      .eq("mall_id", request.mall_id)
      .is("user_id", null) // Only return unlinked vendor accounts
      .maybeSingle();
    
    if (error) { 
      console.error("[posts] getVendorByEmail vendor lookup:", error.message); 
      return null; 
    }
    
    return data as Vendor | null;
  } catch (err) {
    console.error("[posts] getVendorByEmail exception:", err);
    return null;
  }
}

/**
 * Link an existing vendor row to an authenticated user's user_id.
 * Used by setup flow to claim a vendor account that was pre-created by admin.
 * Returns updated vendor record with user_id populated.
 */
export async function linkVendorToUser(vendorId: string, userId: string): Promise<{ data: Vendor | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("vendors")
      .update({ user_id: userId })
      .eq("id", vendorId)
      .is("user_id", null) // Only link if not already linked
      .select(`*, mall:malls ( id, name, city, state, slug, address )`)
      .single();
    
    if (error) {
      console.error("[posts] linkVendorToUser:", error.message);
      return { data: null, error: error.message };
    }
    
    return { data: data as Vendor, error: null };
  } catch (err) {
    console.error("[posts] linkVendorToUser exception:", err);
    return { data: null, error: String(err) };
  }
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

/**
 * Update a vendor's bio field.
 * Used by the inline bio editor on My Booth page.
 */
export async function updateVendorBio(vendorId: string, bio: string): Promise<boolean> {
  const { error } = await supabase
    .from("vendors")
    .update({ bio: bio.trim() || null })
    .eq("id", vendorId);
  if (error) { console.error("[posts] updateVendorBio:", error.message); return false; }
  return true;
}

export function slugify(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

// ── VENDOR REQUESTS ───────────────────────────────────────────────────────────

/**
 * Fetch all pending vendor requests for admin review.
 * Returns requests in reverse chronological order (newest first).
 */
export async function getVendorRequests(): Promise<Array<{
  id: string;
  name: string;
  email: string;
  booth_number: string | null;
  mall_id: string | null;
  mall_name: string | null;
  status: string;
  created_at: string;
}>> {
  const { data, error } = await supabase
    .from("vendor_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (error) { 
    console.error("[posts] getVendorRequests:", error.message); 
    return []; 
  }
  
  return data ?? [];
}

/**
 * Create a vendor account from an approved vendor request.
 * Used by admin to convert pending requests into actual vendor accounts.
 * Does NOT link user_id - that happens during setup flow.
 */
export async function createVendorFromRequest(request: {
  name: string;
  email: string;
  booth_number: string | null;
  mall_id: string;
  mall_name: string | null;
}): Promise<{ data: Vendor | null; error: string | null }> {
  const slug = slugify(request.name);
  
  const vendorInput: CreateVendorInput = {
    mall_id: request.mall_id,
    display_name: request.name,
    booth_number: request.booth_number || undefined,
    slug,
    // user_id is intentionally omitted - gets linked during setup
  };
  
  const result = await createVendor(vendorInput);
  
  if (result.data) {
    console.log("[posts] createVendorFromRequest: created vendor", {
      vendor_id: result.data.id,
      name: request.name,
      email: request.email,
      booth: request.booth_number,
    });
  }
  
  return result;
}

/**
 * Mark a vendor request as approved.
 * Used after admin creates vendor account from the request.
 */
export async function markVendorRequestApproved(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from("vendor_requests")
    .update({ status: "approved" })
    .eq("id", requestId);
  
  if (error) { 
    console.error("[posts] markVendorRequestApproved:", error.message); 
    return false; 
  }
  
  return true;
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