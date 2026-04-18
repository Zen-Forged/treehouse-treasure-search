// app/find/[id]/page.tsx
// Find Detail — v1.1f (docs/design-system.md §Find Detail, updated session 17)
//
// Layout top-to-bottom:
//   1. Masthead row (Mode A): back · "Treehouse Finds" wordmark (16px) · save + share
//   2. Photograph (6px radius) with post-it BOTTOM-LEFT + status pill bottom-right (both Title Case)
//   3. Title + price (32px, em-dash, price in softer ink)
//   4. Quoted caption (centered IM Fell italic, 19px, typographic quotes)
//   5. Diamond divider ◆
//   6. Cartographic block — pin + mall + address (system-ui); tick; X anchored to vendor line;
//      vendor name + booth pill (Booth 123456, matches status pill); "Visit the shelf →" in system-ui
//   7. "More from this shelf…" strip — Title Case eyebrow, inset to 22px page margin,
//      6px radius on thumbnails
//   8. Owner Manage block (paper-as-surface, Title Case, larger type)
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

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Heart, Pencil, Tag, Trash2 } from "lucide-react";
import { getPost, getVendorPosts, updatePostStatus, deletePost } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { safeStorage } from "@/lib/safeStorage";
import { getCachedUserId, getSession, isAdmin } from "@/lib/auth";
import { flagKey, mapsUrl } from "@/lib/utils";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

// ── v1.1 tokens ─────────────────────────────────────────────────────────────
// Imported from lib/tokens.ts (canonical since session 19A). v1 palette +
// fonts match docs/design-system.md v1.1h.

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const pageVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } },
};

const sectionVariants = (delay: number) => ({
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, delay, ease: EASE } },
});

// ── Ownership detection (unchanged) ────────────────────────────────────────────
async function detectOwnershipAsync(post: Post): Promise<boolean> {
  try {
    const session = await getSession();
    if (session?.user && isAdmin(session.user)) return true;
    const sessionUid = getCachedUserId() ?? session?.user?.id;
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

// ── Cartographic glyphs ────────────────────────────────────────────────────────
function PinGlyph({ size = 18 }: { size?: number }) {
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

function XGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="3"  x2="13" y2="13" stroke={v1.inkPrimary} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="13" y1="3" x2="3"  y2="13" stroke={v1.inkPrimary} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Status-pill primitive (v1.1) ───────────────────────────────────────────────
// Used for on-photo status ("On Display" / "Found a Home") AND for the booth-number
// marker on the vendor line of the cartographic block. The visual match is the point —
// the reader sees the two pills as a linked pair even though they sit in different places.
function Pill({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  // v1.1e — pure numeric badge role (no "Booth" word, no arrow, no gloss — just the number).
  // The label ("Explore booth →") now carries the action signal; the pill is the token.
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
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ── Shelf card (v1.1) ──────────────────────────────────────────────────────────
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
          position: "relative",
          width: "100%",
          aspectRatio: "3/4",
          overflow: "hidden",
          background: v1.postit,
          borderRadius: v1.imageRadius, // v1.1
          border: `1px solid ${v1.inkHairline}`, // v1.1d — match hero photo border
          boxShadow: "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)", // v1.1i-polish
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
              filter: isSold ? "grayscale(0.5) brightness(0.88)" : "none",
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
            <div style={{ fontFamily: FONT_IM_FELL, fontSize: 13, color: v1.inkMuted, lineHeight: 1.25 }}>
              {post.title}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 8,
          paddingLeft: 2,
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 13, // v1.1 bump 11 → 13
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
    </Link>
  );
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

  useEffect(() => {
    getVendorPosts(vendorId, 12).then((posts) => {
      const filtered = posts.filter((p) => p.id !== currentPostId);
      setItems(filtered);
      setReady(true);
      onReady(filtered.length > 0);
    });
  }, [vendorId, currentPostId, onReady]);

  if (!ready || items.length === 0) return null;

  return (
    <motion.div
      variants={sectionVariants(0.22)}
      initial="hidden"
      animate="visible"
      style={{ marginBottom: 32 }}
    >
      {/* v1.1b — eyebrow bumped 13 → 15, section-announcement floor */}
      <div
        style={{
          paddingLeft: 22,
          paddingRight: 22,
          marginBottom: 14,
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 15,
          color: v1.inkMuted,
        }}
      >
        More from this shelf…
      </div>
      {/* v1.1c — defensive marginLeft on first thumbnail to guarantee 22px screen-edge inset */}
      <div
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

// ── Icon bubble ────────────────────────────────────────────────────────────────
// v1.1e: default size bumped 34 → 38 for on-image parity.
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
  const frostedBg = "rgba(232,221,199,0.78)"; // paperCream translucent — reads as frosted over any photo

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

// SoldLanding ─ Find Detail 3B (v1.1i). Full-page end-of-path layout that
// replaces the normal Find Detail when a shopper lands on a sold find. Owner
// path stays on the normal layout (manage affordances). No photograph, no
// post-it, no price — the page IS the closure.
function SoldLanding({
  vendorSlug,
  vendorName,
  onBack,
}: {
  vendorSlug: string | null;
  vendorName: string | null;
  onBack: () => void;
}) {
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
      {/* 1. Masthead — same chrome as normal Find Detail, sticky to top */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "max(14px, env(safe-area-inset-top, 14px)) 18px 14px",
          gap: 12,
          background: "rgba(232,221,199,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${v1.inkHairline}`,
        }}
      >
        <div style={{ justifySelf: "start" }}>
          <IconBubble onClick={onBack} ariaLabel="Go back">
            <ArrowLeft size={18} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </IconBubble>
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

      {/* 2. Headline — "This find / found a home." with hard line break */}
      <motion.div
        variants={sectionVariants(0.08)}
        initial="hidden"
        animate="visible"
        style={{ padding: "90px 32px 0", textAlign: "center" }}
      >
        <div
          style={{
            fontFamily: FONT_IM_FELL,
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

      {/* 3. Explanation */}
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
            fontFamily: FONT_IM_FELL,
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

      {/* 4. Diamond divider (closer, 60px inset) */}
      <motion.div
        variants={sectionVariants(0.18)}
        initial="hidden"
        animate="visible"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "20px 60px 16px",
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

      {/* 5 + 6. Primary + secondary links */}
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
              fontFamily: FONT_IM_FELL,
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
            fontFamily: FONT_IM_FELL,
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

      {/* Fill remaining height so BottomNav sits at the bottom */}
      <div style={{ flex: 1, minHeight: 20 }} />

      <div style={{ paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }} />
      <BottomNav active={null} />
    </div>
  );
}

export default function FindDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post,          setPost]          = useState<Post | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [copied,        setCopied]        = useState(false);
  const [isMyPost,      setIsMyPost]      = useState(false);
  const [actionBusy,    setActionBusy]    = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [, setShelfHasItems]              = useState(false);
  const [isSaved,       setIsSaved]       = useState(false);

  useEffect(() => {
    if (!id) return;
    try { setIsSaved(safeStorage.getItem(flagKey(id)) === "1"); } catch {}
    getPost(id).then(async (data) => {
      setPost(data);
      setLoading(false);
      if (data) {
        const isOwner = await detectOwnershipAsync(data);
        setIsMyPost(isOwner);
      }
    });
  }, [id]);

  function handleToggleSave() {
    if (!id) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) safeStorage.setItem(flagKey(id), "1");
      else      safeStorage.removeItem(flagKey(id));
    } catch {}
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title ?? "A Treehouse find",
          text:  post?.caption ?? "",
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleToggleSold() {
    if (!post || actionBusy) return;
    const next = post.status === "sold" ? "available" : "sold";
    setActionBusy(true);
    const ok = await updatePostStatus(post.id, next);
    if (ok) setPost((p) => (p ? { ...p, status: next } : p));
    setActionBusy(false);
  }

  async function handleDelete() {
    if (!post || actionBusy) return;
    setActionBusy(true);
    const ok = await deletePost(post.id);
    if (ok) router.replace("/");
    else    setActionBusy(false);
  }

  const handleShelfReady = useCallback((hasItems: boolean) => {
    setShelfHasItems(hasItems);
  }, []);

  const mapLink = post?.mall?.address
    ? mapsUrl(post.mall.address)
    : post?.mall
    ? mapsUrl(`${post.mall.name} ${post.mall.city} ${post.mall.state}`)
    : null;

  // ── Loading / 404 states ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", color: v1.inkMuted, fontSize: 15 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: 24,
        }}
      >
        <div style={{ fontFamily: FONT_IM_FELL, fontSize: 24, color: v1.inkPrimary, textAlign: "center" }}>
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
    );
  }

  const isSold      = post.status === "sold";
  const hasVendor   = !!post.vendor;
  const vendorSlug  = post.vendor?.slug ?? null;
  const vendorName  = post.vendor?.display_name ?? null;
  const boothNumber = post.vendor?.booth_number ?? null;
  const mallName    = post.mall?.name ?? null;
  const mallAddr    = post.mall?.address ?? null;
  const price       = post.price_asking;

  // ── 3B sold landing state (v1.1i, docs/design-system.md §Find Detail sold
  // landing state). When a shopper deep-links or bookmark-taps through to a
  // find that has since sold, replace the normal Find Detail layout entirely
  // with a quiet end-of-path page. Owner exception: owners of the sold find
  // still see the normal layout (including manage affordances) so they can
  // mark it available again, edit, or delete — 3B is a shopper-facing surface.
  if (isSold && !isMyPost) {
    return (
      <SoldLanding
        vendorSlug={vendorSlug}
        vendorName={vendorName}
        onBack={() => router.back()}
      />
    );
  }

  // Note (v1.1i): the grayscale/opacity treatment applied to the hero photograph
  // when `isSold` is now dead code for the shopper path (3B branches out above).
  // It only ever renders for the owner viewing their own sold find. Cleanup is
  // parked for a future pass — leaving the branch in place is a no-op on the
  // shopper flow.

  // ── Render ───────────────────────────────────────────────────────────────────
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
      {/* ── 1. Masthead row — v1.1e: back + wordmark only; save/share move to photograph ── */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "max(14px, env(safe-area-inset-top, 14px)) 18px 14px",
          gap: 12,
          background: "rgba(232,221,199,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${v1.inkHairline}`,
        }}
      >
        <div style={{ justifySelf: "start" }}>
          <IconBubble onClick={() => router.back()} ariaLabel="Go back">
            <ArrowLeft size={18} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </IconBubble>
        </div>

        {/* v1.1e — masthead wordmark: Title Case single style, no italic, 18px, tighter tracking */}
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

        {/* Right slot intentionally empty — save + share now live on the photograph */}
        <div style={{ justifySelf: "end" }} aria-hidden="true" />
      </motion.div>

      {/* ── 2. Photograph with post-it (bottom-right) + save/share (top-right, v1.1e) ── */}
      <motion.div
        variants={sectionVariants(0.04)}
        initial="hidden"
        animate="visible"
        style={{ padding: "0 22px", marginBottom: 28, position: "relative" }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/5",
            overflow: "visible", // allow post-it overhang
          }}
        >
          {/* Photograph — v1.1d: 6px radius + 1px inkHairline border for warm-tone separation
              v1.1i-polish: subtle paper-tone drop-shadow to lift the photo off the page */}
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={post.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                borderRadius: v1.imageRadius,
                border: `1px solid ${v1.inkHairline}`,
                boxShadow: "0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)",
                filter: isSold ? "grayscale(0.35) brightness(0.9)" : "none",
              }}
            />
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
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkFaint,
              }}
            >
              no photograph
            </div>
          )}

          {/* v1.1e — save + share as frosted overlay bubbles, top-right of photograph */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              zIndex: 2,
            }}
          >
            <IconBubble
              onClick={handleToggleSave}
              ariaLabel={isSaved ? "Remove from saved" : "Save"}
              active={isSaved}
              variant="frosted"
            >
              <Heart
                size={17}
                strokeWidth={isSaved ? 0 : 1.6}
                style={{ color: isSaved ? "#1e4d2b" : v1.inkPrimary, fill: isSaved ? "#1e4d2b" : "none" }}
              />
            </IconBubble>
            <IconBubble onClick={handleShare} ariaLabel="Share" variant="frosted">
              <Send size={17} strokeWidth={1.6} style={{ color: copied ? "#1e4d2b" : v1.inkPrimary }} />
            </IconBubble>
          </div>

          {/* v1.1d — post-it moved BOTTOM-RIGHT with push pin at top-center
              v1.1f — inset from screen edge, rotation bumped +3 → +6deg, "Booth Location" stacked */}
          {boothNumber && (
            <div
              style={{
                position: "absolute",
                bottom: -14,
                right: 4, // v1.1f — was -12; pulled inward so post-it sits fully inside the 22px page margin
                width: 92,
                minHeight: 92, // v1.1f — was 84; grown to accommodate stacked "Booth Location" eyebrow without crowding the numeral
                background: v1.postit,
                transform: "rotate(6deg)", // v1.1f — was 3deg; more casual placed-verb without becoming fallen-over
                transformOrigin: "bottom right",
                boxShadow: `0 6px 14px rgba(42,26,10,0.28), 0 0 0 0.5px rgba(42,26,10,0.16)`,
                padding: "14px 8px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Push pin — top-center, matte ink, appears to go through the note */}
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
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkMuted,
                  lineHeight: 1.1, // v1.1f — tight so "Booth" / "Location" read as one stacked label
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                Booth<br />Location
              </div>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontSize: 36,
                  color: v1.inkPrimary,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                {boothNumber}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── 3. Title + price — v1.1 32px ─────────────────────────────────────── */}
      <motion.div
        variants={sectionVariants(0.10)}
        initial="hidden"
        animate="visible"
        style={{ padding: "0 22px", marginBottom: 20 }}
      >
        <h1
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 32,
            fontWeight: 400,
            color: v1.inkPrimary,
            lineHeight: 1.18,
            letterSpacing: "-0.005em",
            margin: 0,
          }}
        >
          {post.title}
          {typeof price === "number" && price > 0 && (
            <>
              {" "}
              <span style={{ color: v1.priceInk }}>— ${Math.round(price)}</span>
            </>
          )}
        </h1>
      </motion.div>

      {/* ── 4. Quoted caption — v1.1 19px ────────────────────────────────────── */}
      {post.caption && (
        <motion.div
          variants={sectionVariants(0.14)}
          initial="hidden"
          animate="visible"
          style={{ padding: "0 30px", marginBottom: 30, textAlign: "center" }}
        >
          <span
            style={{
              fontFamily: FONT_IM_FELL,
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
              fontFamily: FONT_IM_FELL,
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
              fontFamily: FONT_IM_FELL,
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

      {/* ── 5. Diamond divider ──────────────────────────────────────────────── */}
      {(mallName || boothNumber) && (
        <motion.div
          variants={sectionVariants(0.16)}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 44px",
            marginBottom: 22,
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

      {/* ── 6. Cartographic block — v1.1 pin + tick + X (anchored to vendor line) ── */}
      {(mallName || vendorName || boothNumber) && (
        <motion.div
          variants={sectionVariants(0.18)}
          initial="hidden"
          animate="visible"
          style={{
            display: "grid",
            gridTemplateColumns: "28px 1fr",
            columnGap: 14,
            padding: "0 28px",
            marginBottom: 32,
          }}
        >
          {/* Glyph column — pin at top of mall row, X at top of vendor row,
              tick fills the gap between them */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Pin aligned to mall name baseline */}
            {mallName && (
              <div style={{ paddingTop: 3, marginBottom: 0 }}>
                <PinGlyph size={18} />
              </div>
            )}
            {/* Tick */}
            {mallName && (vendorName || boothNumber) && (
              <div
                style={{
                  width: 1,
                  flex: 1,
                  minHeight: 48,
                  background: v1.inkHairline,
                  margin: "6px 0",
                }}
              />
            )}
            {/* X aligned to vendor name baseline — v1.1e paddingTop calibrated to ascender */}
            {(vendorName || boothNumber) && (
              <div style={{ paddingTop: 3, marginBottom: 0 }}>
                <XGlyph size={15} />
              </div>
            )}
          </div>

          {/* Content column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {/* Mall row */}
            {mallName && (
              <div>
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontSize: 18,
                    color: v1.inkPrimary,
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {mallName}
                </div>
                {mallAddr && (
                  mapLink ? (
                    <a
                      href={mapLink}
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
                      {mallAddr}
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
                      {mallAddr}
                    </span>
                  )
                )}
              </div>
            )}

            {/* Vendor row — v1.1d: vendor name on top; "Explore" label + shelf-link pill inline below, both wrapped in the Link */}
            {(vendorName || boothNumber) && (
              <div>
                {vendorName && (
                  <div
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontSize: 18,
                      color: v1.inkPrimary,
                      lineHeight: 1.3,
                      marginBottom: 10,
                    }}
                  >
                    {vendorName}
                  </div>
                )}
                {boothNumber && vendorSlug && (
                  <Link
                    href={`/shelf/${vendorSlug}`}
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT_SYS,
                        fontWeight: 400,
                        fontSize: 14,
                        color: v1.inkMuted,
                        textDecoration: "underline",
                        textDecorationStyle: "dotted",
                        textDecorationColor: v1.inkFaint,
                        textUnderlineOffset: 3,
                        lineHeight: 1.55,
                      }}
                    >
                      Explore booth →
                    </span>
                    <Pill>{boothNumber}</Pill>
                  </Link>
                )}
                {boothNumber && !vendorSlug && (
                  <Pill>{boothNumber}</Pill>
                )}
                {!boothNumber && vendorSlug && (
                  <Link
                    href={`/shelf/${vendorSlug}`}
                    style={{
                      fontFamily: FONT_SYS,
                      fontWeight: 400,
                      fontSize: 14,
                      color: v1.inkMuted,
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v1.inkFaint,
                      textUnderlineOffset: 3,
                      lineHeight: 1.55,
                    }}
                  >
                    Visit the shelf →
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── 7. "More from this shelf…" ──────────────────────────────────────── */}
      {hasVendor && (
        <ShelfSection
          vendorId={post.vendor!.id}
          currentPostId={post.id}
          onReady={handleShelfReady}
        />
      )}

      {/* ── 8. Owner Manage block — v1.1 larger type, Title Case ──────────────── */}
      {isMyPost && (
        <motion.div
          variants={sectionVariants(0.28)}
          initial="hidden"
          animate="visible"
          style={{ padding: "10px 26px 30px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 15,
                color: v1.inkMuted,
              }}
            >
              Manage
            </div>
            <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
          </div>

          {!showDelete ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
              <button
                onClick={() => router.push(`/post/edit/${post.id}`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 4px",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: v1.inkPrimary,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Pencil size={14} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
                Edit this find
              </button>

              <button
                onClick={handleToggleSold}
                disabled={actionBusy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  cursor: actionBusy ? "default" : "pointer",
                  padding: "8px 4px",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: v1.inkPrimary,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  opacity: actionBusy ? 0.5 : 1,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Tag size={14} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
                {isSold ? "Mark as On Display" : "Mark as Found a Home"}
              </button>

              <button
                onClick={() => setShowDelete(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 4px",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkMuted,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Trash2 size={12} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
                Delete this find
              </button>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "18px 18px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontSize: 20,
                    color: v1.inkPrimary,
                    marginBottom: 10,
                  }}
                >
                  Delete this find?
                </div>
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontStyle: "italic",
                    fontSize: 14,
                    color: v1.inkMuted,
                    marginBottom: 20,
                    lineHeight: 1.6,
                  }}
                >
                  This can’t be undone. The photograph and listing will be permanently removed.
                </div>
                <div style={{ display: "flex", gap: 28, justifyContent: "center" }}>
                  <button
                    onClick={handleDelete}
                    disabled={actionBusy}
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontStyle: "italic",
                      fontSize: 15,
                      color: "#8b2020",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px 4px",
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: "rgba(139,32,32,0.4)",
                      textUnderlineOffset: 3,
                      opacity: actionBusy ? 0.6 : 1,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {actionBusy ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontStyle: "italic",
                      fontSize: 15,
                      color: v1.inkMuted,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px 4px",
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v1.inkFaint,
                      textUnderlineOffset: 3,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      )}

      <div style={{ paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }} />
      <BottomNav active={null} />
    </div>
  );
}
