// app/find/[id]/page.tsx

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink, Share2, Facebook, Trash2, CheckCircle, Circle } from "lucide-react";
import { getPost, updatePostStatus, deletePost } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";
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
      // Check ownership via localStorage vendor profile
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

  function handleFacebookShare() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
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

      {/* ── Nav bar (sticky, above image) ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(14px, env(safe-area-inset-top, 14px)) 15px 10px", background: C.header, backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
          <ArrowLeft size={15} style={{ color: C.textMid }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleFacebookShare} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
            <Facebook size={15} style={{ color: "#1877f2" }} />
          </button>
          <button onClick={handleShare} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
            <Share2 size={14} style={{ color: copied ? C.green : C.textMuted }} />
          </button>
        </div>
      </div>

      {/* ── Full image — contain, no crop ── */}
      {post.image_url && (
        <div style={{ width: "100%", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <img
            src={post.image_url}
            alt={post.title}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "contain",
              maxHeight: "70vh",
              filter: isSold ? "grayscale(0.35) brightness(0.88)" : "none",
            }}
          />
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: "18px 18px", paddingBottom: "max(120px, env(safe-area-inset-bottom, 120px))" }}>

        {isSold && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: 12 }}>
            <span style={{ display: "inline-block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 10px", borderRadius: 5, color: C.textMuted, background: C.surface, border: `1px solid ${C.border}` }}>
              Found a home
            </span>
          </motion.div>
        )}

        {/* Title + price */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2, letterSpacing: "-0.4px", margin: "0 0 7px" }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            {post.price_asking != null && (
              <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
                ${post.price_asking % 1 === 0 ? post.price_asking.toFixed(0) : post.price_asking.toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: 10, color: C.textFaint, fontFamily: "monospace" }}>{timeAgo(post.created_at)}</span>
          </div>
        </motion.div>

        {/* Caption */}
        {post.caption && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} style={{ marginBottom: 20 }}>
            <div style={{ width: 26, height: 1, background: C.green, opacity: 0.25, marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.72, margin: 0, fontStyle: "italic", fontFamily: "Georgia, serif" }}>{post.caption}</p>
          </motion.div>
        )}

        {post.description && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.68, margin: 0 }}>{post.description}</p>
          </motion.div>
        )}

        <div style={{ height: 1, background: C.border, marginBottom: 18 }} />

        {/* Vendor + mall card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}
          style={{ borderRadius: 14, padding: "14px 15px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: 14 }}
        >
          {post.vendor && (
            <div style={{ marginBottom: post.mall ? 13 : 0 }}>
              <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Vendor</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.textPrimary, fontWeight: 600 }}>{post.vendor.display_name}</div>
              {post.vendor.booth_number && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Booth {post.vendor.booth_number}</div>}
              {post.vendor.facebook_url && (
                <a href={post.vendor.facebook_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 7, fontSize: 11, color: "#1877f2", textDecoration: "none", fontWeight: 500 }}>
                  <Facebook size={12} />
                  Facebook page
                </a>
              )}
            </div>
          )}
          {post.vendor && post.mall && <div style={{ height: 1, background: C.border, marginBottom: 13 }} />}
          {post.mall && (
            <div>
              <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Location</div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.textPrimary, fontWeight: 600, marginBottom: 3 }}>{post.mall.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={9} style={{ color: C.textMuted, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.textMuted }}>{post.mall.city}, {post.mall.state}</span>
                  </div>
                  {post.mall.address && <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2, paddingLeft: 13 }}>{post.mall.address}</div>}
                </div>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 11px", borderRadius: 8, flexShrink: 0, background: C.bg, border: `1px solid ${C.border}`, color: C.green, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                    <ExternalLink size={10} />Directions
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Vendor actions (own post only) ── */}
        {isMyPost && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 2 }}>Manage this post</div>

            {/* Mark sold / available toggle */}
            <button
              onClick={handleToggleSold}
              disabled={actionBusy}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: isSold ? C.bg : "rgba(30,77,43,0.07)", border: `1px solid ${isSold ? C.border : C.greenBorder}`, cursor: "pointer", textAlign: "left", opacity: actionBusy ? 0.6 : 1 }}
            >
              {isSold
                ? <Circle size={16} style={{ color: C.green, flexShrink: 0 }} />
                : <CheckCircle size={16} style={{ color: C.green, flexShrink: 0 }} />
              }
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                  {isSold ? "Mark as available" : "Mark as sold"}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                  {isSold ? "Puts it back in the feed" : "Removes it from the discovery feed"}
                </div>
              </div>
            </button>

            {/* Delete */}
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: C.redBg, border: `1px solid ${C.redBorder}`, cursor: "pointer", textAlign: "left" }}
              >
                <Trash2 size={15} style={{ color: C.red, flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.red }}>Delete post</div>
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ padding: "14px", borderRadius: 12, background: C.redBg, border: `1px solid ${C.redBorder}` }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 4 }}>Delete this post?</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>This can't be undone. The image and listing will be permanently removed.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleDelete}
                      disabled={actionBusy}
                      style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#fff", background: C.red, border: "none", cursor: "pointer", opacity: actionBusy ? 0.6 : 1 }}
                    >
                      {actionBusy ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button
                      onClick={() => setShowDelete(false)}
                      style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 13, color: C.textMid, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Fixed CTA (non-owner only) ── */}
      {!isMyPost && (
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}
          style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", padding: "10px 15px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))", background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: `1px solid ${C.border}`, zIndex: 50 }}
        >
          {!isSold && mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "15px 22px", borderRadius: 14, fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "0.2px", background: C.green, textDecoration: "none", boxShadow: "0 2px 12px rgba(30,77,43,0.2)" }}>
              <MapPin size={15} strokeWidth={2} />Plan your visit
            </a>
          ) : (
            <button onClick={() => router.push("/")}
              style={{ width: "100%", padding: "15px 22px", borderRadius: 14, fontSize: 15, fontWeight: 600, color: C.textMid, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
              Browse more finds
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
