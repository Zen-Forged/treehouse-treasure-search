// types/treehouse.ts

export type PostStatus = "available" | "sold" | "pending";

export interface Mall {
  id:         string;
  created_at: string;
  updated_at: string;
  name:       string;
  city:       string;
  state:      string;
  slug:       string;
  address:    string | null;

  // ── Mall Identity Layer (all optional — hero defaults gracefully without these) ──
  // Add these columns to the malls table in Supabase when ready.
  // Until then they simply come back as undefined and the hero renders from name/city/state.
  hero_title?:     string | null;   // Override display name. Default: mall.name
  hero_subtitle?:  string | null;   // Override tagline. Default: "Curated finds in {city}, {state}"
  hero_style?:     string | null;   // "default" | "golden" | "forest" | "terracotta" | "slate"
  hero_image_url?: string | null;   // Optional bg photo (Supabase Storage URL). Not required for MVP.
}

export interface Vendor {
  id:            string;
  created_at:    string;
  updated_at:    string;
  user_id:       string | null;
  mall_id:       string;
  display_name:  string;
  booth_number:  string | null;
  bio:           string | null;
  avatar_url:    string | null;
  slug:          string;
  facebook_url:  string | null;
  // Joined
  mall?: Mall;
}

export interface Post {
  id:             string;
  created_at:     string;
  updated_at:     string;
  vendor_id:      string;
  mall_id:        string;
  title:          string;
  description:    string | null;
  caption:        string | null;
  image_url:      string | null;
  price_asking:   number | null;
  status:         PostStatus;
  location_label: string | null;
  // Joined
  vendor?: Vendor;
  mall?:   Mall;
}

export interface LocalVendorProfile {
  display_name:  string;
  booth_number:  string;
  mall_id:       string;
  mall_name:     string;
  mall_city:     string;
  vendor_id?:    string;
  slug?:         string;
  facebook_url?: string;
}

export const LOCAL_VENDOR_KEY = "th_vendor_profile";
export const POST_IMAGE_KEY   = "th_post_image";
