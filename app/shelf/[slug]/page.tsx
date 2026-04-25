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
import { getSession, isAdmin } from "@/lib/auth";
import { loadBookmarkCount } from "@/lib/utils";
import { track } from "@/lib/clientEvents";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import ShareBoothSheet from "@/components/ShareBoothSheet";
import {
  BoothHero,
  BoothTitleBlock,
  MallBlock,
  DiamondDivider,
  ViewToggle,
  WindowView,
  ShelfView,
  BoothCloser,
  BoothPageStyles,
  v1,
  FONT_IM_FELL,
  type BoothView,
} from "@/components/BoothPage";
import type { Post, Vendor, Mall } from "@/types/treehouse";
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

function MastheadPaperAirplane() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={v1.green}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
    </svg>
  );
}

function Masthead({
  onBack,
  scrollTarget,
  canShare,
  onShareOpen,
}: {
  onBack: () => void;
  scrollTarget: React.RefObject<HTMLDivElement | null>;
  canShare: boolean;
  onShareOpen: () => void;
}) {
  return (
    <StickyMasthead
      scrollTarget={scrollTarget}
      style={{
        padding: "max(14px, env(safe-area-inset-top, 14px)) 22px 12px",
        display: "grid",
        gridTemplateColumns: "38px 1fr 38px",
        alignItems: "center",
        gap: 12,
      }}
    >
      <button
        onClick={onBack}
        aria-label="Go back"
        style={{
          width: 38,
          height: 38,
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
        <ArrowLeft size={18} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
      </button>
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 18,
          color: v1.inkPrimary,
          letterSpacing: "-0.005em",
          textAlign: "center",
        }}
      >
        Treehouse Finds
      </div>
      {canShare ? (
        <button
          onClick={onShareOpen}
          aria-label="Share this booth by email"
          style={{
            width: 38,
            height: 38,
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
      ) : (
        <div />
      )}
    </StickyMasthead>
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
          fontFamily: FONT_IM_FELL,
          fontSize: 22,
          color: v1.inkPrimary,
          textAlign: "center",
        }}
      >
        Shelf not found
      </div>
      <p
        style={{
          fontFamily: FONT_IM_FELL,
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
          fontFamily: FONT_IM_FELL,
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

  const [vendor,        setVendor]        = useState<Vendor | null>(null);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [notFound,      setNotFound]      = useState(false);
  const [view,          setView]          = useState<BoothView>("window");
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // Session 45 — admin Window share state.
  const [user,          setUser]          = useState<User | null>(null);
  const [shareOpen,     setShareOpen]     = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setBookmarkCount(loadBookmarkCount()); }, []);

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
      if (v.mall) {
        setMall(v.mall as Mall);
      } else if (v.mall_id) {
        getAllMalls().then(malls => setMall(malls.find(m => m.id === v.mall_id) ?? null));
      }
      setLoading(false);
    });
  }, [slug]);

  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Masthead
          onBack={() => router.back()}
          scrollTarget={scrollContainerRef}
          canShare={false}
          onShareOpen={() => {}}
        />
        <NotFound />
        <BottomNav active="shelves" flaggedCount={bookmarkCount} />
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

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
        }}
      >
        <Masthead
          onBack={() => router.back()}
          scrollTarget={scrollContainerRef}
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
              canEdit={false}
            />

            <BoothTitleBlock displayName={displayName} />
            <MallBlock mallName={mallName} mallCity={mallCity} address={address} />
            <DiamondDivider topPad={22} bottomPad={12} horizontalPad={44} />
            <ViewToggle view={view} onChange={setView} />

            {view === "window" ? (
              available.length > 0 ? (
                <WindowView posts={available} showAddTile={false} />
              ) : (
                <div
                  style={{
                    padding: "48px 28px",
                    textAlign: "center",
                    fontFamily: FONT_IM_FELL,
                    fontStyle: "italic",
                    fontSize: 15,
                    color: v1.inkMuted,
                    lineHeight: 1.65,
                  }}
                >
                  Nothing on the shelf yet — check back soon.
                </div>
              )
            ) : (
              available.length > 0 ? (
                <ShelfView posts={available} />
              ) : (
                <div
                  style={{
                    padding: "48px 28px",
                    textAlign: "center",
                    fontFamily: FONT_IM_FELL,
                    fontStyle: "italic",
                    fontSize: 15,
                    color: v1.inkMuted,
                    lineHeight: 1.65,
                  }}
                >
                  Nothing on the shelf yet — check back soon.
                </div>
              )
            )}

            <BoothCloser />
          </>
        )}
      </div>

      <BottomNav active="shelves" flaggedCount={bookmarkCount} />

      {/* Session 50 (Q-008) — Window share sheet, open to all viewers with
          at least one available post. `mode` picks transport: owners + admin
          send authenticated (sender voice preserved); shoppers + anon send
          anonymously (no sender attribution). */}
      {vendor && (
        <ShareBoothSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          vendor={vendor}
          mall={mall}
          previewPosts={available}
          mode={shareMode}
        />
      )}

      <BoothPageStyles />
    </div>
  );
}
