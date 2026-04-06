// app/find/[id]/page.tsx
// Find detail page.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink, Share2 } from "lucide-react";
import { getPost } from "@/lib/posts";
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
};

function timeAgo(dateStr: string): string {
  const ms   = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return `${hrs}h ago`;
  if (days <  7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FindDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [post,    setPost]    = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!id) return;
    getPost(id).then(data => { setPost(data); setLoading(false); });
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

      {/* ── Hero image ── */}
      <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
        {post.image_url ? (
          <>
            <img
              src={post.image_url} alt={post.title}
              style={{ width: "100%", height: "62vw", maxHeight: 320, objectFit: "cover", display: "block", filter: isSold ? "grayscale(0.4) brightness(0.85)" : "brightness(0.97) saturate(0.95)" }}
            />
            {/* Bottom fade into page bg */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, transparent, ${C.bg})` }} />
            {/* Top fade for nav legibility */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, rgba(240,237,230,0.7), transparent)" }} />
          </>
        ) : (
          <div style={{ height: 120, background: C.surface, borderBottom: `1px solid ${C.border}` }} />
        )}

        {/* Nav */}
        <div style={{ position: "absolute", top: "max(14px, env(safe-area-inset-top, 14px))", left: 14, right: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.header, border: `1px solid ${C.border}`, backdropFilter: "blur(12px)", cursor: "pointer" }}>
            <ArrowLeft size={15} style={{ color: C.textMid }} />
          </button>
          <button onClick={handleShare} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.header, border: `1px solid ${C.border}`, backdropFilter: "blur(12px)", cursor: "pointer" }}>
            <Share2 size={14} style={{ color: copied ? C.green : C.textMuted }} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: "4px 18px", paddingBottom: "max(110px, env(safe-area-inset-bottom, 110px))" }}>

        {isSold && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: 10 }}>
            <span style={{ display: "inline-block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 10px", borderRadius: 5, color: C.textMuted, background: C.surface, border: `1px solid ${C.border}` }}>
              Found a home
            </span>
          </motion.div>
        )}

        {/* Title + price */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.05 }}>
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
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.11 }} style={{ marginBottom: 22 }}>
            <div style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${C.green}, transparent)`, opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.72, margin: 0, fontStyle: "italic", fontFamily: "Georgia, serif" }}>{post.caption}</p>
          </motion.div>
        )}

        {/* Description */}
        {post.description && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.16 }} style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.68, margin: 0 }}>{post.description}</p>
          </motion.div>
        )}

        <div style={{ height: 1, background: C.border, marginBottom: 18 }} />

        {/* Vendor + mall card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.2 }}
          style={{ borderRadius: 14, padding: "14px 15px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: 12 }}
        >
          {post.vendor && (
            <div style={{ marginBottom: post.mall ? 13 : 0 }}>
              <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Vendor</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.textPrimary, fontWeight: 600 }}>{post.vendor.display_name}</div>
              {post.vendor.booth_number && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Booth {post.vendor.booth_number}</div>}
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
      </div>

      {/* ── Fixed CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.28 }}
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
    </div>
  );
}
