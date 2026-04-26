// app/flagged/page.tsx
// Find Map — session 70 redesign (docs/finds-map-redesign-design.md)
//
// Layout top-to-bottom:
//   1. StickyMasthead (Mode A): back · "Treehouse Finds" wordmark · empty right slot
//   2. MallScopeHeader (session 68) — eyebrow + tappable bold mall name + chevron;
//      only renders once the user has saves
//   3. FeaturedBanner (overlay variant) — admin-editable
//   4. Hairline divider (v1.1j) between banner and content sections
//   5. Sectioned list grouped by booth — each section is a BoothSection with:
//      - inkWash card header (small-caps `BOOTH NN` eyebrow + IM Fell 18px
//        vendor name; small mall subtitle ONLY when scope = "All malls" per D5);
//        whole card tappable → /shelf/[vendorSlug] when slug exists
//      - "N flagged finds" label below the card
//      - Tiles: 2-up grid (≤2) or horizontal scroll (≥3); session-69 unified
//        caption treatment preserved on FindTile
//
// Session 70 retirements (cartographic spine vocabulary):
//   - XGlyph at each stop — RETIRED
//   - Hairline tick connecting stops — RETIRED
//   - Closer "circle + tagline" footer — RETIRED
//   - 26px spine column — RETIRED
//   - BoothPill (session-69 carry-over) — RETIRED here
//   - Inline "Booth + pill" label row — replaced by Option B card-header treatment
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
import { getPostsByIds, getActiveMalls } from "@/lib/posts";
import { BOOKMARK_PREFIX, loadBookmarkCount } from "@/lib/utils";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import { track } from "@/lib/clientEvents";
import BottomNav from "@/components/BottomNav";
import MallSheet from "@/components/MallSheet";
import MallScopeHeader from "@/components/MallScopeHeader";
import StickyMasthead from "@/components/StickyMasthead";
import FeaturedBanner from "@/components/FeaturedBanner";
import type { Post, Mall } from "@/types/treehouse";

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
  mallName: string | null;
  mallCity: string | null;
  mallState: string | null;
  posts: Post[];
};

function groupByBooth(posts: Post[]): BoothGroup[] {
  const map = new Map<string, BoothGroup>();

  for (const post of posts) {
    const booth      = post.vendor?.booth_number ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    const vendorSlug = post.vendor?.slug;
    const mallName   = post.mall?.name ?? null;
    const mallCity   = post.mall?.city ?? null;
    const mallState  = post.mall?.state ?? null;
    const key        = post.vendor?.id ?? `__orphan__${post.id}`;
    if (!map.has(key)) map.set(key, { boothNumber: booth, vendorName, vendorSlug, mallName, mallCity, mallState, posts: [] });
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
          background: v1.inkWash,
          border: `1px solid ${v1.inkHairline}`,
          borderRadius: v1.imageRadius,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/5",
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
                filter:       TREEHOUSE_LENS_FILTER,
                WebkitFilter: TREEHOUSE_LENS_FILTER,
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

          <button
            onClick={handleUnsave}
            aria-label="Remove flag"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 36,
              height: 36,
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
            <FlagGlyph size={17} strokeWidth={1.7} style={{ color: v1.green, fill: v1.green }} />
          </button>
        </div>

        <div style={{ padding: "9px 10px 11px" }}>
          <div
            style={{
              fontFamily: FONT_IM_FELL,
              fontSize: 14,
              color: v1.inkPrimary,
              lineHeight: 1.2,
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
                marginTop: 3,
                fontFamily: FONT_SYS,
                fontSize: 12,
                color: v1.priceInk,
                lineHeight: 1.4,
                letterSpacing: "-0.005em",
              }}
            >
              ${Math.round(post.price_asking)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Booth section ─────────────────────────────────────────────────────────────
// Session 70 — cartographic spine retired. Each booth becomes a flat content
// section with a tappable inkWash card header carrying session-69 Option B
// vocabulary (small-caps `BOOTH NN` eyebrow + IM Fell vendor name). Mall name
// surfaces as a small subtitle in the card ONLY when the page scope is
// "All malls" (D5).
function BoothSection({
  group,
  scopeIsAllMalls,
  onUnsave,
}: {
  group: BoothGroup;
  scopeIsAllMalls: boolean;
  onUnsave: (id: string) => void;
}) {
  const useScroll = group.posts.length >= 3;
  const savedLabel = `${group.posts.length} flagged find${group.posts.length === 1 ? "" : "s"}`;

  const headerInner = (
    <div
      style={{
        background: v1.inkWash,
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 12,
      }}
    >
      {group.boothNumber ? (
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 9.5,
            fontWeight: 700,
            color: v1.inkMuted,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            marginBottom: 2,
            lineHeight: 1,
          }}
        >
          Booth {group.boothNumber}
        </div>
      ) : (
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 9.5,
            fontWeight: 700,
            color: v1.inkMuted,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            marginBottom: 2,
            lineHeight: 1,
          }}
        >
          No booth listed
        </div>
      )}
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 18,
          color: v1.inkPrimary,
          lineHeight: 1.25,
          letterSpacing: "-0.005em",
        }}
      >
        {group.vendorName}
      </div>
      {scopeIsAllMalls && group.mallName && (
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 11.5,
            color: v1.inkMuted,
            marginTop: 3,
            lineHeight: 1.4,
          }}
        >
          {group.mallName}
          {group.mallCity ? ` · ${group.mallCity}${group.mallState ? `, ${group.mallState}` : ""}` : ""}
        </div>
      )}
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{ paddingBottom: 22 }}
    >
      {group.vendorSlug ? (
        <Link
          href={`/shelf/${group.vendorSlug}`}
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {headerInner}
        </Link>
      ) : (
        headerInner
      )}

      <div
        style={{
          fontFamily: FONT_SYS,
          fontSize: 11.5,
          color: v1.inkMuted,
          marginBottom: 10,
          marginLeft: 2,
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
    </motion.section>
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
        No finds flagged yet
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
        Tap the flag on any find to add it to your find map.
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function FindMapPage() {
  const [posts,          setPosts]          = useState<Post[]>([]);
  const [malls,          setMalls]          = useState<Mall[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [bookmarkCount,  setBookmarkCount]  = useState(0);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [savedMallId,    setSavedMallId]    = useSavedMallId();
  const [mallSheetOpen,  setMallSheetOpen]  = useState(false);

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

  // Load active malls for the picker (cross-tab persisted mall filter).
  useEffect(() => {
    getActiveMalls().then(setMalls);
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

  function handleMallSelect(nextMallId: string | null) {
    setSavedMallId(nextMallId);
    setMallSheetOpen(false);
  }

  // Saves filtered by the cross-tab mall scope. When savedMallId is null the
  // user sees every save they have; otherwise the spine narrows to one mall.
  const filteredPosts = savedMallId
    ? posts.filter(p => p.mall_id === savedMallId)
    : posts;
  const groups = groupByBooth(filteredPosts);

  const selectedMall = malls.find(m => m.id === savedMallId) ?? null;

  // Per-mall save counts for the MallSheet picker (counted from all saves the
  // user has, independent of the active filter).
  const saveCountsByMall: Record<string, number> = {};
  for (const p of posts) {
    if (p.mall_id) saveCountsByMall[p.mall_id] = (saveCountsByMall[p.mall_id] ?? 0) + 1;
  }

  const scopeGeoLine = savedMallId && selectedMall
    ? { kind: "italic" as const, text: `${filteredPosts.length} ${filteredPosts.length === 1 ? "saved find" : "saved finds"}` }
    : { kind: "italic" as const, text: "Kentucky & Southern Indiana" };

  // Empty-state branch: user has saves, but the active mall filter excludes
  // all of them. Distinct from the "nothing saved yet" state below.
  const filterHidesAllSaves = savedMallId !== null && posts.length > 0 && filteredPosts.length === 0;

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
      {/* 1. StickyMasthead — session-70 locked-grid slot API */}
      <StickyMasthead
        left={
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
        }
      />

      {/* 2. Mall scope header — moved above the FeaturedBanner per session-68
          QA so the persisted mall filter is the first thing the eye lands on
          after the masthead. Only renders once we know the user has saves;
          a wholly empty saved-list shows the "Nothing saved yet" state and
          the EmptyState's own copy carries the page identity. */}
      {!loading && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.04, ease: EASE }}
        >
          <MallScopeHeader
            eyebrowAll="Flagged finds across"
            eyebrowOne="Flagged finds at"
            mallName={selectedMall?.name ?? null}
            geoLine={scopeGeoLine}
            onTap={() => setMallSheetOpen(true)}
          />
        </motion.div>
      )}

      {/* 3. FeaturedBanner (overlay variant) — admin-editable.
          Only renders when an image URL exists; otherwise collapses quietly.
          The "Find Map" fallback heading + intro voice paragraph were retired
          session 68 — page identity now comes from MallScopeHeader (when there
          are saves) or from EmptyState's own copy (when there are none). */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.08, ease: EASE }}
      >
        <FeaturedBanner
          variant="overlay"
          imageUrl={bannerImageUrl}
          minHeight={180}
          marginBottom={6}
        />
      </motion.div>

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
        ) : filterHidesAllSaves ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{
              margin: "20px 0",
              padding: "18px 20px",
              background: "rgba(255, 253, 248, 0.92)",
              border: `1px dashed rgba(122, 92, 30, 0.45)`,
              borderRadius: 10,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 15,
                color: v1.inkPrimary,
                lineHeight: 1.4,
              }}
            >
              No flagged finds at <span style={{ color: v1.green }}>{selectedMall?.name ?? "this mall"}</span>.
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: FONT_SYS,
                fontSize: 13,
                color: v1.inkMid,
                lineHeight: 1.5,
              }}
            >
              Flagged finds at other malls are hidden by the active filter.{" "}
              <button
                onClick={() => setSavedMallId(null)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: v1.green,
                  textDecoration: "underline",
                  fontFamily: FONT_SYS,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Show all malls
              </button>{" "}
              to see them.
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <BoothSection
                key={(group.boothNumber ?? "nb") + "·" + group.vendorName}
                group={group}
                scopeIsAllMalls={savedMallId === null}
                onUnsave={handleUnsave}
              />
            ))}
          </AnimatePresence>
        )}
      </main>

      <MallSheet
        open={mallSheetOpen}
        onClose={() => setMallSheetOpen(false)}
        malls={malls}
        activeMallId={savedMallId}
        onSelect={handleMallSelect}
        findCounts={saveCountsByMall}
        countUnit={{ singular: "saved find", plural: "saved finds" }}
      />

      <BottomNav active="flagged" flaggedCount={bookmarkCount} />
    </div>
  );
}
