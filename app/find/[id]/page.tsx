// app/find/[id]/page.tsx
// Find Detail — v1.0 (docs/design-system.md §Find Detail, locked session 15)
//
// Layout top-to-bottom:
//   1. Masthead row (Mode A): back · "Treehouse Finds" wordmark · save + share
//   2. Photograph with post-it top-left (material gesture) + status pill bottom-right
//   3. Title + price (em-dash, price in softer ink)
//   4. Quoted caption (centered IM Fell italic, typographic quotes)
//   5. Diamond divider ◆
//   6. Cartographic block — pin + mall + address; connecting tick; X + vendor + booth + "Visit the shelf →"
//   7. "more from this shelf…" horizontal strip
//   8. Owner Manage block (paper-as-surface, preserved behavior per session 16 Decision 1a)
//
// v1.0 tokens are inlined here pending the Booth v1.0 sprint which formalizes them in lib/tokens.ts.

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
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

// ── v1.0 inline tokens ─────────────────────────────────────────────────────────
// TODO(booth-v1.0): promote these to lib/tokens.ts during the Booth v1.0 sprint.
// Keeping inline for this session to avoid cross-screen token drift mid-flight.
const v1 = {
  paperCream:  "#f1ead8",
  postit:      "#faf3dc",
  inkPrimary:  "#2a1a0a",
  inkMid:      "#4a3520",
  inkMuted:    "#7a6244",
  inkFaint:    "rgba(42,26,10,0.28)",
  inkHairline: "rgba(42,26,10,0.18)",
  priceInk:    "#6a4a30",
  pillBg:      "rgba(247,239,217,0.55)",
  pillBorder:  "rgba(42,26,10,0.72)",
  pillInk:     "#1c1208",
  iconBubble:  "rgba(42,26,10,0.06)",
} as const;

const FONT_IM_FELL = 'var(--font-im-fell), "IM Fell English", Georgia, serif';
const FONT_SYS     = '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const pageVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } },
};

const sectionVariants = (delay: number) => ({
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, delay, ease: EASE } },
});

// ── Ownership detection (unchanged from v0.2) ──────────────────────────────────
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
// Pin: outlined teardrop with filled dot. Represents the mall (zoom-out).
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

// X: two crossed lines at 45°, no frame. Represents the booth (exact spot).
function XGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="3"  x2="13" y2="13" stroke={v1.inkPrimary} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="13" y1="3" x2="3"  y2="13" stroke={v1.inkPrimary} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Shelf card (v1.0) ──────────────────────────────────────────────────────────
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
            <div style={{ fontFamily: FONT_IM_FELL, fontSize: 12, color: v1.inkMuted, lineHeight: 1.25 }}>
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
          fontSize: 11,
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
      <div
        style={{
          paddingLeft: 22,
          paddingRight: 22,
          marginBottom: 14,
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 10,
          color: v1.inkMuted,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
        }}
      >
        more from this shelf…
      </div>
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          overflowY: "hidden",
          paddingLeft: 22,
          paddingRight: 22,
          paddingBottom: 4,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((item) => (
          <div key={item.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
            <ShelfCard post={item} />
          </div>
        ))}
        <div style={{ flexShrink: 0, width: 10 }} />
      </div>
    </motion.div>
  );
}

// ── Icon bubble (shared chrome treatment for masthead actions) ─────────────────
function IconBubble({
  onClick,
  ariaLabel,
  children,
  active,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(30,77,43,0.14)" : v1.iconBubble,
        border: "none",
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

// ══════════════════════════════════════════════════════════════════════════════
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
        <div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", color: v1.inkMuted, fontSize: 14 }}>
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
        <div style={{ fontFamily: FONT_IM_FELL, fontSize: 22, color: v1.inkPrimary, textAlign: "center" }}>
          This find has moved on.
        </div>
        <button
          onClick={() => router.push("/")}
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkPrimary,
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textDecorationStyle: "dotted",
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
      {/* ── 1. Masthead row (Mode A) ────────────────────────────────────────── */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "max(14px, env(safe-area-inset-top, 14px)) 18px 14px",
          gap: 12,
        }}
      >
        {/* LEFT — back */}
        <div style={{ justifySelf: "start" }}>
          <IconBubble onClick={() => router.back()} ariaLabel="Go back">
            <ArrowLeft size={15} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </IconBubble>
        </div>

        {/* CENTER — masthead wordmark */}
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 15,
            color: v1.inkPrimary,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Treehouse <span style={{ fontStyle: "italic" }}>Finds</span>
        </div>

        {/* RIGHT — save + share cluster */}
        <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 8 }}>
          <IconBubble onClick={handleToggleSave} ariaLabel={isSaved ? "Remove from saved" : "Save"} active={isSaved}>
            <Heart
              size={14}
              strokeWidth={isSaved ? 0 : 1.6}
              style={{ color: isSaved ? "#1e4d2b" : v1.inkPrimary, fill: isSaved ? "#1e4d2b" : "none" }}
            />
          </IconBubble>
          <IconBubble onClick={handleShare} ariaLabel="Share">
            <Send size={13} strokeWidth={1.6} style={{ color: copied ? "#1e4d2b" : v1.inkPrimary }} />
          </IconBubble>
        </div>
      </motion.div>

      {/* ── 2. Photograph with post-it + status pill ────────────────────────── */}
      <motion.div
        variants={sectionVariants(0.04)}
        initial="hidden"
        animate="visible"
        style={{ padding: "0 22px", marginBottom: 26, position: "relative" }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/5",
            overflow: "visible", // allow post-it overhang
          }}
        >
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={post.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: isSold ? "grayscale(0.35) brightness(0.9)" : "none",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: v1.postit,
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

          {/* Booth post-it — top-left, overlapping photo edge */}
          {boothNumber && (
            <div
              style={{
                position: "absolute",
                top: -8,
                left: -8,
                width: 66,
                minHeight: 62,
                background: v1.postit,
                transform: "rotate(-3deg)",
                transformOrigin: "top left",
                boxShadow: `0 4px 8px rgba(42,26,10,0.20), 0 0 0 0.5px rgba(42,26,10,0.08)`,
                padding: "8px 6px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 9.5,
                  color: v1.inkMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                Booth
              </div>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontSize: 27,
                  color: v1.inkPrimary,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                {boothNumber}
              </div>
            </div>
          )}

          {/* Status pill — bottom-right, straight */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              padding: "5px 11px 4px",
              borderRadius: 999,
              background: v1.pillBg,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              border: `1.5px solid ${v1.pillBorder}`,
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 11,
              color: v1.pillInk,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              lineHeight: 1,
            }}
          >
            {isSold ? "found a home" : "on display"}
          </div>
        </div>
      </motion.div>

      {/* ── 3. Title + price ────────────────────────────────────────────────── */}
      <motion.div
        variants={sectionVariants(0.10)}
        initial="hidden"
        animate="visible"
        style={{ padding: "0 22px", marginBottom: 18 }}
      >
        <h1
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 30,
            fontWeight: 400,
            color: v1.inkPrimary,
            lineHeight: 1.15,
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

      {/* ── 4. Quoted caption ───────────────────────────────────────────────── */}
      {post.caption && (
        <motion.div
          variants={sectionVariants(0.14)}
          initial="hidden"
          animate="visible"
          style={{ padding: "0 30px", marginBottom: 28, textAlign: "center" }}
        >
          <span
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 24,
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
              fontSize: 17,
              color: v1.inkMid,
              lineHeight: 1.6,
            }}
          >
            {post.caption}
          </span>
          <span
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 24,
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
              fontSize: 10,
              color: "rgba(42,26,10,0.42)",
              lineHeight: 1,
            }}
          >
            ◆
          </div>
          <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
        </motion.div>
      )}

      {/* ── 6. Cartographic block — pin + tick + X ──────────────────────────── */}
      {(mallName || vendorName || boothNumber) && (
        <motion.div
          variants={sectionVariants(0.18)}
          initial="hidden"
          animate="visible"
          style={{
            display: "grid",
            gridTemplateColumns: "28px 1fr",
            columnGap: 12,
            padding: "0 28px",
            marginBottom: 30,
          }}
        >
          {/* Glyph column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 2,
            }}
          >
            {mallName && <PinGlyph size={18} />}
            {mallName && (vendorName || boothNumber) && (
              <div
                style={{
                  width: 1,
                  flex: 1,
                  minHeight: 34,
                  background: v1.inkHairline,
                  margin: "6px 0",
                }}
              />
            )}
            {(vendorName || boothNumber) && <XGlyph size={14} />}
          </div>

          {/* Content column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Mall row */}
            {mallName && (
              <div style={{ paddingTop: 0 }}>
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontSize: 17,
                    color: v1.inkPrimary,
                    lineHeight: 1.25,
                    marginBottom: 3,
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
                        fontSize: 13,
                        color: v1.inkMuted,
                        textDecoration: "underline",
                        textDecorationStyle: "dotted",
                        textDecorationColor: v1.inkFaint,
                        textUnderlineOffset: 3,
                        lineHeight: 1.5,
                      }}
                    >
                      {mallAddr}
                    </a>
                  ) : (
                    <span
                      style={{
                        fontFamily: FONT_SYS,
                        fontSize: 13,
                        color: v1.inkMuted,
                        lineHeight: 1.5,
                      }}
                    >
                      {mallAddr}
                    </span>
                  )
                )}
              </div>
            )}

            {/* Vendor row */}
            {(vendorName || boothNumber) && (
              <div>
                {vendorName && (
                  <div
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontSize: 17,
                      color: v1.inkPrimary,
                      lineHeight: 1.25,
                      marginBottom: 3,
                    }}
                  >
                    {vendorName}
                    {boothNumber && (
                      <span style={{ color: v1.inkMuted }}> — Booth {boothNumber}</span>
                    )}
                  </div>
                )}
                {vendorSlug && (
                  <Link
                    href={`/shelf/${vendorSlug}`}
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontStyle: "italic",
                      fontSize: 14,
                      color: v1.inkPrimary,
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v1.inkFaint,
                      textUnderlineOffset: 3,
                      lineHeight: 1.5,
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

      {/* ── 7. "more from this shelf…" ──────────────────────────────────────── */}
      {hasVendor && (
        <ShelfSection
          vendorId={post.vendor!.id}
          currentPostId={post.id}
          onReady={handleShelfReady}
        />
      )}

      {/* ── 8. Owner Manage block — paper-as-surface (Decision 1a, session 16) ── */}
      {isMyPost && (
        <motion.div
          variants={sectionVariants(0.28)}
          initial="hidden"
          animate="visible"
          style={{ padding: "8px 26px 28px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 10,
                color: v1.inkMuted,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
              }}
            >
              manage
            </div>
            <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
          </div>

          {!showDelete ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <button
                onClick={() => router.push(`/post/edit/${post.id}`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 4px",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkPrimary,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Pencil size={12} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
                Edit this find
              </button>

              <button
                onClick={handleToggleSold}
                disabled={actionBusy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "none",
                  border: "none",
                  cursor: actionBusy ? "default" : "pointer",
                  padding: "6px 4px",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkPrimary,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  opacity: actionBusy ? 0.5 : 1,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Tag size={12} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
                {isSold ? "Mark as on display" : "Mark as found a home"}
              </button>

              <button
                onClick={() => setShowDelete(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 4px",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 12,
                  color: v1.inkMuted,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Trash2 size={11} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
                Delete this find
              </button>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "16px 18px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontSize: 18,
                    color: v1.inkPrimary,
                    marginBottom: 8,
                  }}
                >
                  Delete this find?
                </div>
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontStyle: "italic",
                    fontSize: 13,
                    color: v1.inkMuted,
                    marginBottom: 18,
                    lineHeight: 1.55,
                  }}
                >
                  This can’t be undone. The photograph and listing will be permanently removed.
                </div>
                <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
                  <button
                    onClick={handleDelete}
                    disabled={actionBusy}
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontStyle: "italic",
                      fontSize: 14,
                      color: "#8b2020",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "6px 4px",
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
                      fontSize: 14,
                      color: v1.inkMuted,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "6px 4px",
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
