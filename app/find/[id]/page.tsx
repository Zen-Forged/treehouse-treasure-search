// app/find/[id]/page.tsx

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Facebook, Tag, ArrowLeft, Heart } from "lucide-react";
import { getPost, getVendorPosts, updatePostStatus, deletePost } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { safeStorage } from "@/lib/safeStorage";
import { getMode } from "@/lib/mode";
import { getCachedUserId } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "#f5f2eb",
  surface:     "#edeae1",
  surfaceDeep: "#e4e0d6",
  border:      "rgba(26,24,16,0.09)",
  textPrimary: "#1c1a14",
  textMid:     "#4a4840",
  textMuted:   "#8a8476",
  textFaint:   "#b4ae9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.09)",
  greenSolid:  "rgba(30,77,43,0.90)",
  greenBorder: "rgba(30,77,43,0.22)",
  header:      "rgba(245,242,235,0.96)",
  red:         "#8b2020",
  redBg:       "rgba(139,32,32,0.07)",
  redBorder:   "rgba(139,32,32,0.18)",
  tag:         "#faf8f2",
  tagBorder:   "#ccc6b4",
};

function flagKey(postId: string) {
  return `treehouse_bookmark_${postId}`;
}

// ─── Booth location box ────────────────────────────────────────────────────────

function BoothBox({ boothNumber }: { boothNumber: string }) {
  return (
    <div style={{
      position: "absolute", bottom: -22, left: 20,
      background: C.tag, border: `1.5px solid ${C.tagBorder}`,
      borderRadius: 8, padding: "6px 14px 7px",
      boxShadow: "0 2px 8px rgba(26,24,16,0.10), 0 1px 3px rgba(26,24,16,0.06)",
    }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 8, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "1.8px", color: C.textMuted, lineHeight: 1, marginBottom: 4 }}>
        Found In-Booth
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: C.textPrimary, letterSpacing: "0.2px", lineHeight: 1 }}>
        {boothNumber}
      </div>
    </div>
  );
}

// ─── Shelf card ────────────────────────────────────────────────────────────────

function ShelfCard({ post }: { post: Post }) {
  const [imgErr, setImgErr] = useState(false);
  const isSold = post.status === "sold";
  const hasImg = !!post.image_url && !imgErr;

  return (
    <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none", flexShrink: 0, width: "42vw", maxWidth: 170 }}>
      <div style={{ borderRadius: 14, overflow: "hidden", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(26,24,16,0.06)", position: "relative", opacity: isSold ? 0.62 : 1, transition: "opacity 0.2s" }}>
        {hasImg ? (
          <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden" }}>
            <img src={post.image_url!} alt={post.title} loading="lazy" onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: isSold ? "grayscale(0.5) brightness(0.88)" : "brightness(0.99) saturate(0.96)" }} />
            {isSold && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.3px",
                padding: "2px 7px", borderRadius: 4,
                background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.93)",
                backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                whiteSpace: "nowrap",
              }}>
                Found
              </div>
            )}
          </div>
        ) : (
          <div style={{ aspectRatio: "3/4", padding: "12px 10px", display: "flex", alignItems: "flex-end", background: C.surface }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontWeight: 600, color: C.textMid, lineHeight: 1.3 }}>{post.title}</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 6, paddingLeft: 2, fontFamily: "Georgia, serif", fontSize: 10, color: C.textMuted, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
        {post.title}
      </div>
    </Link>
  );
}

// ─── Shelf section ─────────────────────────────────────────────────────────────

function ShelfSection({ vendorId, currentPostId, onReady }: { vendorId: string; currentPostId: string; onReady: (hasItems: boolean) => void }) {
  const [items, setItems] = useState<Post[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getVendorPosts(vendorId, 12).then(posts => {
      const filtered = posts.filter(p => p.id !== currentPostId);
      setItems(filtered);
      setReady(true);
      onReady(filtered.length > 0);
    });
  }, [vendorId, currentPostId, onReady]);

  if (!ready || items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }} style={{ marginBottom: 32 }}>
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 12, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2.2px", fontWeight: 500 }}>View the shelf</div>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: C.textFaint }}>{items.length} {items.length === 1 ? "item" : "items"}</div>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", overflowY: "hidden", paddingLeft: 20, paddingRight: 20, paddingBottom: 4, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }} className="hide-scrollbar">
        {items.map(item => (
          <div key={item.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
            <ShelfCard post={item} />
          </div>
        ))}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
    </motion.div>
  );
}

// ─── Owner detection ───────────────────────────────────────────────────────────

function detectOwnership(post: Post): boolean {
  try {
    const sessionUid = getCachedUserId();
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FindDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [post,          setPost]          = useState<Post | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [copied,        setCopied]        = useState(false);
  const [isMyPost,      setIsMyPost]      = useState(false);
  const [isCurator,     setIsCurator]     = useState(false);
  const [actionBusy,    setActionBusy]    = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [shelfHasItems, setShelfHasItems] = useState(false);
  const [isSaved,       setIsSaved]       = useState(false);

  useEffect(() => {
    setIsCurator(getMode() === "curator");
    if (!id) return;
    try { setIsSaved(safeStorage.getItem(flagKey(id)) === "1"); } catch {}
    getPost(id).then(data => {
      setPost(data);
      setLoading(false);
      if (data) setIsMyPost(detectOwnership(data));
    });
  }, [id]);

  // Unified save/unsave toggle — used by both the image icon and the CTA button
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
      try { await navigator.share({ title: post?.title ?? "A Treehouse find", text: post?.caption ?? "", url }); } catch {}
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
    if (ok) setPost(p => p ? { ...p, status: next } : p);
    setActionBusy(false);
  }

  async function handleDelete() {
    if (!post || actionBusy) return;
    setActionBusy(true);
    const ok = await deletePost(post.id);
    if (ok) router.replace("/");
    else    setActionBusy(false);
  }

  const handleShelfReady = useCallback((hasItems: boolean) => { setShelfHasItems(hasItems); }, []);

  const showOwnerControls = isMyPost && isCurator;

  const mapsUrl = post?.mall?.address
    ? `https://maps.apple.com/?q=${encodeURIComponent(post.mall.address)}`
    : post?.mall
    ? `https://maps.apple.com/?q=${encodeURIComponent(`${post.mall.name} ${post.mall.city} ${post.mall.state}`)}`
    : null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: C.textFaint, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.textPrimary }}>This find has moved on.</div>
        <button onClick={() => router.push("/")} style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.green, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Browse the feed</button>
      </div>
    );
  }

  const isSold      = post.status === "sold";
  const hasVendor   = !!post.vendor;
  const boothNumber = post.vendor?.booth_number ?? null;
  const hasBoothBox = !!boothNumber;
  const hasContent  = !!(post.caption || post.description);
  const hasPrice    = post.price_asking != null && !isSold;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* ── 1. Hero image ── */}
      <div style={{ position: "relative", width: "100%", marginBottom: hasBoothBox ? 34 : 0 }}>
        {post.image_url ? (
          <img src={post.image_url} alt={post.title}
            style={{ width: "100%", height: "auto", display: "block", objectFit: "contain", filter: isSold ? "grayscale(0.35) brightness(0.88)" : "none" }} />
        ) : (
          <div style={{ height: 120, background: C.surface }} />
        )}

        {isSold && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.6px",
            padding: "5px 12px", borderRadius: 6,
            background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.95)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
          }}>
            Found
          </div>
        )}

        {/* Back button — top-left */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            position: "absolute",
            top: "max(14px, env(safe-area-inset-top, 14px))",
            left: 14,
            width: 36, height: 36, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(240,237,230,0.82)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(26,24,16,0.10)",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(26,24,16,0.12)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <ArrowLeft size={15} style={{ color: C.textMid }} />
        </button>

        {/* Share + Heart — bottom-right of image */}
        <div style={{ position: "absolute", bottom: 12, right: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {/* Heart / Save icon */}
          <button
            onClick={handleToggleSave}
            aria-label={isSaved ? "Remove from My Finds" : "Save"}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isSaved ? C.greenSolid : "rgba(0,0,0,0.30)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: "none", cursor: "pointer",
              transition: "background 0.18s",
              boxShadow: isSaved ? "0 2px 8px rgba(30,77,43,0.40)" : "0 1px 5px rgba(0,0,0,0.20)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Heart
              size={15}
              strokeWidth={isSaved ? 0 : 1.8}
              style={{
                color: "rgba(255,255,255,0.95)",
                fill: isSaved ? "rgba(255,255,255,0.95)" : "none",
              }}
            />
          </button>

          {/* Share / paper airplane */}
          <button onClick={handleShare}
            style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            <Send size={14} style={{ color: copied ? "#a8d5b5" : "rgba(255,255,255,0.92)" }} />
          </button>
        </div>

        {hasBoothBox && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
            <BoothBox boothNumber={boothNumber!} />
          </motion.div>
        )}
      </div>

      {/* ── 2. Title + availability + price ── */}
      <div style={{ padding: "22px 20px 0" }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.textPrimary, lineHeight: 1.22, letterSpacing: "-0.5px", margin: "0 0 10px" }}>
            {post.title}
          </h1>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.06 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          {/* Availability */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isSold && (
              <motion.div animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 500, color: isSold ? C.textMuted : C.green, letterSpacing: "0.1px" }}>
              {isSold ? "Found a home" : "Available"}
            </span>
          </div>
          {/* Price — right-aligned, only when available */}
          {hasPrice && (
            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.3px" }}>
              ${post.price_asking!.toLocaleString()}
            </div>
          )}
        </motion.div>

        {hasContent && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.1 }} style={{ marginBottom: 24 }}>
            {post.caption && (
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.textMid, lineHeight: 1.85, margin: "0 0 10px" }}>
                {post.caption}
              </p>
            )}
            {post.description && (
              <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8, margin: 0 }}>
                {post.description}
              </p>
            )}
          </motion.div>
        )}

        {/* ── Save CTA button — visible to ALL users ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <button
            onClick={handleToggleSave}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 28,
              fontSize: 13, fontWeight: 600,
              fontFamily: "Georgia, serif",
              color: isSaved ? "rgba(255,255,255,0.97)" : C.green,
              background: isSaved ? C.greenSolid : C.greenLight,
              border: `1px solid ${isSaved ? "transparent" : C.greenBorder}`,
              cursor: "pointer",
              transition: "background 0.18s, color 0.18s",
              boxShadow: isSaved ? "0 2px 12px rgba(30,77,43,0.25)" : "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Heart
              size={15}
              strokeWidth={isSaved ? 0 : 1.8}
              style={{
                color: isSaved ? "rgba(255,255,255,0.97)" : C.green,
                fill: isSaved ? "rgba(255,255,255,0.97)" : "none",
              }}
            />
            {isSaved ? "Saved" : "Save"}
          </button>
        </motion.div>
      </div>

      {/* ── View the shelf ── */}
      {hasVendor && (
        <>
          {shelfHasItems && <div style={{ height: 1, background: C.border, margin: "0 0 24px" }} />}
          <ShelfSection vendorId={post.vendor!.id} currentPostId={post.id} onReady={handleShelfReady} />
        </>
      )}

      {/* ── Find this here ── */}
      {(post.mall || post.vendor) && (
        <div style={{ padding: "0 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2.2px", fontWeight: 500, marginBottom: 10 }}>
            Find this here
          </div>
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }}
            style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 10px rgba(26,24,16,0.06)" }}>

            {post.mall && (
              <div style={{ padding: "14px 16px 11px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500, paddingTop: 2, flexShrink: 0, width: 48 }}>Mall</div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.25, marginBottom: 3 }}>{post.mall.name}</div>
                  {post.mall.address ? (
                    mapsUrl
                      ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.green, textDecoration: "none", borderBottom: `1px solid rgba(30,77,43,0.20)` }}>{post.mall.address}</a>
                      : <div style={{ fontSize: 11, color: C.textMuted }}>{post.mall.address}</div>
                  ) : mapsUrl
                    ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.green, textDecoration: "none", borderBottom: `1px solid rgba(30,77,43,0.20)` }}>{post.mall.city}{post.mall.state ? `, ${post.mall.state}` : ""}</a>
                    : <div style={{ fontSize: 11, color: C.textMuted }}>{post.mall.city}{post.mall.state ? `, ${post.mall.state}` : ""}</div>
                  }
                </div>
              </div>
            )}

            {post.mall && post.vendor && <div style={{ height: 1, background: C.border, margin: "0 16px" }} />}

            {post.vendor && (
              <div style={{ padding: "11px 16px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500, paddingTop: 2, flexShrink: 0, width: 48 }}>Vendor</div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textMid, lineHeight: 1.3 }}>{post.vendor.display_name}</div>
                    {post.vendor.booth_number && (
                      <div style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, background: C.surfaceDeep, border: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: C.textMid, letterSpacing: "0.3px", flexShrink: 0 }}>
                        {post.vendor.booth_number}
                      </div>
                    )}
                  </div>
                  {post.vendor.facebook_url && (
                    <a href={post.vendor.facebook_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 10, color: "#1877f2", textDecoration: "none", opacity: 0.82 }}>
                      <Facebook size={9} />
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Owner controls — Curator mode + ownership only */}
            {showOwnerControls && (
              <div style={{ padding: "12px 16px 14px", borderTop: `1px solid ${C.border}` }}>
                <button onClick={handleToggleSold} disabled={actionBusy}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: actionBusy ? "default" : "pointer", padding: "4px 0", marginBottom: 10, opacity: actionBusy ? 0.5 : 1, WebkitTapHighlightColor: "transparent" }}>
                  <Tag size={11} style={{ color: isSold ? C.green : C.textFaint }} />
                  <span style={{ fontSize: 11, color: isSold ? C.green : C.textMuted, fontWeight: isSold ? 600 : 400 }}>
                    {isSold ? "Mark as available" : "Mark as sold"}
                  </span>
                </button>

                {!showDelete ? (
                  <button onClick={() => setShowDelete(true)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0", WebkitTapHighlightColor: "transparent" }}>
                    <Trash2 size={11} style={{ color: C.textFaint }} />
                    <span style={{ fontSize: 11, color: C.textFaint }}>Delete post</span>
                  </button>
                ) : (
                  <AnimatePresence>
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                      style={{ padding: "13px", borderRadius: 11, background: C.redBg, border: `1px solid ${C.redBorder}` }}>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 4 }}>Delete this post?</div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 13, lineHeight: 1.65 }}>
                        This can&apos;t be undone. The image and listing will be permanently removed.
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={handleDelete} disabled={actionBusy}
                          style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#fff", background: C.red, border: "none", cursor: "pointer", opacity: actionBusy ? 0.6 : 1 }}>
                          {actionBusy ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button onClick={() => setShowDelete(false)}
                          style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 13, color: C.textMid, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      <div style={{ paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }} />
      <BottomNav active={null} />

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
