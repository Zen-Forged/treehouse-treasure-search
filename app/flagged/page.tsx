// app/flagged/page.tsx
// Find Map — v1.1f (docs/design-system.md §Find Map, session 17)
//
// Layout top-to-bottom:
//   1. Masthead row (Mode A): back · "Treehouse Finds" wordmark · empty right slot
//   2. "Find Map" subheader (IM Fell 30px primary)
//   3. Intro voice (IM Fell italic 15px muted, one paragraph) — orients the page
//   4. Mall anchor — pin glyph + mall name (IM Fell 22px) + dotted-underline address
//   5. Diamond divider ◆
//   6. Itinerary spine — X glyph at each stop, hairline tick between stops
//      Per stop: [Booth [NNN pill]] → vendor italic → "N saved finds" → finds grid/scroll
//      Finds: 2-up grid when count ≤ 2; horizontal scroll when count ≥ 3
//      Each find: 4:5 photo (6px radius + inkHairline border) with frosted heart top-right,
//                 italic title, price in system-ui priceInk (or "Found a home" for sold)
//   7. Closer — diamond rule + "End of the map. Not the end of the search." (IM Fell 16px mid)
//
// v1.1f glyph hierarchy commitment:
//   pin = mall (appears once at top of page)
//   X   = booth (appears once per stop on the spine)
//
// Preserved from v0.2 /flagged (do not retire):
//   - localStorage bookmark scanning (BOOKMARK_PREFIX)
//   - Stale bookmark pruning (posts deleted in Supabase get removed from localStorage)
//   - Grouping by vendor, sorted by booth number
//   - Focus event refresh (visiting a find and returning rehydrates state)
//   - Unsave gesture (tap heart → remove bookmark → remove post from local state)
//   - BottomNav flaggedCount passthrough
//   - Skeleton loader
//
// Retired from v0.2 (no longer needed):
//   - "First stop / Next stop / Last stop" ordinal labels (visual order IS the order)
//   - EndOfPath component (closer replaces it)
//   - "Found a home" sort priority (sold items still render with grayscale at natural position)
//   - Dark-gradient booth pills, mono booth numbers, uppercase "BOOTH" labels
//   - Card chrome on find rows (paper-as-surface now)
//   - Green "View Booth" CTA (booth-row pill+label now handles that)
//   - Georgia serif (IM Fell committed as serif voice)

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { getPostsByIds } from "@/lib/posts";
import { BOOKMARK_PREFIX, loadBookmarkCount, mapsUrl } from "@/lib/utils";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

// ── v1.1f tokens (imported from lib/tokens.ts) ───
// Imported from lib/tokens.ts (canonical since session 19A). v1 palette +
// fonts match docs/design-system.md v1.1h.

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
  boothNumber: string | null; // null for orphaned posts with no booth
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

  // Sort within each group: available first, sold last
  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    posts: [
      ...g.posts.filter((p) => p.status !== "sold"),
      ...g.posts.filter((p) => p.status === "sold"),
    ],
  }));

  // Sort stops: by booth number (numeric-aware), no-booth stops last
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
  // Mall glyph. Matches Find Detail's pin; larger here because it's the page anchor.
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
  // Booth glyph. Same shape as Find Detail's vendor-row X.
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="3"  x2="13" y2="13" stroke={v1.inkPrimary} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="3" x2="3"  y2="13" stroke={v1.inkPrimary} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Booth pill (numeric badge, matches Find Detail vendor row v1.1f) ──────────
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
        fontFamily: FONT_IM_FELL,
        fontSize: 16,
        color: v1.pillInk,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ── Find tile (photo + heart + title + price) ─────────────────────────────────
function FindTile({
  post,
  onUnsave,
  widthMode,
}: {
  post: Post;
  onUnsave: (id: string) => void;
  widthMode: "grid" | "scroll"; // grid = takes full grid column; scroll = fixed width for horizontal scroll
}) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  function handleUnsave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeBookmark(post.id);
    onUnsave(post.id);
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
        }}
      >
        {hasImg ? (
          <img
            src={post.image_url!}
            alt={post.title}
            loading="lazy"
            onError={() => setImgErr(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: isSold ? "grayscale(0.5) brightness(0.88)" : "none",
              opacity: isSold ? 0.62 : 1,
            }}
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

        {/* Frosted heart — top-right. Always filled green (this page is the saved list) */}
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
          <Heart size={14} strokeWidth={0} style={{ color: v1.green, fill: v1.green }} />
        </button>
      </div>

      {/* Title (IM Fell italic) */}
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

      {/* Price (system-ui, priceInk) — or "Found a home" for sold */}
      {isSold ? (
        <div
          style={{
            marginTop: 2,
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 12.5,
            color: v1.inkMuted,
            lineHeight: 1.4,
          }}
        >
          Found a home
        </div>
      ) : typeof post.price_asking === "number" && post.price_asking > 0 ? (
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
      ) : null}
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
      {/* Spine column: X glyph + hairline tick down */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 6 }}>
        <XGlyph size={18} />
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              minHeight: 60,
              background: v1.inkHairline,
              marginTop: 8,
            }}
          />
        )}
      </div>

      {/* Content column */}
      <div style={{ minWidth: 0 }}>
        {/* Booth row: label + numeric pill, wrapped in Link to /shelf/[slug] */}
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

        {/* Vendor name */}
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 18,
            color: v1.inkMid,
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {group.vendorName}
        </div>

        {/* Saved count */}
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

        {/* Finds — grid or horizontal scroll */}
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

// ══════════════════════════════════════════════════════════════════════════════
export default function FindMapPage() {
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [bookmarkCount, setBookmarkCount] = useState(0);

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

  useEffect(() => { syncCount(); loadPosts(); }, []);

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

  // Mall anchor — derive from the first post with a mall. In production today every
  // saved find will be at America's Antique Mall, but we derive rather than hard-code
  // so the page stays correct when multi-mall ships.
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
      {/* ── 1. Masthead (Mode A) ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: EASE }}
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
      </motion.div>

      {/* ── 2. "Find Map" subheader ──────────────────────────────────────── */}
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

      {/* ── 3. Intro voice ───────────────────────────────────────────────── */}
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
            fontSize: 15,
            color: v1.inkMuted,
            lineHeight: 1.65,
          }}
        >
          Your saved finds are mapped below. Each one is waiting in its place, ready when you are.
        </div>
      </motion.div>

      {/* ── 4. Mall anchor (pin + name + address) ────────────────────────── */}
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

      {/* ── 5. Diamond divider (only when we have content below) ─────────── */}
      {!loading && groups.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.34, delay: 0.16, ease: EASE }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 44px 18px",
          }}
        >
          <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
          <div
            style={{
              fontFamily: FONT_IM_FELL,
              fontSize: 11,
              color: "rgba(42,26,10,0.42)",
              lineHeight: 1,
            }}
          >
            ◆
          </div>
          <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
        </motion.div>
      )}

      {/* ── 6. Itinerary / loading / empty ───────────────────────────────── */}
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

            {/* ── 7. Closer ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay: 0.24, ease: EASE }}
              style={{ paddingTop: 28, textAlign: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 22px 22px",
                }}
              >
                <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontSize: 11,
                    color: "rgba(42,26,10,0.42)",
                    lineHeight: 1,
                  }}
                >
                  ◆
                </div>
                <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
              </div>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontSize: 16,
                  color: v1.inkMid,
                  lineHeight: 1.4,
                  letterSpacing: "-0.005em",
                  padding: "0 28px",
                }}
              >
                End of the map. Not the end of the search.
              </div>
            </motion.div>
          </>
        )}
      </main>

      <BottomNav active="flagged" flaggedCount={bookmarkCount} />
    </div>
  );
}
