// app/find/[id]/page.tsx

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Trash2, Facebook, Bookmark, BookmarkCheck } from "lucide-react";
import { getPost, getVendorPosts, updatePostStatus, deletePost } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import { safeStorage } from "@/lib/safeStorage";
import type { Post } from "@/types/treehouse";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  surfaceDeep: "#dedad0",
  border:      "rgba(26,26,24,0.1)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.09)",
  greenSolid:  "rgba(30,77,43,0.92)",
  greenBorder: "rgba(30,77,43,0.22)",
  header:      "rgba(240,237,230,0.96)",
  red:         "#8b2020",
  redBg:       "rgba(139,32,32,0.07)",
  redBorder:   "rgba(139,32,32,0.18)",
};

function bookmarkKey(postId: string) {
  return `treehouse_bookmark_${postId}`;
}

// ─── Shelf card ───────────────────────────────────────────────────────────────

function ShelfCard({ post }: { post: Post }) {
  const [imgErr, setImgErr] = useState(false);
  const isSold = post.status === "sold";
  const hasImg = !!post.image_url && !imgErr;

  return (
    <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none", flexShrink: 0, width: "42vw", maxWidth: 170 }}>
      <div style={{
        borderRadius: 13,
        overflow: "hidden",
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 5px rgba(26,26,24,0.06)",
        position: "relative",
        opacity: isSold ? 0.62 : 1,
        transition: "opacity 0.2s",
      }}>
        {hasImg ? (
          <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden" }}>
            <img
              src={post.image_url!}
              alt={post.title}
              loading="lazy"
              onError={() => setImgErr(true)}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", display: "block",
                filter: isSold ? "grayscale(0.5) brightness(0.88)" : "brightness(0.97) saturate(0.93)",
              }}
            />
            {isSold && (
              <div style={{
                position: "absolute", top: 6, left: 6,
                fontSize: 6, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "1.3px", padding: "2px 6px", borderRadius: 4,
                background: "rgba(240,237,230,0.92)", color: C.textMuted,
                border: `1px solid ${C.border}`,
                backdropFilter: "blur(4px)",
              }}>
                Found a home
              </div>
            )}
          </div>
        ) : (
          <div style={{ aspectRatio: "3/4", padding: "12px 10px", display: "flex", alignItems: "flex-end", background: C.surface }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontWeight: 600, color: C.textMid, lineHeight: 1.3 }}>
              {post.title}
            </div>
          </div>
        )}
      </div>
      <div style={{
        marginTop: 6, paddingLeft: 2,
        fontSize: 10, color: C.textMuted, lineHeight: 1.4,
        overflow: "hidden", textOverflow: "ellipsis",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
      }}>
        {post.title}
      </div>
    </Link>
  );
}

// ─── Shelf section ────────────────────────────────────────────────────────────

function ShelfSection({ vendorId, currentPostId, onReady }: {
  vendorId: string;
  currentPostId: string;
  onReady: (hasItems: boolean) => void;
}) {
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.18 }}
      style={{ marginBottom: 32 }}
    >
      <div style={{
        paddingLeft: 20, paddingRight: 20,
        marginBottom: 12,
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2.2px", fontWeight: 500 }}>
          View the shelf
        </div>
        <div style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </div>
      </div>
      <div
        style={{
          display: "flex", gap: 10,
          overflowX: "auto", overflowY: "hidden",
          paddingLeft: 20, paddingRight: 20, paddingBottom: 4,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
        className="hide-scrollbar"
      >
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FindDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [post,          setPost]          = useState<Post | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [copied,        setCopied]        = useState(false);
  const [isMyPost,      setIsMyPost]      = useState(false);
  const [actionBusy,    setActionBusy]    = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [shelfHasItems, setShelfHasItems] = useState(false);
  const [isBookmarked,  setIsBookmarked]  = useState(false);

  useEffect(() => {
    if (!id) return;
    // Restore bookmark state from storage
    try {
      setIsBookmarked(safeStorage.getItem(bookmarkKey(id)) === "1");
    } catch {}

    getPost(id).then(data => {
      setPost(data);
      setLoading(false);
      try {
        const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
        if (raw && data) {
          const profile = JSON.parse(raw) as LocalVendorProfile;
          setIsMyPost(!!profile.vendor_id && profile.vendor_id === data.vendor_id);
        }
      } catch {}
    });
  }, [id]);

  function handleBookmark() {
    if (!id) return;
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      if (next) {
        safeStorage.setItem(bookmarkKey(id), "1");
      } else {
        safeStorage.removeItem(bookmarkKey(id));
      }
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
    else setActionBusy(false);
  }

  const handleShelfReady = useCallback((hasItems: boolean) => {
    setShelfHasItems(hasItems);
  }, []);

  const mapsUrl = post?.mall?.address
    ? `https://maps.apple.com/?q=${encodeURIComponent(post.mall.address)}`
    : post?.mall
    ? `https://maps.apple.com/?q=${encodeURIComponent(`${post.mall.name} ${post.mall.city} ${post.mall.state}`)}`
    : null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textFaint, fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.textPrimary }}>This find has moved on.</div>
        <button onClick={() => router.push("/")} style={{ fontSize: 13, color: C.green, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Browse the feed</button>
      </div>
    );
  }

  const isSold = post.status === "sold";
  const hasVendor = !!post.vendor;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* ── 1. Hero image ── */}
      <div style={{ position: "relative", width: "100%" }}>
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            style={{
              width: "100%", height: "auto", display: "block",
              objectFit: "contain",
              filter: isSold ? "grayscale(0.35) brightness(0.88)" : "none",
            }}
          />
        ) : (
          <div style={{ height: 120, background: C.surface }} />
        )}

        {/* Sold badge — top-left offset from back button */}
        {isSold && (
          <div style={{
            position: "absolute", top: "max(18px, env(safe-area-inset-top, 18px))", left: 60,
            fontSize: 8, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "1.5px", padding: "3px 9px", borderRadius: 5,
            background: "rgba(240,237,230,0.92)", color: C.textMuted,
            border: `1px solid ${C.border}`,
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }}>
            Found a home
          </div>
        )}

        {/* Bookmarked badge — bottom-left, only for visitors who bookmarked */}
        <AnimatePresence>
          {isBookmarked && !isMyPost && (
            <motion.div
              key="bookmark-badge"
              initial={{ opacity: 0, scale: 0.88, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 4 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                position: "absolute",
                bottom: 12,
                left: 14,
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px 4px 7px",
                borderRadius: 20,
                background: C.greenSolid,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                pointerEvents: "none",
              }}
            >
              <BookmarkCheck size={11} style={{ color: "rgba(255,255,255,0.95)", flexShrink: 0 }} />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "0.3px",
                fontFamily: "system-ui, sans-serif",
              }}>
                Bookmarked
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating back button */}
        <button
          onClick={() => router.back()}
          style={{
            position: "absolute",
            top: "max(14px, env(safe-area-inset-top, 14px))",
            left: 14,
            width: 36, height: 36, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(240,237,230,0.82)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 6px rgba(26,26,24,0.12)",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} style={{ color: C.textMid }} />
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            position: "absolute", bottom: 12, right: 14,
            width: 34, height: 34, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.32)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            border: "none", cursor: "pointer",
          }}
        >
          <Share2 size={13} style={{ color: copied ? "#a8d5b5" : "rgba(255,255,255,0.9)" }} />
        </button>
      </div>

      {/* ── 2. Title + availability ── */}
      <div style={{ padding: "20px 20px 0" }}>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: 26, fontWeight: 700,
            color: C.textPrimary,
            lineHeight: 1.22, letterSpacing: "-0.4px",
            margin: "0 0 6px",
          }}>
            {post.title}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}
        >
          {!isSold && (
            <motion.div
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }}
            />
          )}
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: isSold ? C.textMuted : C.green,
            letterSpacing: "0.1px",
          }}>
            {isSold ? "Found a home" : "Available"}
          </span>
        </motion.div>

        {/* Caption + description */}
        {(post.caption || post.description) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.1 }} style={{ marginBottom: 32 }}>
            {post.caption && (
              <p style={{
                fontSize: 15, color: C.textMid,
                lineHeight: 1.82,
                fontStyle: "italic", fontFamily: "Georgia, serif",
                margin: "0 0 10px",
              }}>
                {post.caption}
              </p>
            )}
            {post.description && (
              <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.78, margin: 0 }}>
                {post.description}
              </p>
            )}
          </motion.div>
        )}

      </div>

      {/* ── "View the shelf" ── */}
      {hasVendor && (
        <>
          {shelfHasItems && (
            <div style={{ height: 1, background: C.border, margin: "0 0 24px" }} />
          )}
          <ShelfSection
            vendorId={post.vendor!.id}
            currentPostId={post.id}
            onReady={handleShelfReady}
          />
        </>
      )}

      {/* ── "Find this here" ── */}
      {(post.mall || post.vendor) && (
        <div style={{ padding: "0 20px", marginBottom: 28 }}>

          <div style={{
            fontSize: 9, color: C.textFaint,
            textTransform: "uppercase", letterSpacing: "2.2px", fontWeight: 500,
            marginBottom: 8,
          }}>
            Find this here
          </div>

          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.16 }}
            style={{
              background: C.surface,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {/* Mall row */}
            {post.mall && (
              <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500, paddingTop: 2, flexShrink: 0, width: 48 }}>
                  Mall
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3, marginBottom: 2 }}>
                    {post.mall.name}
                  </div>
                  {post.mall.address ? (
                    mapsUrl ? (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: C.green, textDecoration: "none", borderBottom: `1px solid rgba(30,77,43,0.18)` }}>
                        {post.mall.address}
                      </a>
                    ) : (
                      <div style={{ fontSize: 11, color: C.textMuted }}>{post.mall.address}</div>
                    )
                  ) : mapsUrl ? (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: C.green, textDecoration: "none", borderBottom: `1px solid rgba(30,77,43,0.18)` }}>
                      {post.mall.city}{post.mall.state ? `, ${post.mall.state}` : ""}
                    </a>
                  ) : (
                    <div style={{ fontSize: 11, color: C.textMuted }}>
                      {post.mall.city}{post.mall.state ? `, ${post.mall.state}` : ""}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            {post.mall && post.vendor && (
              <div style={{ height: 1, background: C.border, margin: "0 14px" }} />
            )}

            {/* Vendor row — name + booth pill inline */}
            {post.vendor && (
              <div style={{ padding: "10px 14px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500, paddingTop: 2, flexShrink: 0, width: 48 }}>
                  Vendor
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
                    <div style={{ fontSize: 13, fontWeight: 400, color: C.textMid, lineHeight: 1.3 }}>
                      {post.vendor.display_name}
                    </div>
                    {post.vendor.booth_number && (
                      <div style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: C.surfaceDeep,
                        border: `1px solid ${C.border}`,
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: 500,
                        color: C.textMid,
                        letterSpacing: "0.3px",
                        flexShrink: 0,
                      }}>
                        {post.vendor.booth_number}
                      </div>
                    )}
                  </div>
                  {post.vendor.facebook_url && (
                    <a href={post.vendor.facebook_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 10, color: "#1877f2", textDecoration: "none", opacity: 0.8 }}>
                      <Facebook size={9} />
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Visitor: Bookmark Booth toggle | Owner: Mark the Spot toggle ── */}
            {post.vendor && (
              <div style={{ padding: "12px 14px 14px" }}>
                {isMyPost ? (
                  /* Owner — mark sold/available, unchanged */
                  <button
                    onClick={handleToggleSold}
                    disabled={actionBusy}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      color: isSold ? C.green : C.textMid,
                      background: isSold ? C.greenLight : C.surfaceDeep,
                      border: `1px solid ${isSold ? C.greenBorder : C.border}`,
                      cursor: "pointer",
                      opacity: actionBusy ? 0.5 : 1,
                      letterSpacing: "0.1px",
                    }}
                  >
                    <Bookmark size={14} style={{ color: isSold ? C.green : C.textMid }} />
                    {isSold ? "Mark available" : "Mark the Spot"}
                  </button>
                ) : (
                  /* Visitor — local bookmark toggle only, no DB write */
                  <button
                    onClick={handleBookmark}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      color: isBookmarked ? "rgba(255,255,255,0.97)" : C.green,
                      background: isBookmarked ? C.greenSolid : C.greenLight,
                      border: `1px solid ${isBookmarked ? "transparent" : C.greenBorder}`,
                      cursor: "pointer",
                      letterSpacing: "0.1px",
                      transition: "background 0.18s, color 0.18s, border-color 0.18s",
                    }}
                  >
                    {isBookmarked
                      ? <BookmarkCheck size={14} style={{ color: "rgba(255,255,255,0.97)" }} />
                      : <Bookmark size={14} style={{ color: C.green }} />
                    }
                    {isBookmarked ? "Booth Bookmarked" : "Bookmark Booth"}
                  </button>
                )}
              </div>
            )}

          </motion.div>
        </div>
      )}

      {/* ── Delete — bottom, ghost style ── */}
      {isMyPost && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          style={{
            padding: "0 20px",
            paddingBottom: "max(36px, env(safe-area-inset-bottom, 36px))",
            marginTop: 8,
          }}
        >
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                padding: "6px 0",
              }}
            >
              <Trash2 size={11} style={{ color: C.textFaint }} />
              <span style={{ fontSize: 11, color: C.textFaint }}>Delete post</span>
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                style={{ padding: "14px", borderRadius: 12, background: C.redBg, border: `1px solid ${C.redBorder}` }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 4 }}>Delete this post?</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                  This can't be undone. The image and listing will be permanently removed.
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
        </motion.div>
      )}

      {!isMyPost && (
        <div style={{ paddingBottom: "max(36px, env(safe-area-inset-bottom, 36px))" }} />
      )}

    </div>
  );
}
