// types/treehouse.ts
// Shared types for the Treehouse ecosystem layer:
// vendors, malls, posts, and lightweight local profile storage.

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
}

export interface Vendor {
  id:           string;
  created_at:   string;
  updated_at:   string;
  user_id:      string | null;
  mall_id:      string;
  display_name: string;
  booth_number: string | null;
  bio:          string | null;
  avatar_url:   string | null;
  slug:         string;
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

// ── Lightweight vendor profile stored in localStorage ─────────────────────────
// Lets vendors post without auth. Persists name/booth/mall across sessions.
export interface LocalVendorProfile {
  display_name: string;
  booth_number: string;
  mall_id:      string;
  mall_name:    string;
  mall_city:    string;
  vendor_id?:   string; // set after first Supabase vendor row is created
  slug?:        string;
}

export const LOCAL_VENDOR_KEY = "th_vendor_profile";
export const POST_IMAGE_KEY   = "th_post_image";
