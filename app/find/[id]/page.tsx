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
import { motion } from "framer-motion";
import { ArrowLeft, Send, Pencil } from "lucide-react";
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
  MOTION_SHARED_ELEMENT_EASE,
  MOTION_SHARED_ELEMENT_FORWARD,
} from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
import { flagKey, mapsUrl, boothNumeralSize, loadFollowedIds } from "@/lib/utils";
import { track } from "@/lib/clientEvents";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import PhotoLightbox from "@/components/PhotoLightbox";
import type { Post } from "@/types/treehouse";

// v1.1 tokens imported from lib/tokens.ts (canonical since session 19A). v1 palette +
// fonts match docs/design-system.md v1.1h.

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const sectionVariants = (delay: number) => ({
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, delay, ease: EASE } },
});

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

// Shelf card (v1.1)
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
            aspectRatio: "3/4",
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
  // to restore the moment the strip renders.
  useEffect(() => {
    stripRestored.current = false;
    stripPendingX.current = null;
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
    <motion.div
      variants={sectionVariants(0.22)}
      initial="hidden"
      animate="visible"
      style={{ marginBottom: 32 }}
    >
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
          paddingLeft: 0,
          paddingRight: 22,
          paddingBottom: 4,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              scrollSnapAlign: "start",
              flexShrink: 0,
              marginLeft: idx === 0 ? 22 : 0,
            }}
          >
            <ShelfCard post={item} />
          </div>
        ))}
        <div style={{ flexShrink: 0, width: 10 }} />
      </div>
    </motion.div>
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
        width: 38,
        height: 38,
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
      <motion.div
        variants={sectionVariants(0.08)}
        initial="hidden"
        animate="visible"
        style={{ padding: "90px 32px 0", textAlign: "center" }}
      >
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
      </motion.div>

      <motion.div
        variants={sectionVariants(0.14)}
        initial="hidden"
        animate="visible"
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
      </motion.div>

      <motion.div
        variants={sectionVariants(0.18)}
        initial="hidden"
        animate="visible"
        style={{
          padding: "20px 60px 16px",
        }}
      >
        <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
      </motion.div>

      <motion.div
        variants={sectionVariants(0.22)}
        initial="hidden"
        animate="visible"
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
      </motion.div>

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
  // synchronously in a useState initializer so the photograph
  // <motion.button layoutId> can render on the very first commit, before
  // getPost() resolves. Without this, framer-motion has lost the source
  // tile's rect by the time the destination motion node mounts post-fetch
  // and the shared-element morph silently snaps. Direct URL nav (no source
  // tap) leaves this null — the page loads normally with no morph (correct
  // — there's nothing to morph from).
  const [previewImageUrl] = useState<string | null>(() => {
    if (typeof window === "undefined" || !id) return null;
    try {
      const raw = sessionStorage.getItem(`treehouse_find_preview:${id}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed?.image_url === "string" ? parsed.image_url : null;
    } catch { return null; }
  });

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
  // user tapped a "More from this booth" thumb. Refuse-to-write-0 keeps
  // storage clean — empty storage already restores to 0 by default. Reset
  // refs on id change so peer-nav restoration starts fresh for the new find.
  useEffect(() => {
    if (!id) return;
    scrollRestored.current = false;
    pendingScrollY.current = null;
    try {
      const saved = sessionStorage.getItem(findScrollKey(id));
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) pendingScrollY.current = y;
      }
    } catch {}
    function onScroll() {
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
    getPost(id).then(async (data) => {
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
            <ArrowLeft size={18} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
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
                size={18}
                strokeWidth={1.7}
                style={{ color: copied ? "#1e4d2b" : v1.green }}
              />
            </IconBubble>
          ) : null
        }
      />

      {/* Photograph hero — escapes the loading gate so the
          <motion.button layoutId> mounts on the very first commit. The
          source surface (feed / /flagged) cached the image_url in
          sessionStorage on tile tap; we read it synchronously above.
          Without this, framer-motion has lost the source tile's rect by
          the time the destination motion node mounts post-fetch and the
          shared-element morph silently snaps. Bubbles + post-it stay
          gated on `post` since they depend on data that's not in the
          preview cache (vendor, isMyPost, isSaved, boothNumber). */}
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
              // Session 78 — motion.div instead of motion.button so the
              // flag/pencil bubble (now a sibling, see below) can be a real
              // <button> without conflicting with parent button semantics.
              // role="button" + tabIndex preserve the keyboard activation.
              <motion.div
                layoutId={`find-${id}`}
                transition={{ duration: MOTION_SHARED_ELEMENT_FORWARD, ease: MOTION_SHARED_ELEMENT_EASE }}
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
              </motion.div>
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

            {/* Flag — SIBLING of the photograph motion.div with its own
                layoutId. Size + position now identical to the home + /flagged
                tile flags (36×36 at top:8 right:8) so the layoutId path is
                pure corner-tracking — the bubble sits in the exact same
                relative-corner position on both surfaces, the morph
                interpolates only the screen-space offset between them.
                Earlier the find-detail offset was 12/12 vs 8/8 on tiles,
                which read as a subtle size mismatch even with identical
                bubble dimensions. */}
            {post && (post?.image_url || previewImageUrl) && (
              <motion.div
                layoutId={`flag-${id}`}
                layout="position"
                transition={{ duration: MOTION_SHARED_ELEMENT_FORWARD, ease: MOTION_SHARED_ELEMENT_EASE }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 36,
                  height: 36,
                  zIndex: 3,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMyPost) router.push(`/find/${post.id}/edit`);
                    else handleToggleSave();
                  }}
                  aria-label={isMyPost ? "Edit this find" : (isSaved ? "Remove flag" : "Flag")}
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
                  {isMyPost ? (
                    <Pencil size={16} strokeWidth={1.8} style={{ color: v1.inkPrimary }} />
                  ) : (
                    <FlagGlyph
                      size={17}
                      strokeWidth={1.7}
                      style={{ color: isSaved ? "#1e4d2b" : v1.inkPrimary, fill: isSaved ? "#1e4d2b" : "none" }}
                    />
                  )}
                </button>
              </motion.div>
            )}

            {/* Post-it — Session 78 R3: subtler zoom-in. David's spec was
                "like the push pin is just being pushed in, not slammed on."
                Initial scale dialed back from 1.4 → 1.15 so the post-it
                lands close to its final size and just lightly settles. */}
            {post && boothNumber && (
              <motion.div
                initial={{ opacity: 0, scale: 1.15, rotate: 6 }}
                animate={{ opacity: 1, scale: 1, rotate: 6 }}
                transition={{ duration: MOTION_SHARED_ELEMENT_FORWARD, ease: MOTION_SHARED_ELEMENT_EASE }}
                style={{
                  position: "absolute",
                  bottom: -14,
                  right: 4,
                  width: 92,
                  minHeight: 92,
                  background: v1.postit,
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
              </motion.div>
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
          David's request: "feels like one transition, not two." */}
      <motion.div
        variants={sectionVariants(0)}
        initial="hidden"
        animate="visible"
        style={{ padding: "0 22px", marginBottom: 20, textAlign: "center" }}
      >
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
      </motion.div>

      {/* Quoted caption (v1.1 19px) — session 78: delay 0 so it arrives
          with the photograph morph as one cohesive entrance. */}
      {post.caption && (
        <motion.div
          variants={sectionVariants(0)}
          initial="hidden"
          animate="visible"
          style={{ padding: "0 30px", marginBottom: 30, textAlign: "center" }}
        >
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
        </motion.div>
      )}

      {/* Divider (v1.1j plain hairline, diamond retired) — session 78:
          delay 0 alongside the rest of the entrance. */}
      {(vendorName || boothNumber) && (
        <motion.div
          variants={sectionVariants(0)}
          initial="hidden"
          animate="visible"
          style={{
            padding: "0 44px",
            marginBottom: 22,
          }}
        >
          <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
        </motion.div>
      )}

      {/* Cartographic block (session 71 round 2 — fully collapsed) — single
          inkWash card with italic "Find this item at" eyebrow above. XGlyph
          spine retired since cartographic identity no longer earns its place
          on this page (no other page carries it either).
          Session 78 — delay 0 alongside the rest of the entrance. */}
      {(vendorName || boothNumber) && (
        <motion.div
          variants={sectionVariants(0)}
          initial="hidden"
          animate="visible"
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
        </motion.div>
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
