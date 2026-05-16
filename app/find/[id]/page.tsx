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

import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
// PiStorefront import retired in session 170 Arc 3 — was consumed by
// the Explore Booth button (in the CTA pair that retired) and the
// inline cartographic eyebrow (now owned by <DestinationHero>).
import { motion, type PanInfo } from "framer-motion";
import FlagGlyph from "@/components/FlagGlyph";
import { getPost } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { getCachedUserId, getSession, isAdmin, onAuthChange } from "@/lib/auth";
import {
  v1,
  v2,
  FONT_LORA,
  FONT_SYS,
  FONT_NUMERAL,
  FONT_CORMORANT,
  FONT_INTER,
} from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
import { mapsUrl, boothNumeralSize } from "@/lib/utils";
// mallSnapshotUrl import retired in session 170 Arc 2 — map snapshot
// moved INSIDE <DestinationHero> per the Shape B re-architecture, so
// this page no longer constructs the URL directly.
import { track } from "@/lib/clientEvents";
// writeFindContext + getVendorPostsCache + setVendorPostsCache + FindRef
// imports retired in session 170 Arc 4 — all 4 were consumed only by
// the <ShelfSection> "More from this booth" carousel which retired
// per Shape B re-architecture (Frame C).
import { readFindContext, getPostCache, setPostCache } from "@/lib/findContext";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import PhotoLightbox from "@/components/PhotoLightbox";
import DestinationHero from "@/components/DestinationHero";
// LocationActions retired from /find/[id] in session 157 Review Board Find #1
// ("Take Trip" CTA replaced by "Save the Find" button). Component still
// shipped + consumed by /shelf/[slug] and /map's PinCallout — import line
// retires only here.
import MastheadProfileButton from "@/components/MastheadProfileButton";
import ShareBubble from "@/components/ShareBubble";
import ShareSheet from "@/components/ShareSheet";
// HomeFeedTile import retired in session 170 Arc 4 — only consumer
// was the <ShelfSection> carousel which retired per Shape B Frame C.
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

// Session 88 — peer-nav scroll-restore primitive. Two storage keys, both
// per-find (scoped by current post id) so peer-nav between different finds
// doesn't cross-contaminate scroll state. Pattern lifted from /flagged
// (canonical clean Phase 3 shape) + session-86 refuse-to-write-0 primitive.
const findScrollKey = (postId: string) => `treehouse_find_scroll_y:${postId}`;
// findStripScrollKey retired in session 170 Arc 4 — was the carousel's
// horizontal scroll-restore key; only consumer was <ShelfSection>.

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
// The 800ms window covers Next.js's route transition + any post-
// transition DOM commits before the scroll-restore effects sample.
// (Originally sized to also cover <ShelfSection>'s vendor-posts fetch;
// the carousel retired in session 170 Arc 4 but the window stays —
// the safety margin still serves the page-level swipe-nav path.)
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

// <ShelfSection> "More from this booth" carousel retired in session 170
// Arc 4 per Shape B Frame C re-architecture. Booth navigation now
// covered by <DestinationHero>'s tappable vendor/booth strip
// (routes to /shelf/[vendorSlug]). David's session-170 Q2 pick:
// "Retire entirely". The carousel-isolated state (allItems, ready,
// stripRef, stripPendingX, stripRestored, swipe-context handoff via
// writeFindContext) all retired together as scope-adjacent dead code
// byproducts per feedback_dead_code_cleanup_as_byproduct.

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
  // setShelfHasItems + shelfReady state retired in session 170 Arc 4 —
  // the "More from this booth" carousel that needed scroll-restore
  // readiness signalling retired per Shape B Frame C. Document height
  // now stabilizes after setLoading(false) without async-fetch growth,
  // so the scroll-restore useLayoutEffect below no longer needs the
  // shelfReady gate.
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

    // Phase C QA fix #3 (setShelfReady reset) retired in session 170
    // Arc 4 — the shelfReady gate it served lives no longer; the
    // <ShelfSection> carousel that introduced async-document-grow
    // retired per Shape B Frame C.
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

  // Restore scrollY once data has loaded. The shelfReady gate that the
  // session-100 Phase C QA fix added (to wait for <ShelfSection>'s
  // async fetch + render before scrollTo) retired in session 170 Arc 4
  // along with the carousel itself. Document height now stabilizes
  // after setLoading(false); the staircase retry below (100/300/600ms)
  // still serves as the safety net for any lazy-image-driven late
  // DOM expansion.
  //
  // Re-runs on id change via the [id, loading, post] dep so peer-
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
  }, [id, loading, post]);

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

  // handleShelfReady callback retired in session 170 Arc 4 along with
  // <ShelfSection>. Was the readiness-signal bridge between carousel
  // fetch resolution and the parent's scroll-restore gate (Phase C QA
  // fix #2). Both retired together; useCallback import retires too.

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
  // Session 169 round 2 — mall lat/lng REVIVED for the Explore Booth +
  // map snapshot redesign (Review Board Finding 4). Session 157 retired
  // them alongside the LocationActions render; the static-snapshot
  // consumer is a new use case + needs them back. SELECT-side
  // enrichment on lib/posts.ts has carried these through unchanged.
  const mallLat     = post?.mall?.latitude  ?? null;
  const mallLng     = post?.mall?.longitude ?? null;
  const price       = post?.price_asking;
  const showSoldBody   = !!post && isSold && !isMyPost;
  const showNormalBody = !!post && !showSoldBody;

  return (
    <div
      style={{
        minHeight: "100vh",
        // Session 169 round 3 — Review Board Finding 2: page bg
        // v2.bg.main → v2.surface.warm (#FBF6EA). David: "Change the
        // BG color for the /find page /shelf page (/my-shelf) page
        // to background: var(--th-v2-surface-warm)." Booth + Find
        // detail surfaces get a warmer cream than the default body
        // bg; reads as "you've entered a specific physical place"
        // chrome vs the (tabs)/ Explore/Saved/Booth-nav default.
        background: v2.surface.warm,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StickyMasthead
        bg={v2.surface.warm}
        left={
          <IconBubble onClick={() => {
            try { sessionStorage.setItem(POPSTATE_MARKER_KEY, String(Date.now())); } catch {}
            router.back();
          }} ariaLabel="Go back">
            <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </IconBubble>
        }
        right={
          // Session 159 — share airplane retires from /find masthead, relocates
          // to the photo overlay (ShareBubble stacked under the heart save
          // bubble; see Phase B wrapper below). Reverses session 78's
          // "share airplane lifted off the photograph onto the masthead"
          // call — surfaced per feedback_surface_locked_design_reversals.
          // Right slot universally renders <MastheadProfileButton /> per
          // David Q3 (session-159 opener); self-derives auth state via
          // useShopperAuth so this consumer doesn't need to thread auth
          // through.
          <MastheadProfileButton />
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
                  aria-label={isSaved ? "Remove Flag" : "Flag this find"}
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
                    weight="bold"
                    style={{ color: isSaved ? "#1e4d2b" : v1.inkPrimary, fill: isSaved ? "#1e4d2b" : "none" }}
                  />
                </button>
              </div>
            )}

            {/* Session 159 — share airplane relocated from masthead to photo
                overlay, stacked vertically under the heart save bubble. David
                Q4 + Q6 (session-159 opener) — "Stacked under the saved/leaf
                icon vertically ... Change the color of the share (airplane)
                icon to match the color of the Save leaf icon with the same
                bg color for the circle." ShareBubble variant="frosted"
                matches the heart's frosted-paper vocabulary exactly.

                Position logic: top:64 when heart is rendered (10 top + 44
                bubble + 10 gap = stacked sibling). Top:10 when heart is
                absent (owner case, !isMyPost is false) so the share bubble
                occupies the canonical top-right slot solo rather than
                floating mid-photo. */}
            {post && (post?.image_url || previewImageUrl) && (
              <div
                style={{
                  position: "absolute",
                  top: !isMyPost ? 64 : 10,
                  right: 10,
                  width: 44,
                  height: 44,
                  zIndex: 3,
                }}
              >
                <ShareBubble
                  variant="frosted"
                  ariaLabel="Share this find"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                />
              </div>
            )}

            {/* Post-it — static, no entrance animation.
                Session 144 iPhone QA: bg aligned to /shelf BoothPage post-it
                stamp value (v2.surface.card #FFFCF5) per David's "consistency
                let's align to the values on /shelf" call. Was v1.postit
                #fefae8 (warmer cream) since session 81's v1.postit dial.
                Session 157 Review Board Booth #2 — post-it tap routes to
                /shelf/[vendorSlug] when vendorSlug exists. David: "If
                someone clicks on the Post-it note it should go to the
                booth /shelf of the vendor." Wraps in Next.js Link when
                we have a slug; falls back to plain div otherwise (no
                navigation target). The cardInner Link wrapper below
                the cartographic block still keeps card-tap routing in
                parallel — post-it just adds a more visible affordance
                anchored on the booth-identity stamp itself. */}
            {post && boothNumber && (() => {
              const postItStyle: React.CSSProperties = {
                position: "absolute",
                bottom: -14,
                right: 4,
                width: 92,
                minHeight: 92,
                background: v2.surface.card,
                transform: "rotate(6deg)",
                transformOrigin: "bottom right",
                boxShadow: `0 6px 14px rgba(42,26,10,0.28), 0 0 0 0.5px rgba(42,26,10,0.16)`,
                padding: "14px 8px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: vendorSlug ? "pointer" : "default",
                textDecoration: "none",
                color: "inherit",
                WebkitTapHighlightColor: "transparent",
              };
              const postItInner = (
                <>
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
                </>
              );
              return vendorSlug ? (
                <Link
                  href={`/shelf/${vendorSlug}`}
                  aria-label={`Visit booth shelf for ${vendorName ?? "this vendor"}`}
                  style={postItStyle}
                >
                  {postItInner}
                </Link>
              ) : (
                <div style={postItStyle}>{postItInner}</div>
              );
            })()}
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
              fontFamily: FONT_INTER,
              fontSize: 32,
              fontWeight: 400,
              color: v2.accent.green,
              lineHeight: 1.18,
              letterSpacing: "-0.005em",
              // Review Board Finding 7A (session 153) — marginTop 2 → 4 for
              // more separation between title and price. Title-and-price
              // pairing rhythm on /find/[id]. Canonical for this pairing
              // pattern (Home tiles already use marginTop 4).
              marginTop: 4,
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

      {/* Session 169 round 2 CTA pair (Explore Booth + Flag the Find) retired
          in session 170 Arc 3 per Shape B re-architecture (Frame C). The
          page's primary CTA is now the PiLeaf save bubble in the photograph's
          top-right corner (already present since session 97 — see save bubble
          render above ~line 1262). Explore Booth's navigation affordance is
          covered by the DestinationHero's tappable vendor/booth strip
          (routes to /shelf/[vendorSlug]). Surface-locked design reversal of
          session 169 round 2's "two butts under the price" decision per
          feedback_surface_locked_design_reversals — explicitly surfaced
          because session 169 was solving "primary CTA + secondary booth nav"
          via a button pair, and Shape B solves it structurally via the
          lattice-canonical corner bubble + tappable destination card. */}

      {/* DestinationHero — session 170 Shape B re-architecture (Frame C
          map-led composition). Replaces the inline cartographic block
          (eyebrow + cardInner IIFE + standalone map snapshot Link) +
          the standalone map snapshot below it. All three parts collapse
          into one primitive that reads as the page's secondary hero.

          Surface-locked design reversal of session 169 round 2 — the
          map snapshot moved INSIDE the destination card instead of as
          a sibling below the mall/booth card. Same tap target
          (/map?mall=<slug>), same defensive fallback (Mapbox preview-
          deployment silent fail), just restructured into the card per
          design record D7+D17+D20.

          Purely informational — NO CTAs inside. Page's primary CTA is
          the PiLeaf save bubble in the photograph's top-right corner
          (already present since session 97; CTA pair under price
          retires in Arc 3).

          Design record: docs/find-destination-hero-design.md */}
      {(vendorName || boothNumber) && (
        <DestinationHero
          mallName={mallName}
          mallCity={mallCity}
          mallState={mallState}
          mallLat={mallLat}
          mallLng={mallLng}
          mallSlug={mallSlug}
          vendorName={vendorName}
          vendorSlug={vendorSlug}
          boothNumber={boothNumber}
          mapLink={mapLink}
        />
      )}

      {/* Owner Manage block retired v1.2 (session 31E polish). All three affordances moved to
          /find/[id]/edit: the pencil bubble on the photograph (top-right) routes there, and the
          Edit page carries autosave fields + Available/Sold status pills + Remove from shelf link.
          Find Detail is the reading surface; Edit is the management surface. */}
        </>
      )}

      </motion.div>

      {/* <ShelfSection> "More from this booth" carousel retired in
          session 170 Arc 4 per Shape B Frame C re-architecture. David's
          session-170 Q2 pick: "Retire entirely". Booth navigation
          covered by <DestinationHero>'s tappable vendor/booth strip
          (routes to /shelf/[vendorSlug]) — semantically the same
          intent (browse-other-finds-at-this-booth → land on /shelf
          which shows all booth finds), 1 extra tap, acceptable
          trade-off for the cohesion gain of collapsing the page from
          7 stacked sections to 3 anchors. */}

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
