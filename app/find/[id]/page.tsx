// app/find/[id]/page.tsx

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Trash2, Facebook } from "lucide-react";
import { getPost, updatePostStatus, deletePost } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
import type { Post } from "@/types/treehouse";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  border:      "rgba(26,26,24,0.1)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenBorder: "rgba(30,77,43,0.18)",
  header:      "rgba(240,237,230,0.96)",
  red:         "#8b2020",
  redBg:       "rgba(139,32,32,0.07)",
  redBorder:   "rgba(139,32,32,0.18)",
};

function timeAgo(dateStr: string): string {
  const ms   = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPrice(price: number): string {
  return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

export default function FindDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [post,       setPost]       = useState<Post | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [isMyPost,   setIsMyPost]   = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
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

  const mapsUrl = post?.mall?.address
    ? `https://maps.apple.com/?q=${encodeURIComponent(post.mall.address)}`
    : post?.mall
    ? `https://maps.apple.com/?q=${encodeURIComponent(`${post.mall.name} ${post.mall.city} ${post.mall.state}`)}`
    : null;

  function metaLine(p: Post): string {
    const parts: string[] = [];
    if (p.price_asking != null) parts.push(`Found for ${formatPrice(p.price_asking)}`);
    parts.push(timeAgo(p.created_at));
    return parts.join(" · ");
  }

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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* ── Sticky nav ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center",
        padding: "max(14px, env(safe-area-inset-top, 14px)) 15px 10px",
        background: C.header,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button
          onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}
        >
          <ArrowLeft size={15} style={{ color: C.textMid }} />
        </button>
      </div>

      {/* ── Image ── */}
      {post.image_url && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 18px rgba(26,26,24,0.11)", background: C.surface, position: "relative" }}>
            <img
              src={post.image_url}
              alt={post.title}
              style={{
                width: "100%", height: "auto", display: "block",
                objectFit: "contain", maxHeight: "65vh",
                filter: isSold ? "grayscale(0.35) brightness(0.88)" : "none",
              }}
            />
            {isSold && (
              <div style={{
                position: "absolute", top: 12, left: 12,
                fontSize: 8, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "1.5px", padding: "3px 9px", borderRadius: 5,
                background: "rgba(240,237,230,0.92)", color: C.textMuted,
                border: `1px solid ${C.border}`,
              }}>
                Found a home
              </div>
            )}
            <button
              onClick={handleShare}
              style={{
                position: "absolute", bottom: 12, right: 12,
                width: 34, height: 34, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.36)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                border: "none", cursor: "pointer",
              }}
            >
              <Share2 size={13} style={{ color: copied ? "#a8d5b5" : "rgba(255,255,255,0.9)" }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: "24px 20px 0" }}>

        {/* 1 — Title */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: 26, fontWeight: 700,
            color: C.textPrimary,
            lineHeight: 1.22, letterSpacing: "-0.4px",
            margin: "0 0 8px",
          }}>
            {post.title}
          </h1>
        </motion.div>

        {/* 2 — Metadata: "Found for $35 · 29m ago" */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.06 }}>
          <p style={{
            fontSize: 12, color: C.textFaint,
            fontFamily: "monospace", letterSpacing: "0.1px",
            margin: "0 0 22px",
          }}>
            {metaLine(post)}
          </p>
        </motion.div>

        {/* 3 — Caption + description */}
        {(post.caption || post.description) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.1 }} style={{ marginBottom: 16 }}>
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
              <p style={{
                fontSize: 13, color: C.textMuted,
                lineHeight: 1.78, margin: 0,
              }}>
                {post.description}
              </p>
            )}
          </motion.div>
        )}

        {/* 4 — Mark the Spot — below caption, slightly larger, always visible */}
        {post.vendor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.13 }} style={{ marginBottom: 28 }}>
            {isMyPost ? (
              <button
                onClick={handleToggleSold}
                disabled={actionBusy}
                style={{
                  padding: "8px 18px", borderRadius: 20,
                  fontSize: 13, fontWeight: 500,
                  color: isSold ? C.green : C.textMuted,
                  background: isSold ? "rgba(30,77,43,0.07)" : C.surface,
                  border: `1px solid ${isSold ? C.greenBorder : C.border}`,
                  cursor: "pointer",
                  opacity: actionBusy ? 0.5 : 1,
                  letterSpacing: "0.1px",
                }}
              >
                {isSold ? "Mark available" : "Mark the Spot"}
              </button>
            ) : (
              <button
                disabled
                style={{
                  padding: "8px 18px", borderRadius: 20,
                  fontSize: 13, fontWeight: 500,
                  color: C.textFaint,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  cursor: "default",
                  letterSpacing: "0.1px",
                  opacity: 0.7,
                }}
              >
                Mark the Spot
              </button>
            )}
          </motion.div>
        )}

        {/* ── Hairline divider ── */}
        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

        {/* 5 — Location: mall name plain, address is the map link */}
        {post.mall && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 500, marginBottom: 6 }}>
              Location
            </div>
            {/* Mall name — plain text, no link */}
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
              {post.mall.name}
            </div>
            {/* Address — tappable map link if available, else city/state fallback */}
            {post.mall.address ? (
              mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12, color: C.green,
                    textDecoration: "none",
                    borderBottom: `1px solid ${C.greenBorder}`,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  {post.mall.address}
                </a>
              ) : (
                <div style={{ fontSize: 12, color: C.textMuted }}>{post.mall.address}</div>
              )
            ) : (
              // No full address — fall back to city/state with map link
              mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: C.green, textDecoration: "none", borderBottom: `1px solid ${C.greenBorder}` }}
                >
                  {post.mall.city}{post.mall.state ? `, ${post.mall.state}` : ""}
                </a>
              ) : (
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {post.mall.city}{post.mall.state ? `, ${post.mall.state}` : ""}
                </div>
              )
            )}
          </motion.div>
        )}

        {/* ── Hairline divider ── */}
        {post.vendor && <div style={{ height: 1, background: C.border, marginBottom: 22 }} />}

        {/* 6 — Vendor · Booth row */}
        {post.vendor && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.19 }} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center" }}>

              {/* Vendor name — left */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 500, marginBottom: 3 }}>Vendor</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: C.textPrimary, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.vendor.display_name}
                </div>
                {post.vendor.facebook_url && (
                  <a href={post.vendor.facebook_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 11, color: "#1877f2", textDecoration: "none" }}>
                    <Facebook size={11} />
                    Facebook
                  </a>
                )}
              </div>

              {/* Booth — right */}
              {post.vendor.booth_number && (
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 500, marginBottom: 3 }}>Booth</div>
                  <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 500, color: C.textMid }}>
                    {post.vendor.booth_number}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* ── Owner-only: delete ── */}
        {isMyPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.22 }} style={{ marginBottom: 28 }}>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: C.redBg, border: `1px solid ${C.redBorder}`, cursor: "pointer" }}
              >
                <Trash2 size={13} style={{ color: C.red }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.red }}>Delete post</span>
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

        {/* ── Soft bottom: "Keep exploring →" ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.28 }}
          style={{
            paddingTop: 12,
            paddingBottom: "max(52px, env(safe-area-inset-bottom, 52px))",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ height: 1, background: C.border, position: "absolute", left: 0, right: 0, top: 12 }} />
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: C.textMuted,
              fontFamily: "Georgia, serif", fontStyle: "italic",
              letterSpacing: "0.2px",
              padding: "20px 0",
              display: "flex", alignItems: "center", gap: 6,
              position: "relative",
            }}
          >
            Keep exploring
            <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}
