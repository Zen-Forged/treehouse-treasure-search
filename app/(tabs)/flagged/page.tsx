// app/flagged/page.tsx
// Session 99 — destination redesign per docs/flagged-destination-design.md.
// Each booth becomes a self-contained destination container with horizontal
// find rows inside and an "Explore the booth →" CTA at the footer. Replaces
// the session-70 cartographic-spine + session-82 BoothLockupCard + session-89
// 3-col grid layout.
//
// Behavior change: booth-bookmark glyph (session 82) is no longer surfaced on
// /flagged. Booth-bookmarking remains accessible from /shelf/[slug] where it's
// the primary interaction. /flagged is now scoped to "places I saved finds at,"
// and the destination affordance is the footer "Explore the booth →" CTA.
//
// Preserved:
//   - Grouping by vendor, sorted by booth number
//   - Per-find unsave gesture (now via 18px leaf bubble on polaroid thumbnail)
//   - BottomNav passthrough, skeleton loader
//   - Scroll-restore (SCROLL_KEY)
//   - Track D preview-cache on tap (treehouse_find_preview:${id})
//   - R3 events: page_viewed, post_unsaved, filter_applied
//   - flagged_booth_explored R3 event on CTA tap
//
// R1 Arc 4: save state via useShopperSaves hook (DB if authed,
// localStorage if guest). Stale-prune still runs for both branches —
// hook.toggle handles both writes idempotently.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
// Chrome (TabPageMasthead + PostcardMallCard + BottomNav + MallSheet) lives
// in app/(tabs)/layout.tsx as of session 109 — flicker-eliminating shared
// layout. This page renders only the page body (banner + find groups).
import { getPostsByIds, getActiveMalls } from "@/lib/posts";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useShopperAuth } from "@/lib/useShopperAuth";
import { useShopperSaves } from "@/lib/useShopperSaves";
import {
  v1,
  FONT_LORA,
  FONT_NUMERAL,
} from "@/lib/tokens";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import { track } from "@/lib/clientEvents";
import { writeFindContext, setPostCache, type FindRef } from "@/lib/findContext";
import FeaturedBanner from "@/components/FeaturedBanner";
import PolaroidTile from "@/components/PolaroidTile";
import EmptyStatePrimitive from "@/components/EmptyState";
import RichPostcardMallCard from "@/components/RichPostcardMallCard";
import FormButton from "@/components/FormButton";
import DistancePill from "@/components/DistancePill";
import { milesFromUser } from "@/lib/distance";
import { useUserLocation } from "@/lib/useUserLocation";
import type { Post, Mall } from "@/types/treehouse";

// Session 85 — back-nav scroll anchoring. Module-scope cache survives
// /find/[id] navigation (App Router unmounts the page; module scope persists
// for the SPA session). SCROLL_KEY persists scroll position across the same
// boundary.
const SCROLL_KEY = "treehouse_flagged_scroll";
let cachedFlaggedPosts: Post[] | null = null;

// ── Grouping ───────────────────────────────────────────────────────────────────

type BoothGroup = {
  vendorId:    string | null;
  boothNumber: string | null;
  vendorName:  string;
  vendorSlug?: string;
  mallId:      string | null;
  mallName:    string | null;
  mallLat:     number | null;
  mallLng:     number | null;
  posts:       Post[];
};

function groupByBooth(posts: Post[]): BoothGroup[] {
  const map = new Map<string, BoothGroup>();
  for (const post of posts) {
    const booth      = post.vendor?.booth_number ?? null;
    const vendorId   = post.vendor?.id ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    const vendorSlug = post.vendor?.slug;
    const mallId     = post.mall_id ?? null;
    const mallName   = post.mall?.name ?? null;
    const mallLat    = post.mall?.latitude ?? null;
    const mallLng    = post.mall?.longitude ?? null;
    const key        = vendorId ?? `__orphan__${post.id}`;
    if (!map.has(key)) map.set(key, { vendorId, boothNumber: booth, vendorName, vendorSlug, mallId, mallName, mallLat, mallLng, posts: [] });
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

// ── Booth destination container ───────────────────────────────────────────────
// Single callsite — kept inline per the design record (extract on 2nd
// callsite per project pattern, sessions 83 + 95).
function BoothDestinationContainer({
  group,
  scopeIsAllMalls,
  flatFindRefs,
}: {
  group: BoothGroup;
  scopeIsAllMalls: boolean;
  // Phase C — the FULL ordered list of saved finds in the user's current
  // /flagged view (mall-scope-filtered, flattened across booth groups).
  // Tap on a row writes this as the swipe-nav context so the user can
  // swipe across all their saved finds, not just within one booth.
  flatFindRefs: FindRef[];
}) {
  const showMallSubtitle = scopeIsAllMalls && !!group.mallName;

  function handleTileTap(post: Post) {
    // Preview-cache write — same shape as Home + session 99 baseline. Lets
    // /find/[id]'s photograph paint synchronously on first commit.
    if (post.image_url) {
      try {
        sessionStorage.setItem(
          `treehouse_find_preview:${post.id}`,
          JSON.stringify({ image_url: post.image_url, title: post.title }),
        );
      } catch {}
    }
    // Phase C swipe-nav handoff — write the context blob with cursor at
    // this post's position in the flattened saved-finds list. /find/[id]
    // reads this on mount and exposes prev/next ids for the drag gesture.
    const cursor = flatFindRefs.findIndex((r) => r.id === post.id);
    writeFindContext({
      originPath: "/flagged",
      findRefs: flatFindRefs,
      cursorIndex: cursor >= 0 ? cursor : 0,
    });
  }

  function handleExploreBooth() {
    track("flagged_booth_explored", {
      vendor_id:         group.vendorId,
      vendor_slug:       group.vendorSlug ?? null,
      mall_id:           group.mallId,
      save_count_at_tap: group.posts.length,
    });
  }

  return (
    <article
      style={{
        background: v1.paperWarm,
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(42, 26, 10, 0.05)",
      }}
    >
      {/* Booth header (D3) */}
      <header
        style={{
          padding: "13px 16px 12px",
          borderBottom: `1px solid ${v1.inkHairline}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              flex: 1,
              fontFamily: FONT_LORA,
              fontWeight: 500,
              fontSize: 21,
              color: v1.inkPrimary,
              lineHeight: 1.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {group.vendorName}
          </div>
          {group.boothNumber && (
            <div
              style={{
                flexShrink: 0,
                fontFamily: FONT_NUMERAL,
                fontWeight: 500,
                color: v1.green,
                fontSize: 21,
                lineHeight: 1.2,
              }}
            >
              {group.boothNumber}
            </div>
          )}
        </div>

        {/* All-Kentucky-Locations scope subtitle (mall name when scope spans
            multiple malls — preserves session-70 D5 carry-forward). */}
        {showMallSubtitle && (
          <div
            style={{
              marginTop: 4,
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 13,
              color: v1.inkMuted,
              lineHeight: 1.4,
            }}
          >
            at {group.mallName}
          </div>
        )}
      </header>

      {/* Find rows (D4) — horizontal: polaroid thumbnail + title + price */}
      {group.posts.map((post) => (
        <Link
          key={post.id}
          href={`/find/${post.id}`}
          onClick={() => handleTileTap(post)}
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "block",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: `1px solid ${v1.inkHairline}`,
            }}
          >
            {/* Polaroid thumbnail — 62px wrapper. Leaf bubble retired
                session 99 iPhone QA: hit area too small + redundant on a
                page where every find is by definition saved. Unsave path
                now lives only on /find/[id]; focus event re-syncs /flagged
                state on return. */}
            <div style={{ width: 62, flexShrink: 0 }}>
              <PolaroidTile
                src={post.image_url ?? ""}
                alt={post.title}
                bottomMat="inside"
                loading="lazy"
                fallback={
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONT_LORA,
                      fontStyle: "italic",
                      fontSize: 9,
                      color: v1.inkFaint,
                      textAlign: "center",
                      padding: "0 4px",
                      lineHeight: 1.3,
                    }}
                  >
                    no photograph
                  </div>
                }
              />
            </div>

            {/* Title — Lora 14, 3-line clamp */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: FONT_LORA,
                fontWeight: 400,
                fontSize: 14,
                color: v1.inkPrimary,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.title}
            </div>

            {/* Price — Lora 14 priceInk, top-aligned to title's first line */}
            {typeof post.price_asking === "number" && post.price_asking > 0 && (
              <div
                style={{
                  flexShrink: 0,
                  fontFamily: FONT_LORA,
                  fontWeight: 500,
                  fontSize: 14,
                  color: v1.priceInk,
                  alignSelf: "flex-start",
                  paddingTop: 1,
                }}
              >
                ${Math.round(post.price_asking)}
              </div>
            )}
          </div>
        </Link>
      ))}

      {/* Footer "Explore the booth →" CTA (D6) — outlined green button,
          inside the booth container, under the last find row. Routes to
          /shelf/[slug] (shopper-facing booth window). Inline-not-extracted
          per the design record (single callsite for now). */}
      {group.vendorSlug && (
        <Link
          href={`/shelf/${group.vendorSlug}`}
          onClick={handleExploreBooth}
          style={{
            textDecoration: "none",
            margin: 12,
            padding: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            border: `1px solid ${v1.green}`,
            background: v1.paperWarm,
            color: v1.green,
            fontFamily: FONT_LORA,
            fontWeight: 500,
            fontSize: 14,
            borderRadius: 8,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Explore the booth <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>→</span>
        </Link>
      )}
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
function FlaggedPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Session 120 — q state for rich-card search bar. Mirrors Home's R16
  // pattern: initial value pulled from URL so /flagged?q=brass deep-links
  // restore a search context, debounced through SearchBar (200ms), and
  // written back to ?q= via router.replace so browser-back works cleanly.
  // Filtering is CLIENT-side here (saved sets are typically <200 items;
  // server-side searchPosts isn't worth the round trip).
  const initialQ                              = searchParams.get("q") ?? "";
  const [q,               setQ]               = useState<string>(initialQ);
  const [posts,           setPosts]           = useState<Post[]>(cachedFlaggedPosts ?? []);
  const [malls,           setMalls]           = useState<Mall[]>([]);
  const [loading,         setLoading]         = useState<boolean>(cachedFlaggedPosts === null);
  const [bannerImageUrl,  setBannerImageUrl]  = useState<string | null>(null);
  const [savedMallId]                         = useSavedMallId();
  const shopperAuth                            = useShopperAuth();
  const saves                                  = useShopperSaves();
  const userLoc                                = useUserLocation();
  // setSavedMallId + mallSheetOpen retired (R10 session 107) — scope change
  // moved to /map.
  const pendingScrollY = useRef<number | null>(null);
  const scrollRestored = useRef(false);

  useEffect(() => {
    getSiteSettingUrl("find_map_banner_image_url").then(setBannerImageUrl);
  }, []);

  useEffect(() => {
    getActiveMalls().then(setMalls);
  }, []);

  // Re-fetch posts whenever the save set changes — auth-state transitions
  // (sign-in flips the hook from localStorage to DB) and cross-page
  // toggles broadcast through useShopperSaves's custom event.
  useEffect(() => {
    if (saves.isLoading) return;
    let cancelled = false;
    const ids = Array.from(saves.ids);
    if (ids.length === 0) {
      setPosts([]);
      cachedFlaggedPosts = [];
      setLoading(false);
      return;
    }
    getPostsByIds(ids).then((data) => {
      if (cancelled) return;
      // Stale-prune: a save references a post that no longer exists.
      // toggle handles localStorage + DB correctly (DB FK cascade is
      // usually one step ahead, making this a no-op for authed; for
      // guests this clears the dead localStorage key).
      if (data.length < ids.length) {
        const returned = new Set(data.map((p) => p.id));
        for (const id of ids) {
          if (!returned.has(id)) saves.toggle(id, false);
        }
      }
      setPosts(data);
      cachedFlaggedPosts = data;
      // Phase C — populate the shared post cache for instant tap-to-detail
      // metadata paint when the user steps into any saved find. Mirrors
      // Home loadFeed's setPostCache loop. The cache is shared across the
      // detail page's swipe-nav handoff via lib/findContext.
      for (const p of data) setPostCache(p);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [saves.ids, saves.isLoading]);

  useEffect(() => {
    track("page_viewed", { path: "/flagged", saved_count: saves.ids.size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) pendingScrollY.current = y;
      }
    } catch {}

    function onScroll() {
      try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY))); } catch {}
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (scrollRestored.current) return;
    if (pendingScrollY.current === null) return;
    scrollRestored.current = true;
    const y = pendingScrollY.current;
    requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); });
  }, [loading]);

  // handleMallSelect retired on /flagged (R10 session 107) — scope change
  // moved to /map. The `filter_applied` analytics event with page='/flagged'
  // no longer fires; /map fires the event with page='/map'. Cross-tab
  // filter persistence still flows through useSavedMallId.

  const filteredPosts = savedMallId
    ? posts.filter(p => p.mall_id === savedMallId)
    : posts;

  // Session 120 — apply search query against title + tags + caption.
  // Case-insensitive contains-match. R16's tsvector/GIN search lives on
  // /api/search via searchPosts; for the saved set we have everything in
  // memory already so client-side is faster than a round trip.
  const trimmedQ = q.trim().toLowerCase();
  const searchedPosts = trimmedQ === ""
    ? filteredPosts
    : filteredPosts.filter((p) => {
        const haystack = [
          p.title?.toLowerCase() ?? "",
          p.caption?.toLowerCase() ?? "",
          ...(p.tags ?? []).map((t) => t.toLowerCase()),
        ].join(" ");
        return haystack.includes(trimmedQ);
      });
  const groups = groupByBooth(searchedPosts);

  // Session 120 — handleSearchChange writes through to ?q= URL state,
  // mirrors Home's debounced replace pattern so browser-back works.
  // SearchBar internally debounces 200ms before firing this callback.
  const handleSearchChange = (next: string) => {
    setQ(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim().length > 0) params.set("q", next);
    else                        params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/flagged?${qs}` : "/flagged", { scroll: false });
  };

  // Phase C — flat ordered ref list passed to each BoothDestinationContainer
  // so a tap on any find row writes the swipe-nav context with the full
  // mall-scope-filtered list (not just the tapped booth's slice). The
  // order matches `groups` flattened — booth-by-booth in render order.
  const flatFindRefs: FindRef[] = groups.flatMap((g) =>
    g.posts.map((p) => ({
      id:        p.id,
      image_url: p.image_url ?? null,
      title:     p.title ?? null,
    })),
  );

  // selectedMall still resolved here for the filterHidesAllSaves empty-state
  // copy ("No saved finds at <mall name>"). The PostcardMallCard moved to
  // app/(tabs)/layout.tsx as of session 109 — the layout independently
  // resolves the same selectedMall via its own useSavedMallId + getActiveMalls.
  const selectedMall = malls.find(m => m.id === savedMallId) ?? null;

  const filterHidesAllSaves = savedMallId !== null && posts.length > 0 && filteredPosts.length === 0;
  // Session 120 — search-only empty: user has matches in scope, query
  // hides them all. Distinct from filterHidesAllSaves so the empty-state
  // copy can name the query, not the mall.
  const searchHidesAllSaves = trimmedQ !== "" && filteredPosts.length > 0 && searchedPosts.length === 0;

  return (
    <>
      {/* Session 120 — rich PostcardMallCard mounted only when the user
          has saves to scope. Zero saves anywhere → no card (no scope
          choice to make); empty state owns the page. The card composes
          mall scope identifier + photo + search bar (filters saved finds
          client-side). All-Kentucky subtitle is bespoke for Saved:
          "X saved finds · Kentucky" instead of Home's "X active locations
          · Kentucky" — tells the shopper something useful about their
          collection. */}
      {!loading && posts.length > 0 && (
        <div style={{ padding: "12px 16px 14px" }}>
          <RichPostcardMallCard
            mall={selectedMall ?? "all-kentucky"}
            locationCount={malls.length}
            allKentuckySubtitle={
              `${posts.length} saved ${posts.length === 1 ? "find" : "finds"} · Kentucky`
            }
            onTap={() => router.push("/map")}
            searchInitialQuery={initialQ}
            onSearchChange={handleSearchChange}
          />
        </div>
      )}

      <FeaturedBanner
        variant="overlay"
        imageUrl={bannerImageUrl}
        minHeight={180}
        marginBottom={6}
      />

      {!loading && groups.length > 0 && (
        <div style={{ padding: "14px 44px 18px" }}>
          <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
        </div>
      )}

      <main
        style={{
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
          flex: 1,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 22px 0" }}>
            {[140, 190, 120].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 8 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "0 22px" }}>
            <EmptyStatePrimitive
              title="No finds saved yet"
              subtitle="Tap the leaf on any find to save it here."
            />
          </div>
        ) : filterHidesAllSaves ? (
          <div style={{ padding: "0 22px" }}>
            <EmptyStatePrimitive
              title={`No saved finds at ${selectedMall?.name ?? "this mall"}.`}
              subtitle="Saved finds at other malls are hidden by the active filter."
              cta={
                // R10 session 107 — scope change moved to /map.
                // "Show all malls" rewritten as "Change location" routing
                // to Map where the change UI lives.
                <FormButton variant="link" onClick={() => router.push("/map")}>
                  Change location →
                </FormButton>
              }
            />
          </div>
        ) : searchHidesAllSaves ? (
          <div style={{ padding: "0 22px" }}>
            <EmptyStatePrimitive
              title={`No saved finds match "${q}".`}
              subtitle="Try a different word — or clear the search to see everything you've saved."
            />
          </div>
        ) : (
          /* Editorial preamble + booth-container stack. Containers float
             on the page paperCream background (scrim retired session 99
             iPhone QA). Each container is a self-contained destination
             unit. */
          <>
            <div
              style={{
                padding: "0 22px 6px",
                fontFamily: FONT_LORA,
                fontStyle: "italic",
                fontSize: 15,
                color: v1.inkMuted,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              The search continues at these destinations.
            </div>
            <div
              style={{
                padding: "14px 14px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {groups.map((group) => {
                const miles = milesFromUser(
                  { lat: userLoc.lat, lng: userLoc.lng },
                  group.mallLat,
                  group.mallLng,
                );
                return (
                  <div
                    key={(group.boothNumber ?? "nb") + "·" + group.vendorName}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {/* R17 D18 — pill right-aligned above each booth container.
                        Renders nothing on guest / denied / mall coords missing
                        per <DistancePill> internal null-passthrough. */}
                    {miles != null && (
                      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 2px" }}>
                        <DistancePill miles={miles} />
                      </div>
                    )}
                    <BoothDestinationContainer
                      group={group}
                      scopeIsAllMalls={savedMallId === null}
                      flatFindRefs={flatFindRefs}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* R1 — sync footer per design record D6. Visible only to guests
            with localStorage saves. Routes to /login (which forwards to
            /login/email?role=shopper through the 3rd triage card). */}
        {!shopperAuth.isLoading && !shopperAuth.isAuthed && saves.ids.size > 0 && (
          <div
            style={{
              textAlign:  "center",
              padding:    "20px 22px 32px",
            }}
          >
            <Link
              href="/login"
              style={{
                fontFamily: FONT_LORA,
                fontStyle:  "italic",
                fontSize:   13,
                color:      v1.green,
                textDecoration: "none",
                lineHeight: 1.5,
              }}
            >
              Sync your finds across devices →
            </Link>
          </div>
        )}
      </main>

    </>
  );
}

// Suspense wrapper required for useSearchParams in App Router client
// components — mirrors app/(tabs)/page.tsx (Home) since session 120 wired
// ?q= URL state on /flagged via the rich card's search bar.
export default function FlaggedPage() {
  return (
    <Suspense>
      <FlaggedPageInner />
    </Suspense>
  );
}
