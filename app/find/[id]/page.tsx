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

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Pencil } from "lucide-react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import FlagGlyph from "@/components/FlagGlyph";
import { getPost, getVendorPosts } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { safeStorage } from "@/lib/safeStorage";
import { getCachedUserId, getSession, isAdmin, onAuthChange } from "@/lib/auth";
import {
  v1,
  FONT_LORA,
  FONT_SYS,
  FONT_NUMERAL,
} from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
import { flagKey, mapsUrl, boothNumeralSize, loadFollowedIds } from "@/lib/utils";
import { track } from "@/lib/clientEvents";
import { readFindContext } from "@/lib/findContext";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import PhotoLightbox from "@/components/PhotoLightbox";
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
function ShelfCard({ post }: { post: Post }) {
  const [imgErr, setImgErr] = useState(false);
  const isSold = post.status === "sold";
  const hasImg = !!post.image_url && !imgErr;

  return (
    <Link
      href={`/find/${post.id}`}
      style={{ display: "block", textDecoration: "none", flexShrink: 0, width: "42vw", maxWidth: 170 }}
    >
      <div
        style={{
          background: "#faf2e0",
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

// Phase B QA fix (session 100) — module-scope post cache. Survives across
// swipe-driven router.replace (page stays mounted) so metadata paints
// instantly when the user reaches an already-fetched neighbor. Populated
// by:
//   1. The fetch effect on [id] change — every successful getPost lands
//      its result in the cache.
//   2. Pre-fetch in the [id] context effect — kicks off background
//      getPost for prevId + nextId so the very next swipe is instant.
//
// Cache lifetime = page session (module scope is reset on full reload).
// No LRU cap — sessions are short and Post payloads are ~few KB each.
// Stale-data risk is bounded: vendors can edit their own finds, but
// Find Detail does not subscribe to those events; cache is refreshed
// when the user does a full reload.
const findPostCache = new Map<string, Post>();

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
// (router.push from a Link tap). On any /find/[id] mount, the flag tells
// us whether the user got here via back/forward (restore saved scroll)
// or via a Link tap (open like a new page, scroll to top — including
// revisits of a find that was previously scrolled through).
//
// The previous popstate-only listener had a flag-staleness bug: a
// popstate setting `true` was never reset until /find/[id] mounted to
// consume it, so a subsequent forward Link tap would incorrectly read
// stale `true` and restore. Monkey-patching pushState resets the flag
// synchronously on every router.push, so the flag always reflects the
// current navigation accurately.
let lastNavWasPopstate = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => { lastNavWasPopstate = true; });
  const origPushState = window.history.pushState.bind(window.history);
  window.history.pushState = function (...args: Parameters<typeof origPushState>) {
    lastNavWasPopstate = false;
    return origPushState(...args);
  };
  const origReplaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = function (...args: Parameters<typeof origReplaceState>) {
    lastNavWasPopstate = false;
    return origReplaceState(...args);
  };
}

function ShelfSection({
  vendorId,
  currentPostId,
  onReady,
}: {
  vendorId: string;
  currentPostId: string;
  onReady: (hasItems: boolean) => void;
}) {
  const [items, setItems] = useState<Post[]>([]);
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
    if (!lastNavWasPopstate) return;
    try {
      const saved = sessionStorage.getItem(findStripScrollKey(currentPostId));
      if (saved) {
        const x = parseInt(saved, 10);
        if (!isNaN(x) && x > 0) stripPendingX.current = x;
      }
    } catch {}
  }, [currentPostId]);

  useEffect(() => {
    getVendorPosts(vendorId, 12).then((posts) => {
      const filtered = posts.filter((p) => p.id !== currentPostId);
      setItems(filtered);
      setReady(true);
      onReady(filtered.length > 0);
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
          // Session 100 (Phase B) — declare horizontal-scroll intent so the
          // page-level swipe-between-finds drag (touch-action: pan-y on the
          // motion.div parent) doesn't capture pointer events here.
          // Browser handles X-axis pans natively for this region (carousel
          // scrolls); page swipe still works above + below.
          touchAction: "pan-x",
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
            <ShelfCard post={item} />
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
  const [copied,        setCopied]        = useState(false);
  const [isMyPost,      setIsMyPost]      = useState(false);
  const [, setShelfHasItems]              = useState(false);
  const [isSaved,       setIsSaved]       = useState(false);

  // Track D phase 5 — preview image URL written by the source surface
  // (feed tile / /flagged tile) into sessionStorage on tap. Read
  // synchronously so the photograph can render on the very first commit,
  // before getPost() resolves. Direct URL nav (no source tap) leaves this
  // null — the page loads normally.
  //
  // Phase B (session 100) — convert from useState initializer (one-shot
  // mount-only read) to state updated on [id] change. Required for
  // swipe-driven router.replace, which keeps the page mounted but swaps
  // params; the photograph must paint synchronously for the new id too.
  const readPreviewImage = (forId: string): string | null => {
    if (typeof window === "undefined" || !forId) return null;
    try {
      const raw = sessionStorage.getItem(`treehouse_find_preview:${forId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed?.image_url === "string" ? parsed.image_url : null;
    } catch { return null; }
  };
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(() => readPreviewImage(id ?? ""));

  // Swipe-nav state. prevId/nextId resolve from the entry context blob
  // (lib/findContext) on [id] change; they're null when the user arrived
  // via direct deep-link or has no surrounding context. swipeDirRef
  // carries direction across the router.replace boundary so the new
  // [id] effect knows which side to slide in from. swipeControls drives
  // the drag/animate position imperatively.
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const swipeDirRef = useRef<"left" | "right" | null>(null);
  const swipeControls = useAnimation();
  const swipeTransitioningRef = useRef(false);

  // Re-resolve preview cache + neighbors + slide-in animation on [id]
  // change. Runs on initial mount AND on every router.replace fired by
  // the swipe gesture (page stays mounted across param changes in App
  // Router; useEffect on [id] is the load-bearing reactivity hook).
  useEffect(() => {
    if (!id) return;

    // Sync paint of the new photograph for both initial mount and
    // swipe-driven id changes.
    setPreviewImageUrl(readPreviewImage(id));

    // Resolve neighbors from context.
    const ctx = readFindContext();
    if (!ctx) {
      setPrevId(null);
      setNextId(null);
    } else {
      const cursor = ctx.findRefs.findIndex((r) => r.id === id);
      const resolvedPrev = cursor > 0 ? ctx.findRefs[cursor - 1] : null;
      const resolvedNext = cursor >= 0 && cursor < ctx.findRefs.length - 1
        ? ctx.findRefs[cursor + 1]
        : null;
      setPrevId(resolvedPrev?.id ?? null);
      setNextId(resolvedNext?.id ?? null);

      // Pre-warm the preview cache for adjacent ids so the NEXT swipe
      // also paints synchronously. Same payload shape as the entry tap
      // site writes; if a tap-write already populated this key, we
      // simply re-write the same data.
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

      // Phase B QA fix — pre-fetch full Post data for adjacent ids in
      // the background so the next swipe paints the metadata (save
      // icon, post-it, title, price, caption, share airplane) synchron-
      // ously. The fetch effect's cache check will hit on the next
      // [id] change. Skips ids already in cache so a back-and-forth
      // swipe doesn't fire redundant requests.
      const prefetchNeighbor = (ref: typeof resolvedPrev) => {
        if (!ref || findPostCache.has(ref.id)) return;
        getPost(ref.id).then((data) => {
          if (data) findPostCache.set(ref.id, data);
        });
      };
      prefetchNeighbor(resolvedPrev);
      prefetchNeighbor(resolvedNext);
    }

    // If we got here via a swipe (swipeDirRef set), slide the new content
    // in from the opposite side. Direction "right" = user swiped finger
    // right (toward prev), so old content slid OFF to the right at
    // +innerWidth, and the new (prev) content needs to slide in from
    // -innerWidth. Direction "left" = symmetrical.
    if (swipeDirRef.current === "right") {
      swipeControls.set({ x: -window.innerWidth });
      swipeControls.start({ x: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } });
      swipeDirRef.current = null;
      swipeTransitioningRef.current = false;
    } else if (swipeDirRef.current === "left") {
      swipeControls.set({ x: window.innerWidth });
      swipeControls.start({ x: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } });
      swipeDirRef.current = null;
      swipeTransitioningRef.current = false;
    }
  }, [id, swipeControls]);

  // Drag-end commit logic. Threshold: 80px offset OR 500px/s velocity in
  // the swipe direction. Below threshold → snap back. At-edge swipe
  // (toward null prev/next) → snap back regardless of threshold. During
  // transition → ignore drag (defensive; framer-motion's drag is gated
  // by animation state but the user can still chain quick gestures).
  async function handleSwipeEnd(_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (swipeTransitioningRef.current) return;
    const offsetX = info.offset.x;
    const velX = info.velocity.x;
    const SWIPE_DIST = 80;
    const SWIPE_VEL = 500;
    const swipeRight = offsetX > SWIPE_DIST || velX > SWIPE_VEL;
    const swipeLeft = offsetX < -SWIPE_DIST || velX < -SWIPE_VEL;

    if (swipeRight && prevId) {
      swipeTransitioningRef.current = true;
      swipeDirRef.current = "right";
      track("find_swiped", { direction: "right", from_id: id, to_id: prevId });
      await swipeControls.start({
        x: window.innerWidth,
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      });
      router.replace(`/find/${prevId}`);
    } else if (swipeLeft && nextId) {
      swipeTransitioningRef.current = true;
      swipeDirRef.current = "left";
      track("find_swiped", { direction: "left", from_id: id, to_id: nextId });
      await swipeControls.start({
        x: -window.innerWidth,
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      });
      router.replace(`/find/${nextId}`);
    } else {
      // Snap back — below threshold, or at-edge with no neighbor.
      swipeControls.start({
        x: 0,
        transition: { duration: 0.18, ease: "easeOut" },
      });
    }
  }

  // Q-003 addendum (session 36): bookmark count for BottomNav badge on this
  // page. Unlike Home / My Booth, Find Detail can toggle the count via the
  // heart bubble, so we also resync inside handleToggleSave — not just on
  // mount / focus / visibilitychange.
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [lightboxOpen,  setLightboxOpen]  = useState(false);

  // Session 88 — page vertical scroll-restore for back-nav from peer finds
  // (taps on the "More from this booth" strip → /find/[id-B] → back). Same
  // shape as /flagged (canonical Phase 3 primitive) + session-86 refuse-to-
  // write-0. Per-id key so peer-nav between distinct finds doesn't cross-
  // contaminate scroll state.
  const pendingScrollY = useRef<number | null>(null);
  const scrollRestored = useRef(false);

  useEffect(() => {
    function sync() {
      try { setBookmarkCount(loadFollowedIds().size); } catch {}
    }
    sync();
    function onFocus() { sync(); }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") sync();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

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
    const wasBackForward = lastNavWasPopstate;
    if (wasBackForward) {
      let savedY: number | null = null;
      try {
        const raw = sessionStorage.getItem(findScrollKey(id));
        if (raw) {
          const y = parseInt(raw, 10);
          if (!isNaN(y) && y > 0) savedY = y;
        }
      } catch {}
      if (savedY !== null) pendingScrollY.current = savedY;
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

  // Restore scrollY once data has loaded. Single RAF — by then post body
  // sections have rendered and the document has substantial height. The
  // strip below loads asynchronously and may extend the page after restore;
  // if the saved scroll position lands in that region, scrollTo clamps to
  // current document height and the strip-area landing position settles
  // close enough on real content. Re-runs on id change via the [id, loading]
  // dep so peer-nav into /find/[id-B] can restore B's saved scroll.
  useEffect(() => {
    if (loading) return;
    if (scrollRestored.current) return;
    if (pendingScrollY.current === null) return;
    scrollRestored.current = true;
    const y = pendingScrollY.current;
    requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); });
  }, [id, loading]);

  useEffect(() => {
    if (!id) return;
    try { setIsSaved(safeStorage.getItem(flagKey(id)) === "1"); } catch {}
    // R3 — page_viewed analytics event. Fires once per `id` (re-fires on
    // navigation between distinct finds in-app).
    track("page_viewed", { path: "/find/[id]", post_id: id });

    // Phase B QA fix — cache hit (typically: pre-fetched neighbor reached
    // via swipe) paints the new find's metadata synchronously. No loading
    // state, no stale-data flash from the previous find.
    const cached = findPostCache.get(id);
    if (cached) {
      setPost(cached);
      setLoading(false);
      detectOwnershipAsync(cached).then(setIsMyPost);
      return;
    }

    // Cache miss — first ever view of this find. Reset post + loading so
    // the previous find's metadata clears immediately while the photograph
    // (sync first paint via preview cache) holds the slot. Avoids the
    // stale-data flash that would otherwise persist until getPost resolves.
    setPost(null);
    setLoading(true);
    getPost(id).then(async (data) => {
      if (data) findPostCache.set(id, data);
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
    setIsSaved(next);
    try {
      if (next) safeStorage.setItem(flagKey(id), "1");
      else      safeStorage.removeItem(flagKey(id));
    } catch {}
    // Q-003 addendum (session 36): resync badge count after in-page toggle so
    // the BottomNav heart badge reflects the save immediately.
    try { setBookmarkCount(loadFollowedIds().size); } catch {}
    // R3 — emit save / unsave event. Heart icon is the only engagement
    // mechanic on a find (terminology section in design record).
    track(next ? "post_saved" : "post_unsaved", { post_id: id });
  }

  async function handleShare() {
    const url = window.location.href;
    // R3 v1.1 — intent-capture semantic: fire find_shared when the user taps
    // the share affordance, regardless of whether they complete the OS share
    // sheet. The native share() Promise rejects on dismiss with no reliable
    // way to distinguish dismiss from error, so the most truthful signal is
    // "the user attempted to share." Closes session-59 carry-forward gap.
    if (navigator.share) {
      track("find_shared", { post_id: id, share_method: "native" });
      try {
        await navigator.share({
          title: post?.title ?? "A Treehouse find",
          text:  post?.caption ?? "",
          url,
        });
      } catch {}
    } else {
      track("find_shared", { post_id: id, share_method: "clipboard" });
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const handleShelfReady = useCallback((hasItems: boolean) => {
    setShelfHasItems(hasItems);
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
          <IconBubble onClick={() => router.back()} ariaLabel="Go back">
            <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </IconBubble>
        }
        right={
          // Session 78 — share airplane lifted off the photograph onto the
          // masthead, mirroring /shelf/[slug] + /my-shelf. Cross-page
          // consistency: top-right airplane shares the current entity (find
          // here, booth there). Gated on `post` so it doesn't flash during
          // the cached-preview window before data loads.
          post ? (
            <IconBubble onClick={handleShare} ariaLabel="Share this find">
              <Send
                size={22}
                strokeWidth={1.7}
                style={{ color: copied ? "#1e4d2b" : v1.green }}
              />
            </IconBubble>
          ) : null
        }
      />

      {/* Phase B (session 100) — swipe-between-finds wrapper. Drags
          horizontally; on commit (offset > 80px OR velocity > 500px/s)
          animates offscreen, then router.replace's to prev/next id.
          Drag is disabled when there's no neighbor on either side
          (deep-link arrival or single-item context). touchAction: pan-y
          lets vertical scroll pass through; the More-from-this-booth
          carousel below sets its own touch-action: pan-x to keep its
          native horizontal scroll working over its own region. */}
      <motion.div
        animate={swipeControls}
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
          <div
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkMid,
              lineHeight: 1.4,
              marginBottom: 8,
              paddingLeft: 2,
            }}
          >
            Find this item at
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
                          }}
                        >
                          {vendorName}
                        </div>
                      )}
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
                              marginTop: 2,
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
                              marginTop: 2,
                              lineHeight: 1.4,
                            }}
                          >
                            {mallSubtitle}
                          </div>
                        )
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
          </div>
        </div>
      )}

      {/* "More from this shelf…" strip */}
      {hasVendor && (
        <ShelfSection
          vendorId={post.vendor!.id}
          currentPostId={post.id}
          onReady={handleShelfReady}
        />
      )}

      {/* Owner Manage block retired v1.2 (session 31E polish). All three affordances moved to
          /find/[id]/edit: the pencil bubble on the photograph (top-right) routes there, and the
          Edit page carries autosave fields + Available/Sold status pills + Remove from shelf link.
          Find Detail is the reading surface; Edit is the management surface. */}
        </>
      )}

      </motion.div>

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
    </div>
  );
}
