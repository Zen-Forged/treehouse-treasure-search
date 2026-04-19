// lib/siteSettings.ts
// Site-level settings reads — v1.1l (docs/design-system.md §v1.1l (c))
//
// The site_settings table holds keyed rows with jsonb values. v1.1l uses it
// for two admin-editable banner image URLs:
//   - featured_find_image_url   (Home)
//   - find_map_banner_image_url (Find Map)
//
// Reads use the anon browser client (public-readable by design — the values
// are image URLs the UI loads regardless). Writes go through
// /api/admin/featured-image, which uses the service-role client after
// requireAdmin().
//
// All read helpers return `null` on any failure path — consumers should
// degrade gracefully (render null from <FeaturedBanner>) when the value is
// absent or the fetch fails, never surface an error to the user.

import { supabase } from "./supabase";

export type SiteSettingKey =
  | "featured_find_image_url"
  | "find_map_banner_image_url";

interface UrlValue {
  url: string | null;
}

/**
 * Read a single site setting that stores a URL. Returns null if the row is
 * missing, the value is malformed, or the fetch fails.
 */
export async function getSiteSettingUrl(
  key: SiteSettingKey,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`[siteSettings] ${key}:`, error.message);
      return null;
    }
    if (!data) return null;

    const value = data.value as UrlValue | null;
    return value?.url ?? null;
  } catch (err) {
    console.error(`[siteSettings] ${key} threw:`, err);
    return null;
  }
}

/**
 * Read all banner URLs in a single round trip. Returns an object keyed by
 * the two v1.1l banner settings; missing/failed values are null.
 */
export async function getAllBannerUrls(): Promise<{
  featuredFind:  string | null;
  findMapBanner: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["featured_find_image_url", "find_map_banner_image_url"]);

    if (error || !data) {
      console.error("[siteSettings] getAllBannerUrls:", error?.message);
      return { featuredFind: null, findMapBanner: null };
    }

    const map: Record<string, string | null> = {};
    for (const row of data) {
      const value = row.value as UrlValue | null;
      map[row.key] = value?.url ?? null;
    }

    return {
      featuredFind:  map.featured_find_image_url  ?? null,
      findMapBanner: map.find_map_banner_image_url ?? null,
    };
  } catch (err) {
    console.error("[siteSettings] getAllBannerUrls threw:", err);
    return { featuredFind: null, findMapBanner: null };
  }
}
