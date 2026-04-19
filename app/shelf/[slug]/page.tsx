// app/shelf/[slug]/page.tsx
// Public Saved Shelf — read-only visitor view of a vendor's shelf, v1.1h.
//
// Identical layout to /my-shelf except:
//   - Masthead has a back arrow in the left slot (visitors typically arrive via a
//     Find Detail deep link; giving them a back gesture matches their path)
//   - No banner edit button (read-only)
//   - No AddFindTile in Window View
//   - Share button is always visible (anyone can share a booth)
//   - No self-heal or auth gating
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
import { loadBookmarkCount } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
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

const BASE_URL = "https://treehouse-treasure-search.vercel.app";

// ─── Masthead (Mode A, public variant — back arrow left, empty right slot) ────
// v1.1l — migrated to <StickyMasthead>. scrollTarget is the page's overflow-auto
// scroll container (same pattern as /my-shelf).

function Masthead({
  onBack,
  scrollTarget,
}: {
  onBack: () => void;
  scrollTarget: React.RefObject<HTMLDivElement | null>;
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
      <div />
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
  const [copied,        setCopied]        = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setBookmarkCount(loadBookmarkCount()); }, []);

  useEffect(() => {
    if (!slug) return;
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

  async function handleShare() {
    if (!vendor?.slug) return;
    const url  = `${BASE_URL}/shelf/${vendor.slug}`;
    const name = vendor.display_name;
    if (navigator.share) {
      try { await navigator.share({ title: `${name} on Treehouse`, text: `Check out finds from ${name}.`, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  }

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
        <Masthead onBack={() => router.back()} scrollTarget={scrollContainerRef} />
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
        <Masthead onBack={() => router.back()} scrollTarget={scrollContainerRef} />
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <BoothHero
              displayName={displayName}
              boothNumber={boothNumber}
              heroImageUrl={(vendor?.hero_image_url as string | null | undefined) ?? null}
              heroKey={0}
              onShare={handleShare}
              hasCopied={copied}
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

      <BoothPageStyles />
    </div>
  );
}
