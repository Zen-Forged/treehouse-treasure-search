// app/shelf/[slug]/page.tsx
// Public Saved Shelf — read-only visitor view of a vendor's shelf, v1.1h.
//
// Identical layout to /my-shelf except:
//   - Masthead has a back arrow in the left slot (visitors typically arrive via a
//     Find Detail deep link; giving them a back gesture matches their path)
//   - No banner edit button (read-only)
//   - No AddFindTile in Window View
//   - No self-heal or auth gating
//
// Session 45 (2026-04-22) — Q-009 admin Window share bypass:
//   - When the signed-in user is admin, the masthead right slot gets a
//     paper-airplane icon that opens <ShareBoothSheet>.
//   - The server-side admin bypass lives in /api/share-booth (session 45):
//     ownership check now accepts admin email via NEXT_PUBLIC_ADMIN_EMAIL.
//
// Session 50 (2026-04-23) — Q-008 Window share opened to all viewers:
//   - The masthead airplane is now visible to everyone (admin + vendor +
//     shopper + unauthenticated), gated only on available.length >= 1.
//   - Mode is derived per viewer:
//       • admin OR the booth's owner → "vendor" mode (authFetch, ownership
//         check on the server — admin bypasses ownership, owner matches it)
//       • everyone else → "shopper" mode (plain fetch, anonymous server path
//         with tighter rate limit, no sender attribution in the email)
//   - <ShareBoothSheet>'s `mode` prop drives which transport authFetch vs
//     fetch runs inside the sheet.
//
// Session 45 — BoothHero URL link-share retired:
//   The top-right frosted airplane bubble inside <BoothHero> was removed
//   from the shared primitive to resolve two-airplane confusion on Booth
//   pages. The masthead airplane (admin-only here) is now the sole share
//   affordance. `BASE_URL`, the `copied` state, and `handleShare` were
//   all removed at the same commit — none of them had any other caller
//   on this page. See components/BoothPage.tsx header for rationale.
//
// Preserves: getVendorBySlug → getVendorPosts → mall resolution, Not-Found state,
// bookmark-count passthrough to BottomNav.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { getVendorBySlug, getVendorPosts, getAllMalls } from "@/lib/posts";
import { setPostCache } from "@/lib/findContext";
import { getSession, isAdmin } from "@/lib/auth";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { useShopperBoothBookmarks } from "@/lib/useShopperBoothBookmarks";
import { track } from "@/lib/clientEvents";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import MastheadPaperAirplane from "@/components/MastheadPaperAirplane";
import ShareSheet from "@/components/ShareSheet";
import EmptyState from "@/components/EmptyState";
import LocationActions from "@/components/LocationActions";
import {
  BoothHero,
  BoothTitleBlock,
  MallBlock,
  DiamondDivider,
  WindowView,
  BoothCloser,
  BoothPageStyles,
  v1,
  FONT_LORA,
} from "@/components/BoothPage";
import { v2 } from "@/lib/tokens";
import type { Post, Vendor, Mall } from "@/types/treehouse";

// Session 85 — back-nav scroll anchoring. Module-scope cache survives
// /find/[id] navigation (App Router unmounts the page; module scope persists
// for the SPA session). Hydrating state from cache on mount when the slug
// matches lets WindowTile photographs render without a skeleton
// flash. Per-slug scroll key persists scroll position across the same
// boundary so navigating between different shelves doesn't restore a
// position from a different layout. Pure scroll behavior — no motion changes.
let cachedPublicShelf: {
  slug:   string;
  vendor: Vendor;
  posts:  Post[];
  mall:   Mall | null;
} | null = null;
const shelfScrollKey = (slug: string) => `treehouse_shelf_scroll:${slug}`;
import type { User } from "@supabase/supabase-js";

// ─── Masthead (Mode A, public variant — back arrow left, empty right slot) ────
// v1.1l — migrated to <StickyMasthead>. scrollTarget is the page's overflow-auto
// scroll container (same pattern as /my-shelf).
//
// Session 45 — right slot gains an admin-only airplane share button. When
// `canShare` is true, the 38px circle bubble matches /my-shelf's MastheadPaper
// Airplane exactly (v1.green stroke, v1.iconBubble bg, same SVG). When false
// (shopper/guest), the right slot is a 38px spacer so the grid center stays
// balanced.
//
// Session 80 — bookmark relocated to BoothHero photo corner per
// docs/bookmark-relocation-design.md. Right slot is share-airplane-only now;
// the BookmarkBoothBubble + showBookmark/saved/onToggleBookmark props are
// retired from this Masthead's API. Mirrors session 78 /find/[id] convention
// where masthead carries share only and the save affordance lives on the
// photograph.

function Masthead({
  onBack,
  canShare,
  onShareOpen,
}: {
  onBack: () => void;
  canShare: boolean;
  onShareOpen: () => void;
}) {
  // Session 70 — locked-grid slot API. Inner grid + safe-area padding now
  // owned by StickyMasthead itself. Page just provides slot content; the
  // wordmark X-coordinate is locked across all callsites.
  return (
    <StickyMasthead
      left={
        <button
          onClick={onBack}
          aria-label="Go back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(42,26,10,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            padding: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
        </button>
      }
      right={
        canShare ? (
          <button
            onClick={onShareOpen}
            aria-label="Share this booth by email"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <MastheadPaperAirplane />
          </button>
        ) : null
      }
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "0 10px" }}>
      <div
        className="booth-shimmer"
        style={{ borderRadius: v1.bannerRadius, minHeight: 260, width: "100%" }}
      />
      <div style={{ padding: "36px 22px 6px" }}>
        <div className="booth-shimmer" style={{ height: 14, width: 120, borderRadius: 4, marginBottom: 8 }} />
        <div className="booth-shimmer" style={{ height: 34, width: 240, borderRadius: 6 }} />
      </div>
      <div style={{ padding: "16px 22px" }}>
        <div className="booth-shimmer" style={{ height: 22, width: 200, borderRadius: 4, marginBottom: 6 }} />
        <div className="booth-shimmer" style={{ height: 16, width: 240, borderRadius: 4 }} />
      </div>
      <style>{`
        @keyframes boothshimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .booth-shimmer {
          background: linear-gradient(90deg, rgba(225,220,210,0.4) 25%, rgba(208,202,190,0.65) 50%, rgba(225,220,210,0.4) 75%);
          background-size: 800px 100%;
          animation: boothshimmer 1.6s infinite linear;
        }
      `}</style>
    </div>
  );
}

// ─── Not-found state ──────────────────────────────────────────────────────────

function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        minHeight: "60dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 24px",
      }}
    >
      <Heart size={32} style={{ color: v1.inkFaint }} />
      <div
        style={{
          fontFamily: FONT_LORA,
          fontSize: 22,
          color: v1.inkPrimary,
          textAlign: "center",
        }}
      >
        Shelf not found
      </div>
      <p
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 14,
          color: v1.inkMuted,
          textAlign: "center",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 280,
        }}
      >
        This shelf may have moved or the link may be outdated.
      </p>
      <Link
        href="/"
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 15,
          color: v1.inkPrimary,
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textDecorationColor: v1.inkFaint,
          textUnderlineOffset: 3,
        }}
      >
        Back to the feed
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicShelfPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  // Hydrate from module-scope cache when the slug matches so back-nav from
  // /find/[id] mounts tiles synchronously — destination motion nodes for any
  // back-morph need to exist before framer-motion releases the source rect.
  const cacheHit = cachedPublicShelf?.slug === slug ? cachedPublicShelf : null;
  const [vendor,         setVendor]         = useState<Vendor | null>(cacheHit?.vendor ?? null);
  const [posts,          setPosts]          = useState<Post[]>(cacheHit?.posts ?? []);
  const [mall,           setMall]           = useState<Mall | null>(cacheHit?.mall ?? null);
  const [loading,        setLoading]        = useState<boolean>(cacheHit === null);
  const [notFound,       setNotFound]       = useState(false);

  const pendingScrollY = useRef<number | null>(null);
  const scrollRestored = useRef(false);

  // Session 45 — admin Window share state.
  const [user,           setUser]           = useState<User | null>(null);
  const [shareOpen,      setShareOpen]      = useState(false);

  // R1 Arc 4 — saves drives the BottomNav saved-finds badge; booth-bookmarks
  // drives the masthead bookmark glyph. Both hooks own their auth + sync.
  const saves           = useShopperSaves();
  const boothBookmarks  = useShopperBoothBookmarks();
  // R17 Arc 2 — silent first-mount geolocation handled internally by
  // <LocationActions> at the page footer (below BoothCloser as of session
  // 130 refinement; was above BoothCloser per session 128 D5).
  // DistancePill below the BoothHero retired session 128 (within-session
  // reversal of session 119 D18); useUserLocation no longer needed at
  // page level since LocationActions composes its own hook.
  const bookmarkCount   = saves.ids.size;
  const boothBookmarked = !!vendor && boothBookmarks.isBookmarked(vendor.id);

  function handleToggleBoothBookmark() {
    if (!vendor) return;
    const next = !boothBookmarked;
    boothBookmarks.toggle(vendor.id, next);
    track(next ? "booth_bookmarked" : "booth_unbookmarked", {
      vendor_slug: vendor.slug,
    });
  }

  // Session 45 — read session for admin gate. Non-blocking: the page
  // renders for all viewers; only the masthead airplane is gated on
  // isAdmin(user). No redirect, no auth wall.
  useEffect(() => {
    getSession().then(s => setUser(s?.user ?? null));
  }, []);

  useEffect(() => {
    if (!slug) return;
    // R3 — page_viewed analytics event. Vendor slug is the most useful
    // payload property for booth-visit attribution.
    track("page_viewed", { path: "/shelf/[slug]", vendor_slug: slug });
    getVendorBySlug(slug).then(async v => {
      if (!v) { setNotFound(true); setLoading(false); return; }
      setVendor(v);
      const p = await getVendorPosts(v.id, 200);
      setPosts(p);
      // Phase C (session 100) — populate the shared post cache so a tap
      // from this booth into /find/[id] paints metadata synchronously,
      // matching Home + /flagged behavior. The cache is shared via
      // lib/findContext and used by /find/[id]'s useLayoutEffect.
      for (const post of p) setPostCache(post);
      let resolvedMall: Mall | null = null;
      if (v.mall) {
        resolvedMall = v.mall as Mall;
        setMall(resolvedMall);
      } else if (v.mall_id) {
        const malls = await getAllMalls();
        resolvedMall = malls.find(m => m.id === v.mall_id) ?? null;
        setMall(resolvedMall);
      }
      cachedPublicShelf = { slug, vendor: v, posts: p, mall: resolvedMall };
      setLoading(false);
    });
  }, [slug]);

  // Scroll save + restore. Per-slug key so navigating between different
  // shelves doesn't restore a scroll position from a different shelf's
  // layout. Save on every scroll event; restore once after mount, gated on
  // data being available so the BoothPage layout is final before scrollTo.
  useEffect(() => {
    if (!slug) return;
    try {
      const saved = sessionStorage.getItem(shelfScrollKey(slug));
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) pendingScrollY.current = y;
      }
    } catch {}

    function onScroll() {
      try { sessionStorage.setItem(shelfScrollKey(slug), String(Math.round(window.scrollY))); } catch {}
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  useEffect(() => {
    if (loading) return;
    if (scrollRestored.current) return;
    if (pendingScrollY.current === null) return;
    scrollRestored.current = true;
    const y = pendingScrollY.current;
    requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); });
  }, [loading]);

  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v2.bg.main,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Masthead
          onBack={() => router.back()}
          canShare={false}
          onShareOpen={() => {}}
        />
        <NotFound />
        <BottomNav active={null} flaggedCount={bookmarkCount} />
        <BoothPageStyles />
      </div>
    );
  }

  const available   = posts.filter(p => p.status === "available");
  const displayName = vendor?.display_name ?? "";
  const boothNumber = vendor?.booth_number ?? null;
  const mallName    = mall?.name ?? (vendor?.mall as Mall | undefined)?.name ?? "America's Antique Mall";
  const mallCity    = mall?.city ?? (vendor?.mall as Mall | undefined)?.city ?? "Louisville, KY";
  const address     = mall?.address ?? null;

  // Session 50 (Q-008) — airplane is visible to everyone once the booth
  // has at least one available post (mirrors the server's empty-window
  // 409 guard). Gate on !!vendor so the icon doesn't flash during the
  // initial vendor load. Mode derivation decides which transport the sheet
  // uses: owners + admin get authenticated sends with the sender voice;
  // anyone else gets the anonymous path with no sender attribution.
  const isOwner      = !!user && !!vendor && !!vendor.user_id && user.id === vendor.user_id;
  const isAdminUser  = isAdmin(user);
  const shareMode: "vendor" | "shopper" = (isAdminUser || isOwner) ? "vendor" : "shopper";
  const canShare     = !!vendor && available.length >= 1;

  // Session 67 — D10 self-bookmark gate. Hide the masthead bookmark glyph
  // when the viewer is the booth's owner. Guests (user==null) and other
  // vendors / shoppers / admins all see it.
  const showBookmark = !!vendor && !isOwner;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v2.bg.main,
        maxWidth: 430,
        margin: "0 auto",
        paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
      }}
    >
      <Masthead
        onBack={() => router.back()}
        canShare={canShare}
        onShareOpen={() => setShareOpen(true)}
      />
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <BoothHero
              displayName={displayName}
              boothNumber={boothNumber}
              heroImageUrl={(vendor?.hero_image_url as string | null | undefined) ?? null}
              heroKey={0}
              layoutId={vendor ? `booth-${vendor.id}` : undefined}
              saved={showBookmark ? boothBookmarked : undefined}
              onToggleBookmark={showBookmark ? handleToggleBoothBookmark : undefined}
            />

            {/* Session 128 (within-session reversal of D5 implementation-time
                call): DistancePill below the BoothHero photograph retired
                entirely. Was R17 Arc 2 D18 — right-aligned distance pill
                pairing with the rotated post-it stamp's small-caps postal
                vocabulary. The footer-anchored LocationActions row carries
                the place-context affordance now. */}

            {/* Session 128 (refinement design D5): LocationActions twin-button
                row relocated from here (R17 Arc 2 D19, directly below BoothHero)
                to page-bottom above BoothCloser. Footer placement frames the
                'now I want to visit' moment, not 'scoping the booth.' */}

            <BoothTitleBlock displayName={displayName} />
            <MallBlock mallName={mallName} mallCity={mallCity} address={address} />
            <DiamondDivider topPad={22} bottomPad={12} horizontalPad={44} />

            {/* Session 128 (refinement design D2 + D3): ViewToggle + ShelfView
                retired. WindowView is the only find-rendering path.
                Session 128 (refinement design D4): per-tile save bubble wired
                via canonical PolaroidTile.topRight slot. Saves drives the
                bubble state via useShopperSaves; toggling fires the same
                R3 events as Home heart + /flagged unsave. */}
            {available.length > 0 ? (
              <WindowView
                posts={available}
                showAddTile={false}
                swipeOriginPath={`/shelf/${slug}`}
                savedIds={saves.ids}
                onToggleSave={(postId) => saves.toggle(postId, !saves.isSaved(postId))}
              />
            ) : (
              <EmptyState
                subtitle="Nothing on the shelf yet — check back soon."
                clearance={48}
              />
            )}

            <BoothCloser />

            {/* Session 130 refinement: LocationActions moves BELOW the closer
                — closer text becomes the copy-CTA ("...visit in person to
                make a purchase."), LocationActions buttons become the literal
                action-CTA at page-end. Reverses session 128 D5 (was above
                BoothCloser); composes with the session-130 closer copy
                refinement. Page-end CTA pattern. */}
            {mall && (
              <div style={{ padding: "20px 22px 0" }}>
                <LocationActions
                  mallSlug={mall.slug}
                  mallLat={mall.latitude ?? null}
                  mallLng={mall.longitude ?? null}
                  surface="booth"
                  vendorId={vendor?.id ?? null}
                />
              </div>
            )}
          </>
        )}

      <BottomNav active={null} flaggedCount={bookmarkCount} />

      {/* Session 50 (Q-008) — Window share sheet, open to all viewers with
          at least one available post. `mode` picks transport: owners + admin
          send authenticated (sender voice preserved); shoppers + anon send
          anonymously (no sender attribution). */}
      {vendor && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          entity={{ kind: "booth", vendor, mall }}
          mode={shareMode}
        />
      )}

      <BoothPageStyles />
    </div>
  );
}
