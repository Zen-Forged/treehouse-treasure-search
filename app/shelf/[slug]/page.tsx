// app/shelf/[slug]/page.tsx
// Public Saved Shelf — read-only view of a vendor's shelf.
// No edit button, no Add tile, no sign-out, no admin link.
// Item 4: Share button always visible — anyone can share a booth.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowLeft, Heart, Send, Check } from "lucide-react";
import { getVendorBySlug, getVendorPosts, getAllMalls } from "@/lib/posts";
import { colors } from "@/lib/tokens";
import { vendorHueBg, loadBookmarkCount } from "@/lib/utils";
import TabSwitcher from "@/components/TabSwitcher";
import BoothLocationCTA from "@/components/BoothLocationCTA";
import ExploreBanner from "@/components/ExploreBanner";
import { ThreeColGrid, SkeletonGrid, AvailableTile, FoundTile, ShelfGridStyles } from "@/components/ShelfGrid";
import BottomNav from "@/components/BottomNav";
import type { Post, Vendor, Mall } from "@/types/treehouse";

const BASE_URL = "https://treehouse-treasure-search.vercel.app";

// ─── Read-only hero card — Item 4: share button always present ─────────────────

function PublicVendorHero({
  displayName, boothNumber, mallName, mallCity, heroImageUrl, onBack,
  onShare, hasCopied,
}: {
  displayName: string; boothNumber: string | null; mallName?: string; mallCity?: string;
  heroImageUrl?: string | null; onBack: () => void;
  onShare: () => void; hasCopied: boolean;
}) {
  return (
    <div style={{ padding: "max(14px, env(safe-area-inset-top, 14px)) 10px 0" }}>
      {/* App bar */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10, paddingLeft: 4, paddingRight: 4 }}>
        <button
          onClick={onBack}
          style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${colors.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent", marginRight: 10, flexShrink: 0 }}
        >
          <ArrowLeft size={15} style={{ color: colors.textMid }} />
        </button>
        <Image src="/logo.png" alt="Treehouse Finds" width={18} height={18} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: colors.green, letterSpacing: "0.4px", marginLeft: 6 }}>
          Treehouse Finds
        </span>
      </div>

      {/* Hero banner */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 200 }}>
        {heroImageUrl
          ? <img src={heroImageUrl} alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          : <div style={{ position: "absolute", inset: 0, background: vendorHueBg(displayName) }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(18,34,20,0.82) 0%, rgba(18,34,20,0.40) 55%, transparent 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(18,34,20,0.72) 0%, transparent 100%)", zIndex: 1 }} />

        {/* Item 4: Share button — top-right, same frosted circle pattern as my-shelf */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <AnimatePresence mode="wait">
            {hasCopied ? (
              <motion.div key="copied"
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.14 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 18, background: "rgba(30,77,43,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <Check size={11} style={{ color: "#fff" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Copied!</span>
              </motion.div>
            ) : (
              <motion.button key="share" onClick={onShare}
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.14 }}
                style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                <Send size={14} style={{ color: "rgba(255,255,255,0.92)" }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: "relative", zIndex: 2, padding: "100px 16px 18px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.52)", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 5px" }}>
            A curated shelf from
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "0 0 5px", textShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
            {displayName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {boothNumber && (
              <div style={{ padding: "4px 11px", borderRadius: 18, background: colors.green, fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>
                Booth {boothNumber}
              </div>
            )}
            {mallName && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={9} style={{ color: "rgba(255,255,255,0.52)", flexShrink: 0 }} />
                <span style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "rgba(255,255,255,0.62)" }}>
                  {mallName}{mallCity ? ` · ${mallCity}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicShelfPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();

  const [vendor,        setVendor]        = useState<Vendor | null>(null);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [notFound,      setNotFound]      = useState(false);
  const [tab,           setTab]           = useState<"available" | "found">("available");
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [copied,        setCopied]        = useState(false);

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
      <div style={{ minHeight: "100dvh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
        <Heart size={32} style={{ color: colors.textFaint }} />
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary, textAlign: "center" }}>
          Shelf not found
        </div>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 1.7, margin: 0 }}>
          This shelf may have moved or the link may be outdated.
        </p>
        <Link href="/" style={{ fontSize: 13, color: colors.green, textDecoration: "none", fontWeight: 600 }}>
          ← Back to feed
        </Link>
      </div>
    );
  }

  const available = posts.filter(p => p.status === "available");
  const found     = posts.filter(p => p.status === "sold");
  const mallName  = mall?.name ?? (vendor?.mall as Mall | undefined)?.name ?? "America's Antique Mall";
  const mallCity  = mall?.city ?? (vendor?.mall as Mall | undefined)?.city ?? "Louisville, KY";

  return (
    <div style={{ minHeight: "100dvh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {vendor ? (
        <PublicVendorHero
          displayName={vendor.display_name}
          boothNumber={vendor.booth_number ?? null}
          mallName={mallName}
          mallCity={mallCity}
          heroImageUrl={vendor.hero_image_url as string | null | undefined}
          onBack={() => router.back()}
          onShare={handleShare}
          hasCopied={copied}
        />
      ) : (
        /* Hero skeleton */
        <div style={{ padding: "max(14px, env(safe-area-inset-top, 14px)) 10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
            <div className="skeleton-shimmer" style={{ width: 18, height: 18, borderRadius: "50%" }} />
            <div className="skeleton-shimmer" style={{ width: 120, height: 14, borderRadius: 6 }} />
          </div>
          <div className="skeleton-shimmer" style={{ borderRadius: 16, minHeight: 200, width: "100%" }} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <SkeletonGrid />
        ) : posts.length === 0 ? (
          <div style={{ padding: "60px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Heart size={28} style={{ color: colors.textFaint }} />
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.7, margin: 0 }}>
              Nothing on the shelf yet — check back soon.
            </p>
          </div>
        ) : (
          <>
            <TabSwitcher tab={tab} availableCount={available.length} foundCount={found.length} onChange={t => setTab(t)} />

            {tab === "available" && (
              <ThreeColGrid>
                {available.map((post, i) => <AvailableTile key={post.id} post={post} index={i} />)}
              </ThreeColGrid>
            )}

            {tab === "found" && (
              found.length > 0 ? (
                <ThreeColGrid>
                  {found.map((post, i) => <FoundTile key={post.id} post={post} index={i} />)}
                </ThreeColGrid>
              ) : (
                <div style={{ padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <Heart size={28} style={{ color: colors.textFaint }} />
                </div>
              )
            )}

            <BoothLocationCTA
              boothNumber={vendor?.booth_number ?? null}
              displayName={vendor?.display_name ?? ""}
              mallName={mallName}
              mallCity={mallCity}
              address={mall?.address ?? null}
            />
            <ExploreBanner />
            <div style={{ height: 12 }} />
          </>
        )}
      </div>

      <BottomNav active="shelves" flaggedCount={bookmarkCount} />

      <ShelfGridStyles />
    </div>
  );
}
