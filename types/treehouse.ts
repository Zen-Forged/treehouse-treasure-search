// types/treehouse.ts

export type PostStatus = "available" | "sold" | "pending";

export type MallStatus = "draft" | "coming_soon" | "active";

export interface Mall {
  id:           string;
  created_at:   string;
  updated_at:   string;
  name:         string;
  city:         string;
  state:        string;
  slug:         string;
  address:      string | null;

  // ── R4c lifecycle (migration 009) ──
  status:       MallStatus;
  activated_at: string | null;

  // ── Extended location data (added in 001_mall_locations seed) ──
  phone?:           string | null;
  website?:         string | null;
  google_maps_url?: string | null;
  latitude?:        number | null;
  longitude?:       number | null;
  category?:        string | null;  // peddlers_mall | antique_mall | flea_market | antique_store | antique_market
  zip_code?:        string | null;

  // ── Mall Identity Layer (all optional — hero defaults gracefully without these) ──
  hero_title?:     string | null;
  hero_subtitle?:  string | null;
  hero_style?:     string | null;
  hero_image_url?: string | null;
}

export interface Vendor {
  id:             string;
  created_at:     string;
  updated_at:     string;
  user_id:        string | null;
  mall_id:        string;
  display_name:   string;
  booth_number:   string | null;
  bio:            string | null;
  avatar_url:     string | null;
  slug:           string;
  facebook_url:   string | null;
  hero_image_url: string | null;
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
  tags:           string[];   // R16 — discovery primitive (lowercase, 5-6 typical, [] until backfilled)
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
  user_id?:      string;  // Supabase anonymous auth UID — stable per device
}

export const LOCAL_VENDOR_KEY = "th_vendor_profile";
export const POST_IMAGE_KEY   = "th_post_image";

// ─── Admin Requests tab types (relocated from app/admin/page.tsx, session 136
// Arc 2 commit 5 per docs/admin-requests-tab-design.md D15). VendorRequest
// gained `denial_reason` in Arc 1 (commit 4). Shared by app/admin/page.tsx
// and the extracted components/admin/RequestsTab.tsx. ───────────────────────

export interface VendorRequest {
  id:              string;
  name:            string;
  first_name:      string | null;
  last_name:       string | null;
  booth_name:      string | null;
  email:           string;
  booth_number:    string | null;
  mall_id:         string | null;
  mall_name:       string | null;
  status:          string;
  created_at:      string;
  proof_image_url: string | null;
  // Arc 1 (D5+D14) — admin-internal denial reason. NULL for pending +
  // approved rows. Required at API layer when status flips to denied.
  // Never exposed to vendors.
  denial_reason:   string | null;
}

export interface DiagnosisConflict {
  display_name: string;
  booth_number: string | null;
  user_id:      string | null;
  slug:         string;
}

export interface DiagnosisVendorSnapshot {
  id:           string;
  display_name: string;
  booth_number: string | null;
  slug:         string;
  user_id:      string | null;
  mall_id:      string;
  created_at:   string;
}

export interface DiagnosisAuthUser {
  id:                 string;
  email:              string;
  email_confirmed_at: string | null;
  last_sign_in_at:    string | null;
  created_at:         string;
}

export interface DiagnosisReport {
  request: {
    id:           string;
    name:         string;
    email:        string;
    booth_number: string | null;
    mall_id:      string | null;
    mall_name:    string | null;
    status:       string;
    created_at:   string;
  };
  conflicts: {
    booth_collision: DiagnosisVendorSnapshot[];
    name_collision:  DiagnosisVendorSnapshot[];
    auth_user:       DiagnosisAuthUser | null;
  };
  diagnosis:        string;
  suggested_action: string;
}
