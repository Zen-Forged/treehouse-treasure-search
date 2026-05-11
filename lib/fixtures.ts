// lib/fixtures.ts
//
// Canonical mock data for the Review Board (session 150 Shape S,
// /review-board). Mirrors the entity shapes in types/treehouse.ts so the
// same /find/[id], /shelf/[slug], /me, /flagged, etc. consumers can
// render fixture data via lib/reviewMode.ts short-circuits — no
// code-path divergence inside surface components.
//
// IDs are human-readable placeholder strings (not UUIDs) so iframe URLs
// can hardcode them (e.g., /find/fixture-post-1?reviewMode=1) and
// fixture lookups in getPost / getVendorBySlug resolve cleanly. Real
// Supabase callsites never see these IDs because reviewMode-aware
// reads short-circuit BEFORE the supabase client builds its query.
//
// image_url values point at picsum.photos — stable seeded placeholders
// that render in iframes without auth, no Supabase storage round-trip,
// no risk of stale prod URLs breaking the audit surface.

import type { Mall, Vendor, Post } from "@/types/treehouse";

const NOW = "2026-05-11T12:00:00.000Z";

// ── Malls ────────────────────────────────────────────────────────────

export const FIXTURE_MALL: Mall = {
  id:              "fixture-mall-1",
  created_at:      "2024-01-01T00:00:00.000Z",
  updated_at:      NOW,
  name:            "America's Antique Mall",
  city:            "Bowling Green",
  state:           "KY",
  slug:            "americas-antique-mall",
  address:         "1067 Industrial Dr, Bowling Green, KY 42101",
  status:          "active",
  activated_at:    "2024-06-01T00:00:00.000Z",
  phone:           "(270) 555-0100",
  website:         "https://example.com",
  google_maps_url: "https://maps.google.com/?q=americas+antique+mall+bowling+green",
  latitude:        36.9685,
  longitude:       -86.4808,
  category:        "antique_mall",
  zip_code:        "42101",
  hero_title:      "America's Antique Mall",
  hero_subtitle:   null,
  hero_style:      null,
  hero_image_url:  "https://picsum.photos/seed/treehouse-mall-1/1200/800",
};

export const FIXTURE_MALL_2: Mall = {
  id:              "fixture-mall-2",
  created_at:      "2024-03-01T00:00:00.000Z",
  updated_at:      NOW,
  name:            "Stockyards Antique Mall",
  city:            "Louisville",
  state:           "KY",
  slug:            "stockyards-antique-mall",
  address:         "1306 Story Ave, Louisville, KY 40206",
  status:          "active",
  activated_at:    "2024-09-01T00:00:00.000Z",
  phone:           null,
  website:         null,
  google_maps_url: null,
  latitude:        38.2620,
  longitude:       -85.7376,
  category:        "antique_mall",
  zip_code:        "40206",
  hero_title:      null,
  hero_subtitle:   null,
  hero_style:      null,
  hero_image_url:  null,
};

export const FIXTURE_MALLS: Mall[] = [FIXTURE_MALL, FIXTURE_MALL_2];

// ── Vendors ──────────────────────────────────────────────────────────

const VENDOR_BASE = {
  created_at:     "2024-07-01T00:00:00.000Z",
  updated_at:     NOW,
  user_id:        "fixture-user-vendor",
  bio:            null,
  avatar_url:     null,
  facebook_url:   null,
};

export const FIXTURE_VENDORS: Vendor[] = [
  {
    ...VENDOR_BASE,
    id:             "fixture-vendor-1",
    mall_id:        FIXTURE_MALL.id,
    display_name:   "Ella's Finds",
    booth_number:   "12",
    slug:           "ellas-finds",
    hero_image_url: "https://picsum.photos/seed/treehouse-booth-1/1200/900",
    mall:           FIXTURE_MALL,
  },
  {
    ...VENDOR_BASE,
    id:             "fixture-vendor-2",
    mall_id:        FIXTURE_MALL.id,
    display_name:   "Vintage Corner",
    booth_number:   "47",
    slug:           "vintage-corner",
    hero_image_url: "https://picsum.photos/seed/treehouse-booth-2/1200/900",
    mall:           FIXTURE_MALL,
  },
  {
    ...VENDOR_BASE,
    id:             "fixture-vendor-3",
    mall_id:        FIXTURE_MALL.id,
    display_name:   "Treasure Hunt Co",
    booth_number:   "23B",
    slug:           "treasure-hunt-co",
    hero_image_url: null,
    mall:           FIXTURE_MALL,
  },
  {
    ...VENDOR_BASE,
    id:             "fixture-vendor-4",
    mall_id:        FIXTURE_MALL_2.id,
    display_name:   "Louisville Attic",
    booth_number:   "8",
    slug:           "louisville-attic",
    hero_image_url: "https://picsum.photos/seed/treehouse-booth-4/1200/900",
    mall:           FIXTURE_MALL_2,
  },
  {
    ...VENDOR_BASE,
    id:             "fixture-vendor-5",
    mall_id:        FIXTURE_MALL_2.id,
    display_name:   "Bluegrass Pickers",
    booth_number:   "31",
    slug:           "bluegrass-pickers",
    hero_image_url: null,
    mall:           FIXTURE_MALL_2,
  },
];

// ── Posts ────────────────────────────────────────────────────────────
// 12 posts distributed across the 5 vendors. Varied prices, tags,
// statuses, and image presence so the masonry, booth grids, and detail
// pages all show meaningful state. Created_at staggered so the feed
// orders predictably.

const POST_BASE = (idx: number) => ({
  created_at:     new Date(Date.UTC(2026, 4, 10 - idx, 12)).toISOString(),
  updated_at:     NOW,
  description:    null,
  location_label: null,
});

export const FIXTURE_POSTS: Post[] = [
  {
    ...POST_BASE(0),
    id:           "fixture-post-1",
    vendor_id:    FIXTURE_VENDORS[0].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Brass candlestick pair",
    caption:      "Heavy patinaed brass, mid-century — pair has matching wear across both bases.",
    image_url:    "https://picsum.photos/seed/treehouse-post-1/400/500",
    price_asking: 45,
    status:       "available",
    tags:         ["brass", "candlestick", "lighting", "mid-century"],
    vendor:       FIXTURE_VENDORS[0],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(1),
    id:           "fixture-post-2",
    vendor_id:    FIXTURE_VENDORS[0].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Cast iron skillet, No. 8",
    caption:      "Pre-1960 Wagner, smooth cooking surface, no wobble.",
    image_url:    "https://picsum.photos/seed/treehouse-post-2/400/420",
    price_asking: 65,
    status:       "available",
    tags:         ["cast-iron", "kitchen", "wagner", "skillet"],
    vendor:       FIXTURE_VENDORS[0],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(2),
    id:           "fixture-post-3",
    vendor_id:    FIXTURE_VENDORS[1].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Art deco vanity mirror",
    caption:      "Beveled glass, walnut frame, original silver backing intact.",
    image_url:    "https://picsum.photos/seed/treehouse-post-3/400/560",
    price_asking: 180,
    status:       "available",
    tags:         ["art-deco", "mirror", "vanity", "walnut"],
    vendor:       FIXTURE_VENDORS[1],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(3),
    id:           "fixture-post-4",
    vendor_id:    FIXTURE_VENDORS[1].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Stoneware crock, 3-gallon",
    caption:      "Cobalt blue stamp, hairline crack on lip but holds water.",
    image_url:    "https://picsum.photos/seed/treehouse-post-4/400/440",
    price_asking: 95,
    status:       "available",
    tags:         ["stoneware", "crock", "primitive", "kitchen"],
    vendor:       FIXTURE_VENDORS[1],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(4),
    id:           "fixture-post-5",
    vendor_id:    FIXTURE_VENDORS[2].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Vintage road atlas, 1962",
    caption:      "Rand McNally, all states intact, original folding map of US highways.",
    image_url:    "https://picsum.photos/seed/treehouse-post-5/400/480",
    price_asking: 22,
    status:       "available",
    tags:         ["paper", "atlas", "ephemera", "1960s"],
    vendor:       FIXTURE_VENDORS[2],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(5),
    id:           "fixture-post-6",
    vendor_id:    FIXTURE_VENDORS[0].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Pressed glass cake stand",
    caption:      "Tall pedestal, leaf-and-vine pattern, no chips on the rim.",
    image_url:    "https://picsum.photos/seed/treehouse-post-6/400/520",
    price_asking: 38,
    status:       "available",
    tags:         ["pressed-glass", "cake-stand", "pedestal"],
    vendor:       FIXTURE_VENDORS[0],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(6),
    id:           "fixture-post-7",
    vendor_id:    FIXTURE_VENDORS[2].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Singer 99K sewing machine",
    caption:      "Black enamel, gold decals legible, hand crank intact, no case.",
    image_url:    "https://picsum.photos/seed/treehouse-post-7/400/460",
    price_asking: 140,
    status:       "available",
    tags:         ["singer", "sewing", "industrial", "black"],
    vendor:       FIXTURE_VENDORS[2],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(7),
    id:           "fixture-post-8",
    vendor_id:    FIXTURE_VENDORS[1].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Mid-century brass lamp",
    caption:      "Three-way switch works, original socket, shade not included.",
    image_url:    "https://picsum.photos/seed/treehouse-post-8/400/540",
    price_asking: 75,
    status:       "sold",
    tags:         ["brass", "lamp", "lighting", "mid-century"],
    vendor:       FIXTURE_VENDORS[1],
    mall:         FIXTURE_MALL,
  },
  {
    ...POST_BASE(8),
    id:           "fixture-post-9",
    vendor_id:    FIXTURE_VENDORS[3].id,
    mall_id:      FIXTURE_MALL_2.id,
    title:        "Oak telephone stand",
    caption:      "Bench seat folds out, drawer below holds a phone book.",
    image_url:    "https://picsum.photos/seed/treehouse-post-9/400/500",
    price_asking: 110,
    status:       "available",
    tags:         ["oak", "furniture", "telephone-stand", "bench"],
    vendor:       FIXTURE_VENDORS[3],
    mall:         FIXTURE_MALL_2,
  },
  {
    ...POST_BASE(9),
    id:           "fixture-post-10",
    vendor_id:    FIXTURE_VENDORS[3].id,
    mall_id:      FIXTURE_MALL_2.id,
    title:        "Pyrex Spring Blossom set",
    caption:      "Full nesting set, no chips, lids include original handles.",
    image_url:    "https://picsum.photos/seed/treehouse-post-10/400/420",
    price_asking: 55,
    status:       "available",
    tags:         ["pyrex", "kitchen", "nesting-set", "1970s"],
    vendor:       FIXTURE_VENDORS[3],
    mall:         FIXTURE_MALL_2,
  },
  {
    ...POST_BASE(10),
    id:           "fixture-post-11",
    vendor_id:    FIXTURE_VENDORS[4].id,
    mall_id:      FIXTURE_MALL_2.id,
    title:        "Cherry side table",
    caption:      "Single drawer, brass pull, finish is original — light scratches on top.",
    image_url:    "https://picsum.photos/seed/treehouse-post-11/400/480",
    price_asking: 220,
    status:       "available",
    tags:         ["cherry", "furniture", "side-table"],
    vendor:       FIXTURE_VENDORS[4],
    mall:         FIXTURE_MALL_2,
  },
  {
    ...POST_BASE(11),
    id:           "fixture-post-12",
    vendor_id:    FIXTURE_VENDORS[2].id,
    mall_id:      FIXTURE_MALL.id,
    title:        "Enamel coffee pot",
    caption:      "Speckled blue, lid clasps tight, no rust inside the spout.",
    image_url:    null,
    price_asking: null,
    status:       "available",
    tags:         ["enamel", "coffee", "kitchen", "blue"],
    vendor:       FIXTURE_VENDORS[2],
    mall:         FIXTURE_MALL,
  },
];

// ── Shopper fixture ──────────────────────────────────────────────────
// Mirrors the state shape consumed by useShopperAuth + useShopperSaves
// + useShopperBoothBookmarks + useShopperFindsFound + useSavedMallId.
// All ID arrays reference fixture entities above so cross-hook
// resolution works (saved post → real post → real vendor → real mall).

export interface ShopperFixture {
  user_id:           string;
  email:             string;
  handle:            string;
  first_name:        string;
  scouting_since:    string;
  save_ids:          string[];   // Post IDs (♥ Save Find — Find tier)
  bookmark_ids:      string[];   // Vendor IDs (🔖 Bookmark Booth — Booth tier)
  found_ids:         string[];   // Post IDs (✓ Found — digital→physical crossing)
  favorite_mall_ids: string[];   // Mall IDs (★ Favorite Mall — Mall tier, future-wired)
  saved_mall_id:     string | null; // Current scope across (tabs)
}

export const FIXTURE_SHOPPER: ShopperFixture = {
  user_id:           "fixture-shopper-1",
  email:             "shopper@treehouse.example",
  handle:            "antiquehunter42",
  first_name:        "Sam",
  scouting_since:    "2025-02-15T00:00:00.000Z",
  save_ids:          ["fixture-post-1", "fixture-post-3", "fixture-post-7", "fixture-post-10"],
  bookmark_ids:      ["fixture-vendor-1", "fixture-vendor-3"],
  found_ids:         ["fixture-post-2"],
  favorite_mall_ids: ["fixture-mall-1"],
  saved_mall_id:     "fixture-mall-1",
};

// ── Helpers ──────────────────────────────────────────────────────────

export function getFixturePost(id: string): Post | null {
  return FIXTURE_POSTS.find((p) => p.id === id) ?? null;
}

export function getFixturePostsByIds(ids: string[]): Post[] {
  const set = new Set(ids);
  return FIXTURE_POSTS.filter((p) => set.has(p.id));
}

export function getFixtureVendorBySlug(slug: string): Vendor | null {
  return FIXTURE_VENDORS.find((v) => v.slug === slug) ?? null;
}

export function getFixtureVendorPosts(vendorId: string): Post[] {
  return FIXTURE_POSTS.filter((p) => p.vendor_id === vendorId);
}

// MallStats shape from lib/posts.ts (boothCount + findCount). Mirrored
// here rather than imported to keep fixtures.ts dependency-free of the
// data layer it back-stops.
export function getFixtureMallStats(): Record<string, { boothCount: number; findCount: number }> {
  const stats: Record<string, { boothCount: number; findCount: number }> = {};
  for (const mall of FIXTURE_MALLS) {
    stats[mall.id] = {
      boothCount: FIXTURE_VENDORS.filter((v) => v.mall_id === mall.id).length,
      findCount:  FIXTURE_POSTS.filter((p) => p.mall_id === mall.id && p.status === "available").length,
    };
  }
  return stats;
}
