// app/find/[id]/page.tsx
// Find Detail — v1.1f (docs/design-system.md §Find Detail, updated session 17)
//
// Layout top-to-bottom:
//   1. Masthead row (Mode A): back · "Treehouse Finds" wordmark (16px) · save + share
//   2. Photograph (6px radius) with post-it BOTTOM-LEFT + status pill bottom-right (both Title Case).
//      For owners (isMyPost === true), the top-right Save bubble swaps for a Pencil bubble that
//      routes to /find/[id]/edit — this is the sole owner-path entry to the management surface.
//   3. Title + price (32px, em-dash, price in softer ink)
//   4. Quoted caption (centered IM Fell italic, 19px, typographic quotes)
//   5. Diamond divider ◆
//   6. Cartographic block — pin + mall + address (system-ui); tick; X anchored to vendor line;
//      vendor name + booth pill (Booth 123456, matches status pill); "Visit the shelf →" in system-ui
//   7. "More from this shelf…" strip — Title Case eyebrow, inset to 22px page margin,
//      6px radius on thumbnails
//
// v1.2 (session 31E polish): the Owner Manage block that previously lived as section 8 has been
// retired. All three of its affordances — Edit this find / Mark as Found a Home / Delete this find —
// are now duplicates of controls on /find/[id]/edit (pencil bubble → Edit page carries the full
// management surface: autosave fields, Available/Sold pills, Remove from shelf link). Find Detail
// is now the reading surface; Edit is the management surface. Owner affordances on this page are
// limited to the pencil bubble that routes to Edit.
//
// v1.2 (session 46, 2026-04-22) — small-type legibility sweep:
//   - ShelfCard caption: FONT_LORA italic 13px → FONT_SYS 14px (400 wt)
//     IM Fell italic at 13px was failing the 40–65 demographic on paperCream;
//     italic serif loses stroke contrast fastest as size drops. FONT_SYS matches
//     the voice already used on this page for address + "Explore booth →" + booth
//     pill numeral (cartographic/wayfinding register). The editorial serif voice
//     stays on masthead / 32px title / 19px caption quote / mall + vendor names.
//   - "More from this shelf…" eyebrow: 15px → 16px (stays IM Fell italic, still
//     v1.inkMuted). Decorative section header, stays in the editorial register,
//     just 1px larger for easier at-a-glance noticing.
// See also: components/BoothPage.tsx WindowTile + ShelfTile got the same caption
// treatment in the same commit for ecosystem-wide consistency.
//
// v1.1 commitments from on-device feedback in session 16:
// - Typography bumped +1–2px across small type for the 50+ audience
// - Title Case, no uppercase/letter-spacing on labels (was SaaS dashboard chrome)
// - Post-it moved top-left → bottom-left (collision + legibility)
// - 6px corner radius on photograph and shelf thumbnails
// - Booth number gets status-pill styling on the vendor line (twin to "On Display")
// - X glyph anchors to vendor name baseline (was drifting to "Visit the shelf" below)
// - "Visit the shelf →" moved IM Fell italic → system-ui 500 (matches address voice)
// - Shelf strip insets to page margin (first thumbnail aligns with photograph)
//
// v1.1e — on-device polish pass from session 17:
// - Masthead wordmark: italic retired on "Finds" (Title Case single style), 16 → 18px, tighter tracking
// - Save + Share relocated off masthead onto photograph top-right as frosted cream circles
// - Back button bubble 34 → 38, icon 16 → 18 for on-image icon parity
// - On-image save + share bubbles 38px, icons 17px
// - Vendor row: "Explore" → "Explore booth →", pill slimmed to pure numeric badge
// - Pill numeral bumped 13 → 16px IM Fell, padding tightened
// - X glyph vertical alignment recalibrated to vendor-name baseline
// v1.1f — session 17 follow-up polish pass:
// - Saved heart state: frosted bubble bg stays constant; only icon color/fill flips to green
//   (green-tinted bg was blending into warm/dark photos)
// - Post-it: inset from screen edge (right: -12 → 4), rotation +3 → +6deg, eyebrow stacks "Booth / Location"
// - Post-it minHeight 84 → 92 to accommodate the two-line eyebrow without crowding the 36px numeral

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Pencil, ChevronRight } from "lucide-react";
import { PiStorefront } from "react-icons/pi";
import { motion, type PanInfo } from "framer-motion";
import FlagGlyph from "@/components/FlagGlyph";
import { getPost, getVendorPosts } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { getCachedUserId, getSession, isAdmin, onAuthChange } from "@/lib/auth";
import {
  v1,
  FONT_LORA,
  FONT_SYS,
  FONT_NUMERAL,
} from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
import { mapsUrl, boothNumeralSize } from "@/lib/utils";
import { track } from "@/lib/clientEvents";
import { readFindContext, getPostCache, setPostCache, writeFindContext, getVendorPostsCache, setVendorPostsCache, type FindRef } from "@/lib/findContext";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import PhotoLightbox from "@/components/PhotoLightbox";
import LocationActions from "@/components/LocationActions";
import ShareSheet from "@/components/ShareSheet";
import type { Post } from "@/types/treehouse";

// v1.1 tokens imported from lib/tokens.ts (canonical since session 19A). v1 palette +
// fonts match docs/design-system.md v1.1h.

// Ownership detection
//
// Session 50 fix: path 3 (LOCAL_VENDOR_KEY match) now requires a valid
// Supabase session. Previously a stale vendor-profile survived sign-out
// in localStorage and granted the edit pencil to a guest user viewing
// their own prior post. `signOut()` in lib/auth.ts now also clears
// LOCAL_VENDOR_KEY, but gating the path on an actual session here is the
// correctness fix — no session, no ownership, regardless of what's cached.
async function detectOwnershipAsync(post: Post): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.user) return false;
    if (isAdmin(session.user)) return true;
    const sessionUid = getCachedUserId() ?? session.user.id;
    if (sessionUid && post.vendor?.user_id && sessionUid === post.vendor.user_id) return true;
    const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
    if (raw) {
      const profile = JSON.parse(raw) as LocalVendorProfile;
      const profileVendorId = profile.vendor_id;
      const postVendorId    = post.vendor_id ?? post.vendor?.id;
      if (profileVendorId && postVendorId && profileVendorId === postVendorId) return true;
    }
  } catch {}
  return false;
}

// Shelf card (v1.1; session 89 iPhone QA #6 — polaroid treatment to match
// the rest of the find-tile family: warm cream paper bg, 4px radius, dual
// dimensional shadow, 7px photo mat top+sides. The "browse vs navigate"
// rule from session 83 that previously kept this card chrome-light is
// retired — David's call for cross-page consistency wins here since this
// strip IS a browse surface, just embedded inside a detail page.
function ShelfCard({
  post,
  findRefs,
  swipeOriginPath,
}: {
  post: Post;
  // Phase C — when both are provided, tapping this card writes the
  // swipe-nav context with the booth's posts (the user is "stepping
  // into" a different find within the same booth — context re-scopes
  // from feed/saved to this booth's catalog).
  findRefs?: FindRef[];
  swipeOriginPath?: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const isSold = post.status === "sold";
  const hasImg = !!post.image_url && !imgErr;

  function handleTap() {
    if (post.image_url) {
      try {
        sessionStorage.setItem(
          `treehouse_find_preview:${post.id}`,
          JSON.stringify({ image_url: post.image_url, title: post.title }),
        );
      } catch {}
    }
    if (findRefs && swipeOriginPath) {
      const cursor = findRefs.findIndex((r) => r.id === post.id);
      writeFindContext({
        originPath:  swipeOriginPath,
        findRefs,
        cursorIndex: cursor >= 0 ? cursor : 0,
      });
    }
  }

  return (
    <Link
      href={`/find/${post.id}`}
      onClick={handleTap}
      style={{ display: "block", textDecoration: "none", flexShrink: 0, width: "42vw", maxWidth: 170 }}
    >
      <div
        style={{
          background: "#fefae6",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
          padding: "7px 7px 0",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/5",
            background: v1.postit,
            opacity: isSold ? 0.62 : 1,
            transition: "opacity 0.2s",
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
                filter: isSold
                  ? `${TREEHOUSE_LENS_FILTER} grayscale(0.5) brightness(0.88)`
                  : TREEHOUSE_LENS_FILTER,
                WebkitFilter: isSold
                  ? `${TREEHOUSE_LENS_FILTER} grayscale(0.5) brightness(0.88)`
                  : TREEHOUSE_LENS_FILTER,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "12px 10px",
                display: "flex",
                alignItems: "flex-end",
                background: v1.postit,
              }}
            >
              <div style={{ fontFamily: FONT_LORA, fontSize: 13, color: v1.inkMuted, lineHeight: 1.25 }}>
                {post.title}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "9px 10px 4px", height: 56, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontSize: 14,
              color: v1.inkPrimary,
              lineHeight: 1.4,
              width: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {post.title}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Session 88 — peer-nav scroll-restore primitive. Two storage keys, both
// per-find (scoped by current post id) so peer-nav between different finds
// doesn't cross-contaminate scroll state. Pattern lifted from /flagged
// (canonical clean Phase 3 shape) + session-86 refuse-to-write-0 primitive.
const findScrollKey = (postId: string) => `treehouse_find_scroll_y:${postId}`;
const findStripScrollKey = (postId: string) => `treehouse_find_strip_scroll_x:${postId}`;

// Phase B QA fix #2 (session 100) — post cache moved to lib/findContext.ts
// so source surfaces (Home loadFeed; eventually /flagged + /shelf/[slug])
// can populate it directly. The cache survives swipe-driven router.replace,
// detail→back→detail trips, and feed→detail→home→detail trips within a
// session. Edit pages clear per-id on successful PATCH so the next view
// sees fresh data.

// Module-scope navigation-departure flag. Same-route param navigation
// (/find/A → /find/B) leaves the save listener attached during the brief
// render-commit window where the browser auto-clamps scrollY to fit the
// new page's shorter loading-state document. Those auto-clamp scroll events
// would clobber the user's true scroll position for A. Setting this flag
// synchronously on the strip-thumb capture-phase click lets the listener
// skip writes during that transition window. Reset by the [id] save effect
// when the new id mounts.
let findScrollWriteBlocked = false;

// Module-scope navigation-type tracker. The flag holds the type of the
// MOST RECENT navigation: popstate (browser back/forward) or pushState
// (router.push from a Link tap). On any /find/[id] mount, this tells
// us whether the user got here via back/forward (restore saved scroll)
// or via a Link tap (open like a new page, scroll to top).
//
// Phase C QA fix #8 (session 100) — switched from a JS flag (let
// lastNavWasPopstate = ...) to a sessionStorage marker. Diagnostic
// logs revealed Next.js's internal pushState/replaceState calls during
// route transition were flipping the flag false BEFORE our [id] effect
// could consume it. The sessionStorage marker is set on real popstate
// events ONLY, and read-then-deleted by the consuming effect — Next.js's
// internal history calls don't touch it.

const POPSTATE_MARKER_KEY = "th_popstate_pending";

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    try { sessionStorage.setItem(POPSTATE_MARKER_KEY, String(Date.now())); } catch {}
  });
}

// Returns true if a popstate event fired within the last `maxAgeMs`.
// The window is wide enough (800ms) to cover Next.js's route transition
// + ShelfSection's getVendorPosts fetch + render commit, so all the
// effects that need this signal can read it consistently.
function wasRecentPopstate(maxAgeMs = 800): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(POPSTATE_MARKER_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < maxAgeMs;
  } catch { return false; }
}

function ShelfSection({
  vendorId,
  vendorSlug,
  currentPostId,
  onReady,
}: {
  vendorId: string;
  // Phase C — vendor slug threaded through so the carousel can write a
  // booth-scoped swipe context (`/shelf/${slug}`) on tap. Tapping a card
  // is the user re-scoping their swipe-nav from feed/saved to "this
  // booth's catalog." Null when the vendor lacks a slug.
  vendorSlug: string | null;
  currentPostId: string;
  onReady: (hasItems: boolean) => void;
}) {
  // Phase C — store ALL booth posts (unfiltered). Carousel display is
  // filtered to exclude currentPostId; the swipe-nav findRefs uses the
  // full list so swiping from a "More from this booth" landing can reach
  // back to the previously-viewed find.
  const [allItems, setAllItems] = useState<Post[]>([]);
  const [ready, setReady] = useState(false);

  // Session 88 — horizontal scroll-restore on the carousel. Refs survive
  // re-renders; state would force unnecessary re-paints. Same shape as the
  // page-level vertical scroll-restore in FindDetailPage below, just on
  // scrollLeft instead of scrollY and on the inner overflow-x container
  // instead of window.
  const stripRef = useRef<HTMLDivElement>(null);
  const stripPendingX = useRef<number | null>(null);
  const stripRestored = useRef(false);

  // Read saved horizontal scroll position before items load so it's ready
  // to restore the moment the strip renders. Only restore on browser
  // back/forward (popstate fired); forward Link-tap opens the find as a
  // new page with the strip at scroll-left 0.
  useEffect(() => {
    stripRestored.current = false;
    stripPendingX.current = null;
    if (!wasRecentPopstate()) return;
    try {
      const saved = sessionStorage.getItem(findStripScrollKey(currentPostId));
      if (saved) {
        const x = parseInt(saved, 10);
        if (!isNaN(x) && x > 0) stripPendingX.current = x;
      }
    } catch {}
  }, [currentPostId]);

  // Session 101 — check vendorPostsCache synchronously via useLayoutEffect
  // before paint. Cache hit on back-nav: populate items + signal ready in
  // the same render cycle so parent's shelfReady gate opens before paint,
  // letting the scroll-restore staircase fire pre-paint and kill the
  // scrollY=0 flash. Cache miss: fall through to async fetch.
  useLayoutEffect(() => {
    const cached = getVendorPostsCache(vendorId);
    if (!cached) return;
    setAllItems(cached);
    setReady(true);
    onReady(cached.filter((p) => p.id !== currentPostId).length > 0);
  }, [vendorId, currentPostId, onReady]);

  useEffect(() => {
    if (getVendorPostsCache(vendorId)) return; // useLayoutEffect handled it
    getVendorPosts(vendorId, 12).then((posts) => {
      setVendorPostsCache(vendorId, posts);
      setAllItems(posts);
      setReady(true);
      // Phase C — populate the shared post cache so a tap into any
      // booth post paints metadata synchronously. Same pattern as
      // Home loadFeed and /flagged loadPosts.
      for (const p of posts) setPostCache(p);
      // Display filter excludes the currently-viewed post (carousel
      // shows OTHER finds in the booth). onReady reflects the visible
      // item count, not the full booth size.
      onReady(posts.filter((p) => p.id !== currentPostId).length > 0);
    });
  }, [vendorId, currentPostId, onReady]);

  // Save scrollLeft on every horizontal scroll. Refuse-to-write-0: empty
  // storage already restores to 0, so 0 is a meaningless write target.
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    function onScroll() {
      if (!stripRef.current) return;
      const x = Math.round(stripRef.current.scrollLeft);
      if (x <= 0) return;
      try { sessionStorage.setItem(findStripScrollKey(currentPostId), String(x)); } catch {}
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [currentPostId, ready]);

  // Restore scrollLeft once items are ready and the overflow container has
  // its full content width. Single RAF — DOM is committed by then.
  useEffect(() => {
    if (!ready) return;
    if (stripRestored.current) return;
    if (stripPendingX.current === null) return;
    if (!stripRef.current) return;
    stripRestored.current = true;
    const x = stripPendingX.current;
    requestAnimationFrame(() => {
      if (stripRef.current) stripRef.current.scrollLeft = x;
    });
  }, [ready]);

  // Display list — booth posts excluding the one currently being viewed.
  const items = allItems.filter((p) => p.id !== currentPostId);
  // Swipe-nav findRefs — full booth list including current. Tapping a
  // card switches the swipe context to this booth so the user can move
  // through booth siblings (and back to the current find via swipe).
  const findRefs: FindRef[] = vendorSlug
    ? allItems.map((p) => ({
        id:        p.id,
        image_url: p.image_url ?? null,
        title:     p.title ?? null,
      }))
    : [];
  const swipeOriginPath = vendorSlug ? `/shelf/${vendorSlug}` : undefined;

  if (!ready || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          paddingLeft: 22,
          paddingRight: 22,
          marginBottom: 14,
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 16,
          color: v1.inkMuted,
        }}
      >
        More from this booth…
      </div>
      <div
        ref={stripRef}
        className="hide-scrollbar"
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          overflowY: "hidden",
          // Session 89 (iPhone QA #7) — paddingLeft 0 → 22 so the strip's
          // first card aligns with the section header above it (which uses
          // paddingLeft: 22). Per-item marginLeft compensation on idx===0
          // dropped since the container padding now owns the leading inset.
          paddingLeft: 22,
          paddingRight: 22,
          paddingTop: 6,
          paddingBottom: 18,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          // Session 100 (Phase B) — claim X-axis pans natively so the
          // page-level swipe-between-finds drag (touch-action: pan-y on
          // the motion.div parent) doesn't capture them. pan-y also
          // permits vertical scroll to pass through to the page within
          // carousel bounds.
          touchAction: "pan-x pan-y",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            // Session 88 — capture-phase click snapshot. Fires before the
            // child Link's bubble-phase click handler, so we record the
            // user's true scroll position synchronously before any
            // route-transition events (scroll-to-top, document auto-clamp)
            // can clobber the listener's saved value. Pairs with
            // findScrollWriteBlocked (module scope) which the page-level
            // listener checks before writing.
            onClickCapture={() => {
              try {
                const y = Math.round(window.scrollY);
                if (y > 0) {
                  sessionStorage.setItem(findScrollKey(currentPostId), String(y));
                }
              } catch {}
              findScrollWriteBlocked = true;
            }}
            style={{
              scrollSnapAlign: "start",
              flexShrink: 0,
            }}
          >
            <ShelfCard
              post={item}
              findRefs={swipeOriginPath ? findRefs : undefined}
              swipeOriginPath={swipeOriginPath}
            />
          </div>
        ))}
        <div style={{ flexShrink: 0, width: 10 }} />
      </div>
    </div>
  );
}

// Icon bubble — v1.1e size bumped 34 → 38 for on-image parity.
// `variant="frosted"` renders the overlay treatment used on the photograph (save + share).
function IconBubble({
  onClick,
  ariaLabel,
  children,
  active,
  variant = "paper",
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  active?: boolean;
  variant?: "paper" | "frosted";
}) {
  const paperBg = active ? "rgba(30,77,43,0.14)" : v1.iconBubble;
  // v1.1f — frosted bg stays constant regardless of active state; only the icon
  // inside flips color/fill to signal the saved state. Against warm/dark photos the
  // green-tinted translucent bg was blending into the image; holding paperCream tone
  // keeps the bubble as a stable mark and lets the heart glyph carry the state.
  const frostedBg = "rgba(245,242,235,0.85)";

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: variant === "frosted" ? frostedBg : paperBg,
        backdropFilter: variant === "frosted" ? "blur(8px)" : undefined,
        WebkitBackdropFilter: variant === "frosted" ? "blur(8px)" : undefined,
        border: variant === "frosted" ? `0.5px solid rgba(42,26,10,0.12)` : "none",
        cursor: "pointer",
        padding: 0,
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.18s ease",
      }}
    >
      {children}
    </button>
  );
}

// SoldLandingBody — Find Detail 3B (v1.1i). End-of-path content that replaces
// the photograph + title + cartographic block when a shopper lands on a sold
// find. Owner path stays on the normal layout. No photograph, no post-it,
// no price — the body IS the closure.
//
// Session 77 — restructured to body-only. Wrapper, masthead, and BottomNav
// now live on FindDetailPage's single return so they're stable across all
// state transitions (loading / not-found / sold / normal). Previous nested
// full-page returns caused the masthead to remount on iOS bfcache restore,
// hitting a sticky-position paint bug. /shelf/[slug] uses the same pattern.
//
// Session 36 Q-003: flaggedCount handled by parent's BottomNav (no longer
// passed in).
function SoldLandingBody({
  vendorSlug,
  vendorName,
}: {
  vendorSlug: string | null;
  vendorName: string | null;
}) {
  return (
    <>
      <div style={{ padding: "90px 32px 0", textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontSize: 30,
            color: v1.inkPrimary,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
          }}
        >
          This find
          <br />
          found a home.
        </div>
      </div>

      <div
        style={{
          padding: "14px 32px 0",
          display: "flex",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 16,
            color: v1.inkMuted,
            lineHeight: 1.65,
            maxWidth: 300,
          }}
        >
          The piece you saved has been claimed by someone else. That&rsquo;s the way of good things.
        </div>
      </div>

      <div style={{ padding: "20px 60px 16px" }}>
        <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          padding: "4px 32px 0",
        }}
      >
        {vendorSlug && vendorName && (
          <Link
            href={`/shelf/${vendorSlug}`}
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 15,
              color: v1.inkMid,
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textDecorationColor: v1.inkFaint,
              textUnderlineOffset: 3,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Visit {vendorName}&rsquo;s shelf →
          </Link>
        )}
        <Link
          href="/"
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 15,
            color: v1.inkMid,
            textDecoration: "underline",
            textDecorationStyle: "dotted",
            textDecorationColor: v1.inkFaint,
            textUnderlineOffset: 3,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Back to Treehouse Finds
        </Link>
      </div>

      <div style={{ flex: 1, minHeight: 20 }} />
    </>
  );
}

export default function FindDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post,          setPost]          = useState<Post | null>(null);
  const [loading,       setLoading]       = useState(true);
  // Session 137 — share airplane now opens <ShareSheet entity="find">
  // (3-channel grid: SMS + QR + Copy Link). Replaces the OS-native
  // navigator.share() handler + clipboard-fallback `copied` state that
  // lived on this surface since session 73. Sheet owns its own copy
  // feedback; no per-page color-tint state needed anymore.
  const [shareOpen,     setShareOpen]     = useState(false);
  const [isMyPost,      setIsMyPost]      = useState(false);
  const [, setShelfHasItems]              = useState(false);
  // Phase C QA fix #2 (session 100) — readiness signal for scroll-restore.
  // The "More from this booth" carousel fetches its own data after the
  // parent post fetch resolves, so the document grows TALLER after
  // setLoading(false). If scroll-restore fires before the carousel's
  // ready signal, scrollTo gets clamped to the (too-short) document
  // height and lands above the user's saved Y. shelfReady = true once
  // the carousel's fetch has resolved (regardless of result count).
  const [shelfReady,    setShelfReady]    = useState(false);
  // R1 Arc 4 — single source of truth for save state across guest +
  // authed paths. Hook owns the localStorage/DB branching internally.
  const saves = useShopperSaves();
  const isSaved = !!id && saves.isSaved(id);
  // Session 134 — page-level useUserLocation() retired alongside DistancePill.
  // The eyebrow row's right slot now ships an "Enter Booth →" link to
  // /shelf/[vendorSlug]; distance display retired on this surface (R17 Arc 2
  // D18 reversed — see eyebrow row below for context). LocationActions
  // (rendered below the cartographic card) keeps its own internal
  // useUserLocation() call gated on geolocation permission, so the
  // page-level hook call had no remaining consumer.

  // Preview image URL written by the source surface (Home tile / /flagged
  // / /shelf, eventually) into sessionStorage on tap. Loaded by the
  // useLayoutEffect below — runs synchronously after the first commit
  // but before paint, so the photograph still appears on the first
  // visible frame.
  //
  // Phase C QA fix #7 (session 100) — initial state must be null on
  // BOTH server and client, otherwise hydration mismatches (React #418).
  // The previous code read sessionStorage in the useState initializer,
  // which returned null on server (typeof window === "undefined") but
  // a URL on client (when the user tapped a Home tile that wrote a
  // preview entry). The mismatch crashed hydration and React fell
  // back to a full client re-render (#423) on every first-tap nav.
  const readPreviewImage = (forId: string): string | null => {
    if (typeof window === "undefined" || !forId) return null;
    try {
      const raw = sessionStorage.getItem(`treehouse_find_preview:${forId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed?.image_url === "string" ? parsed.image_url : null;
    } catch { return null; }
  };
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Swipe-nav neighbors. Resolved from the lib/findContext blob on [id]
  // change; null when the user arrived via direct deep-link or has no
  // surrounding context. Drag is auto-disabled when both are null.
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);

  // Phase B QA fix #4 (session 100) — drop ALL slide animations and run
  // the swap-critical state through useLayoutEffect so it commits BEFORE
  // paint. The earlier slide-out + slide-in sequence created a transition
  // window where the motion.div was offscreen at ±innerWidth, leaving the
  // viewport blank between animations (the empty-page flicker David
  // surfaced via screenshot). Without animations the wrapper never leaves
  // x=0 except during the user's finger drag, and useLayoutEffect ensures
  // the cache-hit setPost lands in the same paint as the route param
  // change. Net experience: drag with finger → release → page is the
  // next find, fully rendered, no transition state.
  useLayoutEffect(() => {
    if (!id) return;

    // Sync first paint of photograph for the new id.
    setPreviewImageUrl(readPreviewImage(id));

    // Sync swap of post + loading. Cache hit (Home loadFeed warmed; near-
    // 100% of swipe-driven nav) → metadata renders with the same paint
    // as the route change. Cache miss (direct deep-link) → post=null +
    // loading=true; the deferred fetch effect below resolves and updates
    // state after paint.
    const cached = getPostCache(id);
    if (cached) {
      setPost(cached);
      setLoading(false);
    } else {
      setPost(null);
      setLoading(true);
    }

    // Sync resolution of neighbors. Drag enabled/disabled state on the
    // motion.div derives from these in render.
    const ctx = readFindContext();
    if (!ctx) {
      setPrevId(null);
      setNextId(null);
    } else {
      const cursor = ctx.findRefs.findIndex((r) => r.id === id);
      setPrevId(cursor > 0 ? ctx.findRefs[cursor - 1].id : null);
      setNextId(
        cursor >= 0 && cursor < ctx.findRefs.length - 1
          ? ctx.findRefs[cursor + 1].id
          : null,
      );
    }

    // Phase C QA fix #3 — reset shelfReady SYNCHRONOUSLY before paint so
    // the scroll-restore useEffect (which runs after paint) sees the
    // fresh false value via its closure. Previously this lived in a
    // sibling useEffect and the reset was scheduled after the scroll-
    // restore effect had already read the stale true value, fired
    // scrollTo too early, and clamped against the document height
    // captured before the carousel re-rendered with the new currentPostId.
    setShelfReady(false);
  }, [id]);

  // Drag-end commit. Threshold: 80px offset OR 500px/s velocity. Above →
  // navigate (router.replace, no history growth). Below → no-op; framer-
  // motion's dragConstraints={{left:0,right:0}} auto-snaps the wrapper
  // back to x=0 on release.
  function handleSwipeEnd(_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const offsetX = info.offset.x;
    const velX = info.velocity.x;
    const SWIPE_DIST = 80;
    const SWIPE_VEL = 500;
    const swipeRight = offsetX > SWIPE_DIST || velX > SWIPE_VEL;
    const swipeLeft = offsetX < -SWIPE_DIST || velX < -SWIPE_VEL;

    if (swipeRight && prevId) {
      track("find_swiped", { direction: "right", from_id: id, to_id: prevId });
      router.replace(`/find/${prevId}`);
    } else if (swipeLeft && nextId) {
      track("find_swiped", { direction: "left", from_id: id, to_id: nextId });
      router.replace(`/find/${nextId}`);
    }
    // No-op otherwise — framer-motion handles the spring-back to x=0.
  }

  // Deferred-async [id] work — runs after paint. Pre-warms the preview
  // image cache + pre-fetches full Post data for the immediate neighbors
  // so the next swipe lands cache-hit (instant metadata via the
  // useLayoutEffect above). Home → /find/[id] entry paths are typically
  // pre-warmed by Home loadFeed already; this is the backstop for direct
  // deep-link arrivals.
  useEffect(() => {
    if (!id) return;
    const ctx = readFindContext();
    if (!ctx) return;
    const cursor = ctx.findRefs.findIndex((r) => r.id === id);
    if (cursor < 0) return;
    const resolvedPrev = cursor > 0 ? ctx.findRefs[cursor - 1] : null;
    const resolvedNext = cursor < ctx.findRefs.length - 1 ? ctx.findRefs[cursor + 1] : null;

    const warmPreview = (ref: typeof resolvedPrev) => {
      if (!ref || !ref.image_url) return;
      try {
        sessionStorage.setItem(
          `treehouse_find_preview:${ref.id}`,
          JSON.stringify({ image_url: ref.image_url, title: ref.title }),
        );
      } catch {}
    };
    warmPreview(resolvedPrev);
    warmPreview(resolvedNext);

    const prefetchNeighbor = (ref: typeof resolvedPrev) => {
      if (!ref || getPostCache(ref.id)) return;
      getPost(ref.id).then((data) => {
        if (data) setPostCache(data);
      });
    };
    prefetchNeighbor(resolvedPrev);
    prefetchNeighbor(resolvedNext);
  }, [id]);

  // R1 Arc 4 — bookmark count for BottomNav badge sourced from the hook.
  // Q-003 addendum (session 36) is now satisfied by useShopperSaves's
  // optimistic toggle: setIds fires before the DB roundtrip, so the
  // BottomNav badge reflects the change on the same tick the heart flips.
  const bookmarkCount = saves.ids.size;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Session 88 — page vertical scroll-restore for back-nav from peer finds
  // (taps on the "More from this booth" strip → /find/[id-B] → back). Same
  // shape as /flagged (canonical Phase 3 primitive) + session-86 refuse-to-
  // write-0. Per-id key so peer-nav between distinct finds doesn't cross-
  // contaminate scroll state.
  const pendingScrollY = useRef<number | null>(null);
  const scrollRestored = useRef(false);

  // R1 Arc 4 — useShopperSaves has its own auth-change + cross-instance
  // event listeners; the page no longer maintains a local sync loop.

  // Save scrollY on every scroll event so back-nav lands exactly where the
  // user tapped a "More from this booth" thumb. Branch on lastNavWasPopstate:
  //   - Back/forward via browser history (popstate fired) → restore from
  //     saved value if present.
  //   - Forward via Link tap (no popstate) → always scrollTo(0, 0). David:
  //     "when a new find is selected it should default to opening like a
  //     new page, even if that item was selected before and scrolled
  //     through."
  // Three write guards stay in place:
  //   - findScrollWriteBlocked (module scope) — set by the strip's capture-
  //     phase click before the Link processes; prevents the auto-clamp
  //     scroll event during render-commit from clobbering A's saved value.
  //   - Refuse-to-write-0 — empty storage already restores to 0 by default.
  //   - Reset on [id] change.
  useEffect(() => {
    if (!id) return;
    scrollRestored.current = false;
    pendingScrollY.current = null;
    findScrollWriteBlocked = false;
    const wasBackForward = wasRecentPopstate();
    let savedYRead: number | null = null;
    if (wasBackForward) {
      try {
        const raw = sessionStorage.getItem(findScrollKey(id));
        if (raw) {
          const y = parseInt(raw, 10);
          if (!isNaN(y) && y > 0) savedYRead = y;
        }
      } catch {}
      if (savedYRead !== null) pendingScrollY.current = savedYRead;
    } else {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }
    function onScroll() {
      if (findScrollWriteBlocked) return;
      const y = Math.round(window.scrollY);
      if (y <= 0) return;
      try { sessionStorage.setItem(findScrollKey(id), String(y)); } catch {}
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [id]);

  // Restore scrollY once data has loaded AND the carousel has reported
  // ready. The carousel ("More from this booth") fetches its own data
  // after the parent post fetch resolves, so the document grows TALLER
  // after setLoading(false). If we restore at !loading, scrollTo gets
  // clamped to the (too-short) document and lands above the user's
  // saved Y — David surfaced this when the restore landed above the
  // tapped carousel card position. Gating on shelfReady (set by
  // ShelfSection's onReady callback after its fetch resolves) ensures
  // the document is at its final height when we scrollTo.
  //
  // When the find has no vendor → no ShelfSection renders → shelfReady
  // never flips. Bypass the gate in that case via the !hasVendor branch.
  // Re-runs on id change via the [id, loading, shelfReady] dep so peer-
  // nav into /find/[id-B] can restore B's saved scroll.
  // Phase C QA fix #6 (session 100) — disable iOS Safari's native scroll
  // restoration. Inspector data showed scrollY landing at a value that
  // matched neither the saved Y nor any retry result; only explanation
  // consistent with the numbers is Safari's own popstate scroll restore
  // racing our scrollTo and winning. With history.scrollRestoration =
  // 'manual', the browser stays out of it and our staircase is the only
  // thing scrolling on back-nav.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Session 101 — useLayoutEffect (was useEffect) so the first scrollTo
  // fires synchronously after DOM commit, BEFORE the browser paints. On
  // back-nav with both gates already open (post cache hit + vendorPosts
  // cache hit), the page never paints at scrollY=0. Eliminates the flash
  // David surfaced after Path-4 back-nav. Staircase still recovers if the
  // document grows after first paint (lazy images, etc.).
  useLayoutEffect(() => {
    if (loading) return;
    const hasVendor = !!post?.vendor;
    if (hasVendor && !shelfReady) return;
    if (scrollRestored.current) return;
    if (pendingScrollY.current === null) return;
    scrollRestored.current = true;
    const targetY = pendingScrollY.current;

    // Phase C QA fix #5 (session 100) — David Inspector data showed the
    // saved Y getting clobbered from 785 → 502 across a single back-nav
    // cycle. Root cause: scrollTo triggers a scroll event, our onScroll
    // listener fires with findScrollWriteBlocked=false (just reset by the
    // [id] mount effect), and writes the CLAMPED scrollY back to
    // sessionStorage — destroying the original savedY for next time.
    //
    // Fix: hold findScrollWriteBlocked=true through the staircase retry
    // window so onScroll skips writes while we're driving programmatic
    // scrolls. Re-allow writes after 700ms so subsequent user-initiated
    // scrolls save normally.
    findScrollWriteBlocked = true;
    const tryScroll = () => window.scrollTo({ top: targetY, behavior: "instant" });
    tryScroll(); // sync, pre-paint via useLayoutEffect
    const timeouts: number[] = [];
    timeouts.push(window.setTimeout(tryScroll, 100));
    timeouts.push(window.setTimeout(tryScroll, 300));
    timeouts.push(window.setTimeout(tryScroll, 600));
    timeouts.push(window.setTimeout(() => {
      findScrollWriteBlocked = false;
    }, 700));
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      findScrollWriteBlocked = false;
    };
  }, [id, loading, shelfReady, post]);

  useEffect(() => {
    if (!id) return;
    // R3 — page_viewed analytics event. Fires once per `id` (re-fires on
    // navigation between distinct finds in-app).
    track("page_viewed", { path: "/find/[id]", post_id: id });

    // Phase B QA fix #4 — sync setPost for cache hit/miss already
    // happened in the useLayoutEffect above (commits before paint). This
    // effect handles the deferred async work only: ownership detection
    // for cache-hit, and the actual fetch for cache-miss.
    const cached = getPostCache(id);
    if (cached) {
      detectOwnershipAsync(cached).then(setIsMyPost);
      return;
    }

    // Cache miss path — fetch fresh data, populate cache, then update
    // post + loading + ownership.
    getPost(id).then(async (data) => {
      if (data) setPostCache(data);
      setPost(data);
      setLoading(false);
      if (data) {
        const isOwner = await detectOwnershipAsync(data);
        setIsMyPost(isOwner);
      }
    });
  }, [id]);

  // Session 50: re-run ownership detection whenever auth state flips so the
  // edit pencil disappears on sign-out (and appears on sign-in) without a
  // navigation. Mirrors the Home page's auth subscriber pattern.
  useEffect(() => {
    const unsub = onAuthChange(async () => {
      if (!post) return;
      const isOwner = await detectOwnershipAsync(post);
      setIsMyPost(isOwner);
    });
    return unsub;
  }, [post]);

  function handleToggleSave() {
    if (!id) return;
    const next = !isSaved;
    saves.toggle(id, next);
    // R3 — emit save / unsave event. Heart icon is the only engagement
    // mechanic on a find (terminology section in design record).
    track(next ? "post_saved" : "post_unsaved", { post_id: id });
  }

  function handleShare() {
    // Session 73 R3 v1.1 — intent-capture semantic preserved verbatim.
    // The find_shared event still fires when the user taps the share
    // affordance, regardless of whether they complete the share through
    // any channel — that's the truthful "user attempted to share" signal
    // the analytics dashboard has been counting since session 73.
    //
    // Session 137 — share_method shifts from "native"/"clipboard" to
    // "sheet" because the sheet primitive has replaced the OS-native
    // navigator.share() / clipboard fallback path. The new share_find_*
    // events fire from inside <ShareSheet> for granular per-channel
    // analytics (SMS / QR / Copy Link) on top of this intent-capture.
    track("find_shared", { post_id: id, share_method: "sheet" });
    setShareOpen(true);
  }

  const handleShelfReady = useCallback((hasItems: boolean) => {
    setShelfHasItems(hasItems);
    // Phase C QA fix #2 — flip the readiness flag so the scroll-restore
    // effect can proceed knowing the carousel has rendered (or returned
    // empty) and the document height is final.
    setShelfReady(true);
  }, []);

  const mapLink = post?.mall?.address
    ? mapsUrl(post.mall.address)
    : post?.mall
    ? mapsUrl(`${post.mall.name} ${post.mall.city} ${post.mall.state}`)
    : null;

  // Session 77 — root-cause masthead-disappears fix.
  //
  // Previously the page had three top-level returns (loading / !post /
  // success), each with its own wrapper <div> + <StickyMasthead>. State
  // transitions remounted the entire tree, including the masthead. On iOS
  // bfcache back-nav, that remount hit a position:sticky paint bug — the
  // masthead reappeared in the DOM at zero height until a touch event
  // forced a layout recompute.
  //
  // Now: one return. Wrapper, masthead, and BottomNav are stable across
  // every state. Only the body content swaps via inline conditional.
  // /shelf/[slug] uses the same pattern and never had the bug.
  //
  // Session 76's "masthead in every branch" fix is now obsolete (single
  // branch). Session 77's bfcache pageshow handler in StickyMasthead also
  // becomes unnecessary for this path but stays as a defensive primitive
  // for any other callsite that may later have similar shape.
  const isSold      = post?.status === "sold";
  const hasVendor   = !!post?.vendor;
  const vendorSlug  = post?.vendor?.slug ?? null;
  const vendorName  = post?.vendor?.display_name ?? null;
  const boothNumber = post?.vendor?.booth_number ?? null;
  const mallName    = post?.mall?.name ?? null;
  const mallCity    = post?.mall?.city ?? null;
  const mallState   = post?.mall?.state ?? null;
  const mallSlug    = post?.mall?.slug ?? null;
  const mallLat     = post?.mall?.latitude ?? null;
  const mallLng     = post?.mall?.longitude ?? null;
  const price       = post?.price_asking;
  const showSoldBody   = !!post && isSold && !isMyPost;
  const showNormalBody = !!post && !showSoldBody;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StickyMasthead
        left={
          <IconBubble onClick={() => {
            try { sessionStorage.setItem(POPSTATE_MARKER_KEY, String(Date.now())); } catch {}
            router.back();
          }} ariaLabel="Go back">
            <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </IconBubble>
        }
        right={
          // Session 78 — share airplane lifted off the photograph onto the
          // masthead, mirroring /shelf/[slug] + /my-shelf. Cross-page
          // consistency: top-right airplane shares the current entity (find
          // here, booth there). Session 137 — tap opens <ShareSheet
          // entity="find"> instead of the OS-native share sheet; sheet
          // owns its own visual feedback so the icon color stays static.
          // Gated on `post` so it doesn't flash during the cached-preview
          // window before data loads.
          post ? (
            <IconBubble onClick={handleShare} ariaLabel="Share this find">
              <Send size={22} strokeWidth={1.7} style={{ color: v1.green }} />
            </IconBubble>
          ) : null
        }
      />

      {/* Phase B (session 100) — swipe-between-finds wrapper. The user
          drags the wrapper horizontally as gesture feedback; framer-
          motion's dragConstraints={{left:0,right:0}} auto-snaps it back
          to x=0 on release. On commit threshold (80px offset OR 500px/s
          velocity), router.replace fires — useLayoutEffect commits the
          new find's content sync before paint, so the visible state
          jumps directly from "old find" to "new find" with no transition
          animation in between (no slide-in / slide-out, no blank
          viewport, no stale-content flash). Drag is auto-disabled when
          there's no neighbor on either side. touchAction: pan-y lets
          vertical scroll pass through; the More-from-this-booth carousel
          below sets its own touch-action: pan-x pan-y. */}
      <motion.div
        drag={prevId || nextId ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        dragMomentum={false}
        onDragEnd={handleSwipeEnd}
        style={{ touchAction: "pan-y" }}
      >

      {/* Photograph hero — escapes the loading gate so the photograph
          renders on the very first commit. The source surface (feed /
          /flagged) cached the image_url in sessionStorage on tile tap;
          we read it via readPreviewImage on [id] change. Bubbles +
          post-it stay gated on `post` since they depend on data that's
          not in the preview cache (vendor, isMyPost, isSaved,
          boothNumber). */}
      {((loading && previewImageUrl) || (showNormalBody && post)) && (
        <div style={{ padding: "0 22px", marginBottom: 28, position: "relative" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "4/5",
              overflow: "visible",
            }}
          >
            {(post?.image_url || previewImageUrl) ? (
              // Session 88 — layoutId stripped per David's 'pull out all
              // animations' call. The shared-element morph (tile photo
              // → /find/[id] hero) is gone with this; the photo now
              // simply renders in place. preview-cache pattern stays so
              // the photo appears synchronously on first mount rather
              // than waiting for getPost() to resolve.
              <div
                onClick={() => { if (post) setLightboxOpen(true); }}
                onKeyDown={(e) => {
                  if (post && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setLightboxOpen(true);
                  }
                }}
                role="button"
                tabIndex={post ? 0 : -1}
                aria-label="View photo full screen"
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  borderRadius: v1.imageRadius,
                  border: `1px solid ${v1.inkHairline}`,
                  boxShadow: "0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)",
                  overflow: "hidden",
                  cursor: post ? "zoom-in" : "default",
                }}
              >
                <img
                  src={(post?.image_url ?? previewImageUrl) as string}
                  alt={post?.title ?? ""}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: isSold
                      ? `${TREEHOUSE_LENS_FILTER} grayscale(0.35) brightness(0.9)`
                      : TREEHOUSE_LENS_FILTER,
                    WebkitFilter: isSold
                      ? `${TREEHOUSE_LENS_FILTER} grayscale(0.35) brightness(0.9)`
                      : TREEHOUSE_LENS_FILTER,
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: v1.postit,
                  borderRadius: v1.imageRadius,
                  border: `1px solid ${v1.inkHairline}`,
                  boxShadow: "0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_LORA,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkFaint,
                }}
              >
                no photograph
              </div>
            )}

            {/* Flag — SIBLING of the photograph. Session 97 hero scale:
                bubble 44×44 / glyph 22 — matches BookmarkBoothBubble hero
                + back button + share airplane (the codebase's established
                "hero scale" precedent). Owner pencil retired from this
                slot in session 2 — moved inline next-to-title (no bg). */}
            {post && (post?.image_url || previewImageUrl) && !isMyPost && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 44,
                  height: 44,
                  zIndex: 3,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSave();
                  }}
                  aria-label={isSaved ? "Unsave" : "Save"}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(245,242,235,0.85)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: `0.5px solid rgba(42,26,10,0.12)`,
                    cursor: "pointer",
                    padding: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <FlagGlyph
                    size={22}
                    strokeWidth={1.7}
                    style={{ color: isSaved ? "#1e4d2b" : v1.inkPrimary, fill: isSaved ? "#1e4d2b" : "none" }}
                  />
                </button>
              </div>
            )}

            {/* Post-it — static, no entrance animation. */}
            {post && boothNumber && (
              <div
                style={{
                  position: "absolute",
                  bottom: -14,
                  right: 4,
                  width: 92,
                  minHeight: 92,
                  background: v1.postit,
                  transform: "rotate(6deg)",
                  transformOrigin: "bottom right",
                  boxShadow: `0 6px 14px rgba(42,26,10,0.28), 0 0 0 0.5px rgba(42,26,10,0.16)`,
                  padding: "14px 8px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "rgba(42,26,10,0.72)",
                    boxShadow: `inset 0 0 0 2px rgba(42,26,10,0.55), 0 1px 2px rgba(42,26,10,0.35)`,
                  }}
                />
                <div
                  style={{
                    fontFamily: FONT_SYS,
                    fontSize: 9,
                    fontWeight: 700,
                    color: v1.green,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    marginBottom: 6,
                    textAlign: "center",
                  }}
                >
                  Booth
                </div>
                <div
                  style={{
                    fontFamily: FONT_NUMERAL,
                    fontSize: boothNumeralSize(boothNumber),
                    fontWeight: 500,
                    color: v1.green,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                  }}
                >
                  {boothNumber}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && !previewImageUrl && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontFamily: FONT_LORA, fontStyle: "italic", color: v1.inkMuted, fontSize: 15 }}>
            Loading…
          </div>
        </div>
      )}

      {!loading && !post && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            padding: 24,
          }}
        >
          <div style={{ fontFamily: FONT_LORA, fontSize: 24, color: v1.inkPrimary, textAlign: "center" }}>
            This find has moved on.
          </div>
          <button
            onClick={() => router.push("/")}
            style={{
              fontFamily: FONT_SYS,
              fontWeight: 500,
              fontSize: 15,
              color: v1.inkMuted,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textDecorationColor: v1.inkFaint,
              textUnderlineOffset: 4,
            }}
          >
            Browse the feed
          </button>
        </div>
      )}

      {showSoldBody && (
        <SoldLandingBody vendorSlug={vendorSlug} vendorName={vendorName} />
      )}

      {showNormalBody && post && (
        <>
      {/* Photograph block was here — moved above the loading branch so the
          <motion.button layoutId> can mount synchronously on the cached
          preview before getPost() resolves. Bubbles + post-it inside that
          block stay gated on `post`. See the comment over the photograph
          hero earlier in the return. */}

      {/* Title + price — session 76 Frame B: centered, price 32px twin below
          (em-dash retired). docs/find-detail-title-center-design.md
          Session 78 — delay 0 so title fades in WITH the photograph morph.
          David's request: "feels like one transition, not two."
          Session 2 — owner-only inline edit pencil at right edge (no bg).
          Title stays centered; pencil floats in the right gutter. */}
      <div style={{ position: "relative", padding: "0 22px", marginBottom: 20, textAlign: "center" }}>
        <h1
          style={{
            fontFamily: FONT_LORA,
            fontSize: 32,
            fontWeight: 400,
            color: v1.inkPrimary,
            lineHeight: 1.18,
            letterSpacing: "-0.005em",
            margin: 0,
          }}
        >
          {post.title}
        </h1>
        {typeof price === "number" && price > 0 && (
          <div
            style={{
              fontFamily: FONT_LORA,
              fontSize: 32,
              fontWeight: 400,
              color: v1.priceInk,
              lineHeight: 1.18,
              letterSpacing: "-0.005em",
              marginTop: 2,
            }}
          >
            ${Math.round(price)}
          </div>
        )}
        {isMyPost && (
          <button
            onClick={() => router.push(`/find/${post.id}/edit`)}
            aria-label="Edit this find"
            style={{
              position: "absolute",
              bottom: 4,
              right: 14,
              background: "none",
              border: "none",
              padding: 6,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Pencil size={18} strokeWidth={1.6} style={{ color: v1.inkMid }} />
          </button>
        )}
      </div>

      {/* Quoted caption (v1.1 19px) */}
      {post.caption && (
        <div style={{ padding: "0 30px", marginBottom: 30, textAlign: "center" }}>
          <span
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 26,
              color: v1.inkMuted,
              lineHeight: 0,
              verticalAlign: "-0.1em",
              marginRight: 2,
            }}
          >
            “
          </span>
          <span
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 19,
              color: v1.inkMid,
              lineHeight: 1.65,
            }}
          >
            {post.caption}
          </span>
          <span
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 26,
              color: v1.inkMuted,
              lineHeight: 0,
              verticalAlign: "-0.1em",
              marginLeft: 2,
            }}
          >
            ”
          </span>
        </div>
      )}

      {/* Divider (v1.1j plain hairline, diamond retired) */}
      {(vendorName || boothNumber) && (
        <div
          style={{
            padding: "0 44px",
            marginBottom: 22,
          }}
        >
          <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
        </div>
      )}

      {/* Cartographic block (session 71 round 2 — fully collapsed) — single
          inkWash card with italic "Find this item at" eyebrow above. XGlyph
          spine retired since cartographic identity no longer earns its place
          on this page (no other page carries it either). */}
      {(vendorName || boothNumber) && (
        <div
          style={{
            padding: "0 28px",
            marginBottom: 32,
          }}
        >
          {/* Session 134 — eyebrow row carries the italic Lora eyebrow with
              a leading <PiStorefront> glyph + an italic Lora "Enter Booth →"
              link in green, right-aligned. Reverses R17 Arc 2 D18 (session
              117 + session 119): DistancePill retired from this surface. The
              card BELOW this row (vendor + booth + mall block) now exists
              to be entered, not measured — the explicit affordance lives in
              the eyebrow as a visual sibling of the descriptor on the left.
              Distance + native-maps deep-link both stay reachable via the
              full-width <LocationActions> "Take Trip" CTA below the card.

              alignItems: center (was baseline, when both children were
              text-only) — both children now carry icons that need vertical
              centering rather than baseline alignment.

              Link renders only when vendorSlug exists (otherwise there is
              no booth to enter). The cardInner Link wrapper below keeps
              card-tap routing to /shelf/[slug] in parallel; "Enter Booth"
              eyebrow is the explicit affordance, the card-tap is a wider
              hit target. iPhone QA will reveal whether the dual affordance
              feels redundant. */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              gap:            8,
              marginBottom:   8,
              paddingLeft:    2,
              paddingRight:   2,
            }}
          >
            <div
              style={{
                display:    "inline-flex",
                alignItems: "center",
                gap:        6,
                fontFamily: FONT_LORA,
                fontStyle:  "italic",
                fontSize:   14,
                color:      v1.inkMid,
                lineHeight: 1.4,
              }}
            >
              <PiStorefront size={14} aria-hidden style={{ flexShrink: 0 }} />
              Purchase this item at
            </div>
            {vendorSlug && (
              <Link
                href={`/shelf/${vendorSlug}`}
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  gap:            2,
                  fontFamily:     FONT_LORA,
                  fontStyle:      "italic",
                  fontSize:       14,
                  color:          v1.green,
                  lineHeight:     1.4,
                  textDecoration: "none",
                  whiteSpace:     "nowrap",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Enter Booth
                <ChevronRight size={14} strokeWidth={2} aria-hidden />
              </Link>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {(vendorName || boothNumber) && (() => {
              // Session 71 — cartographic collapse. Single inkWash card carries
              // vendor name (IM Fell) + mall · city/state subtitle (sans, Apple
              // Maps link) on the left, "Booth" small-caps + IM Fell numeral
              // (Variant B parity) on the right. The parallel mall card and the
              // inline "Visit the booth →" link from session 70 are retired.
              const mallSubtitle = mallName
                ? `${mallName}${mallCity ? ` · ${mallCity}${mallState ? `, ${mallState}` : ""}` : ""}`
                : null;
              const cardInner = (
                <div
                  style={{
                    background: v1.postit,
                    border: `1px solid ${v1.inkHairline}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      columnGap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      {/* Session 134 — mall location now sits ABOVE the
                          vendor (booth) name. Postal-address shape: city
                          first, building second. Font sizes + colors held
                          per David's "keep the existing font size and
                          styles as they are" call. The reordering matters
                          because the booth/mall card identifies a physical
                          place to visit; the natural read is "where" before
                          "which" — like writing an address on an envelope.
                          marginTop drift moves with the swap (was on the
                          mall subtitle, now on the vendor name). */}
                      {mallSubtitle && (
                        mapLink ? (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "inline-block",
                              fontFamily: FONT_SYS,
                              fontSize: 11.5,
                              color: v1.inkMuted,
                              textDecoration: "underline",
                              textDecorationStyle: "dotted",
                              textDecorationColor: v1.inkFaint,
                              textUnderlineOffset: 3,
                              lineHeight: 1.4,
                            }}
                          >
                            {mallSubtitle}
                          </a>
                        ) : (
                          <div
                            style={{
                              fontFamily: FONT_SYS,
                              fontSize: 11.5,
                              color: v1.inkMuted,
                              lineHeight: 1.4,
                            }}
                          >
                            {mallSubtitle}
                          </div>
                        )
                      )}
                      {vendorName && (
                        <div
                          style={{
                            fontFamily: FONT_LORA,
                            fontSize: 18,
                            color: v1.inkPrimary,
                            // Session 82 — lineHeight 1.4 (was 1.25) for
                            // descender clearance under overflow:hidden
                            // (matches BoothLockupCard primitive).
                            lineHeight: 1.4,
                            letterSpacing: "-0.005em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                        >
                          {vendorName}
                        </div>
                      )}
                    </div>
                    {boothNumber && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          lineHeight: 1,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: FONT_SYS,
                            fontSize: 9,
                            fontWeight: 700,
                            color: v1.green,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            lineHeight: 1,
                            marginBottom: 4,
                          }}
                        >
                          Booth
                        </div>
                        <div
                          style={{
                            fontFamily: FONT_NUMERAL,
                            fontSize: 26,
                            fontWeight: 500,
                            color: v1.green,
                            lineHeight: 1,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {boothNumber}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
              return vendorSlug ? (
                <Link
                  href={`/shelf/${vendorSlug}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {cardInner}
                </Link>
              ) : (
                cardInner
              );
            })()}
            {/* R17 Arc 2 D19 — twin-button row below the cartographic card.
                Renders nothing for guest / denied / mall-coords-missing
                per <LocationActions> internal null-passthrough. */}
            <LocationActions
              mallSlug={mallSlug}
              mallLat={mallLat}
              mallLng={mallLng}
              surface="find"
              postId={post?.id ?? null}
              vendorId={post?.vendor_id ?? null}
            />
          </div>
        </div>
      )}

      {/* Owner Manage block retired v1.2 (session 31E polish). All three affordances moved to
          /find/[id]/edit: the pencil bubble on the photograph (top-right) routes there, and the
          Edit page carries autosave fields + Available/Sold status pills + Remove from shelf link.
          Find Detail is the reading surface; Edit is the management surface. */}
        </>
      )}

      </motion.div>

      {/* "More from this shelf…" strip — Phase C QA fix (session 100):
          rendered OUTSIDE the swipe-wrapper motion.div so its native
          horizontal scroll isn't captured by the page-level drag. The
          motion.div above declares touch-action: pan-y for vertical
          scroll passthrough, but framer-motion's pointer listeners
          would still intercept horizontal pans inside it — moving the
          carousel out of its DOM subtree restores the carousel's own
          gesture surface. */}
      {showNormalBody && post && hasVendor && (
        <ShelfSection
          vendorId={post.vendor!.id}
          vendorSlug={post.vendor?.slug ?? null}
          currentPostId={post.id}
          onReady={handleShelfReady}
        />
      )}

      {/* Stable footer chrome — rendered in every state so back-nav from
          /shelf/[slug] never remounts the BottomNav (mirrors masthead pattern). */}
      <div style={{ paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }} />
      <BottomNav active={null} flaggedCount={bookmarkCount} />

      {/* Photo lightbox — session 61. Tap photo above → opens full-screen
          viewer with pinch-zoom + double-tap. Always rendered; gate on
          post + image_url so it's a no-op until data loads. */}
      <PhotoLightbox
        open={lightboxOpen}
        src={post?.image_url ?? null}
        alt={post?.title ?? ""}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Session 137 — find-entity ShareSheet. Replaces the OS-native
          navigator.share() handler. Gated on post + post.vendor — both
          are required for the slim header to render the find's
          identity ("this find at this booth in this mall"). */}
      {post && post.vendor && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          entity={{
            kind:   "find",
            post,
            vendor: post.vendor,
            mall:   post.mall ?? null,
          }}
        />
      )}
    </div>
  );
}
