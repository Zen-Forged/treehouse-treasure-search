// app/flagged/page.tsx
// Find Map — v1.1l (docs/design-system.md §Find Map, sessions 17 + 22A + 24)
//
// Layout top-to-bottom (v1.1l):
//   1. StickyMasthead (Mode A): back · "Treehouse Finds" wordmark · empty right slot
//   2. FeaturedBanner (overlay variant) — admin-editable hero with "Find Map"
//      title overlaid in IM Fell 30px white. REPLACES the v1.1g "Find Map"
//      30px subheader; the banner now carries the page-title surface.
//      Banner only renders if an image is set in site_settings; otherwise
//      the page collapses past it.
//   3. Intro voice (IM Fell italic 16px muted, one paragraph) — orients the page
//   4. Mall anchor — pin glyph + mall name (IM Fell 22px) + dotted-underline address
//   5. Hairline divider (v1.1j — diamond retired)
//   6. Itinerary spine — X glyph at each stop (strokeWidth 2.2, v1.1l), hairline
//      tick between stops AND beneath the last stop (v1.1l — continuous spine
//      to the closer), `Booth [NNN pill]` → vendor name (non-italic, v1.1l) →
//      "N saved finds" → finds grid/scroll. Finds: 2-up grid (≤2) or horizontal
//      scroll (≥3). Each find: 4:5 photo, frosted heart, title, price.
//   7. Closer — v1.1l restructured: circle + tagline copy share one grid row,
//      vertically centered. Copy is the product tagline anchor.
//
// v1.1l changes (from session 24 David on-device walk):
//   - StickyMasthead replaces inline sticky chrome (scroll-linked hairline)
//   - FeaturedBanner overlay variant replaces the "Find Map" subheader
//   - Spine connects the last stop to the closer (no more empty-space drop)
//   - Closer: circle + copy share one row (vertically centered)
//   - Closer copy: "Embrace the Search. Treasure the Find." (tagline surfacing)
//   - X strokeWidth 1.5 → 2.2 (match terminal circle weight)
//   - Vendor name italic retires (parity with non-italic mall name)
//
// v1.1f glyph hierarchy commitment (unchanged):
//   pin = mall (appears once at top of page)
//   X   = booth (appears once per stop on the spine)
//
// Preserved from v0.2 /flagged (do not retire):
//   - localStorage bookmark scanning (BOOKMARK_PREFIX)
//   - Stale bookmark pruning
//   - Grouping by vendor, sorted by booth number
//   - Focus event refresh
//   - Unsave gesture
//   - BottomNav flaggedCount passthrough
//   - Skeleton loader

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import FlagGlyph from "@/components/FlagGlyph";
import { getPostsByIds } from "@/lib/posts";
import { BOOKMARK_PREFIX, loadBookmarkCount, mapsUrl } from "@/lib/utils";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import { track } from "@/lib/clientEvents";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import FeaturedBanner from "@/components/FeaturedBanner";
import type { Post } from "@/types/treehouse";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// ── Bookmark helpers (raw localStorage per tech rules) ─────────────────────────

function loadFlaggedIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") {
        ids.push(key.slice(BOOKMARK_PREFIX.length));
      }
    }
  } catch {}
  return ids;
}

function removeBookmark(postId: string) {
  try { localStorage.removeItem(`${BOOKMARK_PREFIX}${postId}`); } catch {}
}

function pruneStaleBookmarks(savedIds: string[], returnedIds: string[]) {
  const returnedSet = new Set(returnedIds);
  for (const id of savedIds) {
    if (!returnedSet.has(id)) removeBookmark(id);
  }
}

// ── Grouping ───────────────────────────────────────────────────────────────────

type BoothGroup = {
  boothNumber: string | null;
  vendorName: string;
  vendorSlug?: string;
  posts: Post[];
};

function groupByBooth(posts: Post[]): BoothGroup[] {
  const map = new Map<string, BoothGroup>();

  for (const post of posts) {
    const booth      = post.vendor?.booth_number ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    const vendorSlug = post.vendor?.slug;
    const key        = post.vendor?.id ?? `__orphan__${post.id}`;
    if (!map.has(key)) map.set(key, { boothNumber: booth, vendorName, vendorSlug, posts: [] });
    map.get(key)!.posts.push(post);
  }

  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    posts: [
      ...g.posts.filter((p) => p.status !== "sold"),
      ...g.posts.filter((p) => p.status === "sold"),
    ],
  }));

  return groups.sort((a, b) => {
    if (!a.boothNumber && b.boothNumber) return 1;
    if (a.boothNumber && !b.boothNumber) return -1;
    if (!a.boothNumber && !b.boothNumber) return a.vendorName.localeCompare(b.vendorName);
    const cmp = a.boothNumber!.localeCompare(b.boothNumber!, undefined, { numeric: true });
    return cmp !== 0 ? cmp : a.vendorName.localeCompare(b.vendorName);
  });
}

// ── Glyph primitives ───────────────────────────────────────────────────────────
function PinGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * (22 / 18)} viewBox="0 0 18 22" fill="none" aria-hidden="true">
      <path
        d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z"
        stroke={v1.inkPrimary}
        strokeWidth="1.3"
        fill="none"
      />
      <circle cx="9" cy="8.3" r="2" fill={v1.inkPrimary} />
    </svg>
  );
}

function XGlyph({ size = 18 }: { size?: number }) {
  // v1.1l — strokeWidth 1.5 → 2.2 to match the weight of the terminal 16px
  // filled circle at the closer; the two anchor points now read as a matched
  // pair along the spine. Same bump applied to Find Detail's vendor-row X.
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="3"  x2="13" y2="13" stroke={v1.inkPrimary} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="13" y1="3" x2="3"  y2="13" stroke={v1.inkPrimary} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Booth pill (numeric badge) ────────────────────────────────────────────────
function BoothPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 999,
        background: v1.pillBg,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        border: `1.5px solid ${v1.pillBorder}`,
        fontFamily: FONT_SYS,
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        color: v1.pillInk,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ── Find tile ─────────────────────────────────────────────────────────────────
function FindTile({
  post,
  onUnsave,
  widthMode,
}: {
  post: Post;
  onUnsave: (id: string) => void;
  widthMode: "grid" | "scroll";
}) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;

  function handleUnsave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeBookmark(post.id);
    onUnsave(post.id);
    // R3 — emit post_unsaved from the saved-list heart-tap. The natural place
    // a shopper unsaves a find is here, not back on /find/[id].
    track("post_unsaved", { post_id: post.id });
  }

  const tileStyle: React.CSSProperties =
    widthMode === "scroll"
      ? { flexShrink: 0, width: "42vw", maxWidth: 170, scrollSnapAlign: "start" }
      : {};

  return (
    <Link
      href={`/find/${post.id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block", ...tileStyle }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/5",
          borderRadius: v1.imageRadius,
          border: `1px solid ${v1.inkHairline}`,
          overflow: "hidden",
          background: v1.postit,
          boxShadow: "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)",
        }}
      >
        {hasImg ? (
          <img
            src={post.image_url!}
            alt={post.title}
            loading="lazy"
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 13,
              color: v1.inkFaint,
            }}
          >
            no photograph
          </div>
        )}

        <button
          onClick={handleUnsave}
          aria-label="Remove from saved"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "rgba(232,221,199,0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: `0.5px solid rgba(42,26,10,0.12)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            zIndex: 2,
          }}
        >
          <FlagGlyph size={14} strokeWidth={1.7} style={{ color: v1.green, fill: v1.green }} />
        </button>
      </div>

      <div
        style={{
          marginTop: 6,
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMid,
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
        }}
      >
        {post.title}
      </div>

      {typeof post.price_asking === "number" && post.price_asking > 0 && (
        <div
          style={{
            marginTop: 2,
            fontFamily: FONT_SYS,
            fontSize: 13,
            color: v1.priceInk,
            lineHeight: 1.4,
            letterSpacing: "-0.005em",
          }}
        >
          ${Math.round(post.price_asking)}
        </div>
      )}
    </Link>
  );
}

// ── Stop ──────────────────────────────────────────────────────────────────────
function Stop({
  group,
  isLast,
  onUnsave,
}: {
  group: BoothGroup;
  isLast: boolean;
  onUnsave: (id: string) => void;
}) {
  const useScroll = group.posts.length >= 3;
  const savedLabel = `${group.posts.length} saved find${group.posts.length === 1 ? "" : "s"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{
        display: "grid",
        gridTemplateColumns: "26px 1fr",
        columnGap: 14,
        paddingBottom: isLast ? 0 : 30,
      }}
    >
      {/* Spine column: X + hairline tick.
          v1.1l — the tick ALSO renders beneath the last stop so the spine
          connects visually to the closer circle instead of trailing off. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 6 }}>
        <XGlyph size={18} />
        <div
          style={{
            width: 1,
            flex: 1,
            minHeight: isLast ? 28 : 60,
            background: v1.inkHairline,
            marginTop: 8,
          }}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        {group.boothNumber ? (
          group.vendorSlug ? (
            <Link
              href={`/shelf/${group.vendorSlug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "inherit",
                marginBottom: 8,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontFamily: FONT_SYS, fontSize: 14, color: v1.inkMuted, lineHeight: 1.55 }}>
                Booth
              </span>
              <BoothPill>{group.boothNumber}</BoothPill>
            </Link>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span style={{ fontFamily: FONT_SYS, fontSize: 14, color: v1.inkMuted, lineHeight: 1.55 }}>
                Booth
              </span>
              <BoothPill>{group.boothNumber}</BoothPill>
            </div>
          )
        ) : (
          <div
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 15,
              color: v1.inkMuted,
              marginBottom: 8,
            }}
          >
            No booth listed
          </div>
        )}

        {/* Vendor name — v1.1l italic retired; IM Fell non-italic brings the
            vendor name into parity with the mall name above (both are places
            in the cartographic reading, not voices). */}
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 18,
            color: v1.inkMid,
            lineHeight: 1.3,
            marginBottom: 4,
            letterSpacing: "-0.005em",
          }}
        >
          {group.vendorName}
        </div>

        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 12.5,
            color: v1.inkMuted,
            marginBottom: 12,
          }}
        >
          {savedLabel}
        </div>

        {useScroll ? (
          <div
            className="hide-scrollbar"
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: 4,
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {group.posts.map((post) => (
              <FindTile key={post.id} post={post} onUnsave={onUnsave} widthMode="scroll" />
            ))}
            <div style={{ flexShrink: 0, width: 10 }} />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {group.posts.map((post) => (
              <FindTile key={post.id} post={post} onUnsave={onUnsave} widthMode="grid" />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: EASE }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 32px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 24,
          color: v1.inkPrimary,
          lineHeight: 1.3,
          marginBottom: 12,
        }}
      >
        Nothing saved yet
      </div>
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 15,
          color: v1.inkMuted,
          lineHeight: 1.65,
          maxWidth: 280,
        }}
      >
        Tap the heart on any find to save it here. Your trip comes together as you go.
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function FindMapPage() {
  const [posts,          setPosts]          = useState<Post[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [bookmarkCount,  setBookmarkCount]  = useState(0);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);

  function syncCount() { setBookmarkCount(loadBookmarkCount()); }

  async function loadPosts() {
    const ids = loadFlaggedIds();
    if (ids.length === 0) { setPosts([]); setLoading(false); return; }
    const data = await getPostsByIds(ids);
    if (data.length < ids.length) {
      pruneStaleBookmarks(ids, data.map(p => p.id));
      setBookmarkCount(loadBookmarkCount());
    }
    setPosts(data);
    setLoading(false);
  }

  // Load banner URL on mount — fire-and-forget, banner renders null when absent.
  useEffect(() => {
    getSiteSettingUrl("find_map_banner_image_url").then(setBannerImageUrl);
  }, []);

  useEffect(() => { syncCount(); loadPosts(); }, []);

  // R3 — page_viewed analytics event. saved_count is captured at view time
  // (not later) so the payload reflects the user's saved-items state on the
  // visit itself.
  useEffect(() => {
    track("page_viewed", { path: "/flagged", saved_count: loadBookmarkCount() });
  }, []);

  useEffect(() => {
    function onFocus() { syncCount(); loadPosts(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function handleUnsave(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setBookmarkCount(prev => Math.max(0, prev - 1));
  }

  const groups = groupByBooth(posts);

  const mall = posts.find((p) => p.mall)?.mall ?? null;
  const mallLink = mall?.address
    ? mapsUrl(mall.address)
    : mall
    ? mapsUrl(`${mall.name} ${mall.city} ${mall.state}`)
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. StickyMasthead (Mode A) */}
      <StickyMasthead
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "max(14px, env(safe-area-inset-top, 14px)) 18px 14px",
          gap: 12,
        }}
      >
        <div style={{ justifySelf: "start" }}>
          <button
            onClick={() => history.back()}
            aria-label="Go back"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: v1.iconBubble,
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={18} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </button>
        </div>
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 18,
            color: v1.inkPrimary,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
          }}
        >
          Treehouse Finds
        </div>
        <div style={{ justifySelf: "end" }} aria-hidden="true" />
      </StickyMasthead>

      {/* 2. FeaturedBanner (overlay variant) — v1.1l replaces the "Find Map" subheader.
          Only renders when an image URL exists; otherwise collapses quietly. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.04, ease: EASE }}
      >
        <FeaturedBanner
          variant="overlay"
          imageUrl={bannerImageUrl}
          minHeight={180}
          marginBottom={6}
        />
      </motion.div>

      {/* Fallback page title when no banner image is set — so the page still
          has an identity. Hidden when the banner renders. */}
      {!bannerImageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.04, ease: EASE }}
          style={{ padding: "10px 22px 4px" }}
        >
          <div
            style={{
              fontFamily: FONT_IM_FELL,
              fontSize: 30,
              color: v1.inkPrimary,
              lineHeight: 1.15,
              letterSpacing: "-0.005em",
            }}
          >
            Find Map
          </div>
        </motion.div>
      )}

      {/* 3. Intro voice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.08, ease: EASE }}
        style={{ padding: "10px 22px 0" }}
      >
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 16,
            color: v1.inkMuted,
            lineHeight: 1.65,
          }}
        >
          Your saved finds are mapped below. Each one is waiting in its place, ready when you are.
        </div>
      </motion.div>

      {/* 4. Mall anchor (pin + name + address) */}
      {!loading && mall && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.12, ease: EASE }}
          style={{ paddingTop: 18, paddingBottom: 6 }}
        >
          <div
            style={{
              padding: "0 22px 6px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 22 }}>
              <PinGlyph size={22} />
            </div>
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontSize: 22,
                color: v1.inkPrimary,
                lineHeight: 1.2,
                letterSpacing: "-0.005em",
              }}
            >
              {mall.name}
            </div>
          </div>
          {mall.address && (
            <div style={{ paddingLeft: 56, paddingRight: 22 }}>
              {mallLink ? (
                <a
                  href={mallLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: FONT_SYS,
                    fontSize: 14,
                    color: v1.inkMuted,
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textDecorationColor: v1.inkFaint,
                    textUnderlineOffset: 3,
                    lineHeight: 1.55,
                  }}
                >
                  {mall.address}
                </a>
              ) : (
                <span
                  style={{
                    fontFamily: FONT_SYS,
                    fontSize: 14,
                    color: v1.inkMuted,
                    lineHeight: 1.55,
                  }}
                >
                  {mall.address}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* 5. Hairline divider (v1.1j — diamond retired) */}
      {!loading && groups.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.34, delay: 0.16, ease: EASE }}
          style={{ padding: "14px 44px 18px" }}
        >
          <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
        </motion.div>
      )}

      {/* 6. Itinerary / loading / empty */}
      <main
        style={{
          padding: "0 22px",
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
          flex: 1,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 20 }}>
            {[140, 190, 120].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 8 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <AnimatePresence initial={false}>
              {groups.map((group, i) => (
                <Stop
                  key={(group.boothNumber ?? "nb") + "·" + group.vendorName}
                  group={group}
                  isLast={i === groups.length - 1}
                  onUnsave={handleUnsave}
                />
              ))}
            </AnimatePresence>

            {/* 7. Closer — v1.1l:
                - Circle + copy share ONE grid row (vertically centered)
                - Spine line from the last stop now flows into the circle
                - Copy: tagline anchor ("Embrace the Search. Treasure the Find.") */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay: 0.24, ease: EASE }}
              style={{
                display: "grid",
                gridTemplateColumns: "26px 1fr",
                columnGap: 14,
                alignItems: "center",
                paddingTop: 0,
                paddingBottom: 12,
              }}
            >
              {/* Spine column — 16px filled circle (terminal anchor) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: v1.inkPrimary,
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Copy column — tagline fragment, vertically aligned with circle */}
              <div
                style={{
                  fontFamily: FONT_SYS,
                  fontSize: 15,
                  fontWeight: 400,
                  color: v1.inkMid,
                  lineHeight: 1.5,
                  letterSpacing: "-0.005em",
                }}
              >
                Embrace the Search. Treasure the Find.
              </div>
            </motion.div>
          </>
        )}
      </main>

      <BottomNav active="flagged" flaggedCount={bookmarkCount} />
    </div>
  );
}
