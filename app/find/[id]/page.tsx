// app/find/[id]/page.tsx
// Find detail page — full cinematic presentation for a single vendor post.
// Hero image, Treehouse caption, vendor info, mall location, "Plan your visit" CTA.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink, Share2 } from "lucide-react";
import { getPost } from "@/lib/posts";
import type { Post } from "@/types/treehouse";

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
      try {
        await navigator.share({ title: post?.title ?? "A Treehouse find", text: post?.caption ?? "", url });
      } catch {}
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
      <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#2a2010", fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#c8b47e" }}>This find has moved on.</div>
        <button onClick={() => router.push("/")} style={{ fontSize: 13, color: "#6a5528", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(106,85,40,0.3)" }}>Browse the feed</button>
      </div>
    );
  }

  const isSold = post.status === "sold";

  return (
    <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
        {post.image_url ? (
          <>
            <img src={post.image_url} alt={post.title} style={{ width: "100%", height: "56vw", maxHeight: 280, objectFit: "cover", display: "block", filter: isSold ? "brightness(0.6) saturate(0.42) sepia(0.1)" : "brightness(0.8) saturate(0.76) sepia(0.06)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 130, background: "linear-gradient(to bottom, transparent, #050f05)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 90, background: "linear-gradient(to bottom, rgba(5,15,5,0.65), transparent)" }} />
          </>
        ) : (
          <div style={{ height: 110, background: "rgba(13,31,13,0.4)", borderBottom: "1px solid rgba(109,188,109,0.06)" }} />
        )}

        <div style={{ position: "absolute", top: "max(14px, env(safe-area-inset-top, 14px))", left: 14, right: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,13,5,0.72)", border: "1px solid rgba(109,188,109,0.12)", backdropFilter: "blur(12px)", cursor: "pointer" }}>
            <ArrowLeft size={15} style={{ color: "#c8b47e" }} />
          </button>
          <button onClick={handleShare} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,13,5,0.72)", border: "1px solid rgba(109,188,109,0.12)", backdropFilter: "blur(12px)", cursor: "pointer" }}>
            <Share2 size={14} style={{ color: copied ? "#6dbc6d" : "#6a5528" }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "6px 18px", paddingBottom: "max(110px, env(safe-area-inset-bottom, 110px))" }}>

        {isSold && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: 10 }}>
            <span style={{ display: "inline-block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 10px", borderRadius: 5, color: "#7a6535", background: "rgba(122,101,53,0.1)", border: "1px solid rgba(122,101,53,0.18)" }}>Found a home</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.05 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#f5f0e8", lineHeight: 1.2, letterSpacing: "-0.4px", margin: "0 0 7px" }}>{post.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            {post.price_asking != null && (
              <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#c8b47e" }}>
                ${post.price_asking % 1 === 0 ? post.price_asking.toFixed(0) : post.price_asking.toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: 10, color: "#2a2010", fontFamily: "monospace" }}>{timeAgo(post.created_at)}</span>
          </div>
        </motion.div>

        {post.caption && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.11 }} style={{ marginBottom: 22 }}>
            <div style={{ width: 26, height: 1, background: "linear-gradient(90deg, rgba(200,180,126,0.48), transparent)", marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: "#8a7050", lineHeight: 1.72, margin: 0, fontStyle: "italic" }}>{post.caption}</p>
          </motion.div>
        )}

        {post.description && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.16 }} style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 13, color: "#6a5528", lineHeight: 1.68, margin: 0 }}>{post.description}</p>
          </motion.div>
        )}

        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(200,180,126,0.07), rgba(200,180,126,0.03), transparent)", marginBottom: 18 }} />

        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, delay: 0.2 }}
          style={{ borderRadius: 14, padding: "14px 15px", background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.1)", marginBottom: 12 }}
        >
          {post.vendor && (
            <div style={{ marginBottom: post.mall ? 13 : 0 }}>
              <div style={{ fontSize: 8, color: "#2a2010", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Vendor</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", fontWeight: 600 }}>{post.vendor.display_name}</div>
              {post.vendor.booth_number && <div style={{ fontSize: 11, color: "#4a3a1e", marginTop: 2 }}>Booth {post.vendor.booth_number}</div>}
            </div>
          )}
          {post.vendor && post.mall && <div style={{ height: 1, background: "rgba(109,188,109,0.07)", marginBottom: 13 }} />}
          {post.mall && (
            <div>
              <div style={{ fontSize: 8, color: "#2a2010", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>Location</div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "#d4c9b0", fontWeight: 600, marginBottom: 3 }}>{post.mall.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={9} style={{ color: "#3a2e18", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#4a3a1e" }}>{post.mall.city}, {post.mall.state}</span>
                  </div>
                  {post.mall.address && <div style={{ fontSize: 11, color: "#2a2010", marginTop: 2, paddingLeft: 13 }}>{post.mall.address}</div>}
                </div>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 11px", borderRadius: 8, flexShrink: 0, background: "rgba(200,180,126,0.08)", border: "1px solid rgba(200,180,126,0.14)", color: "#a8904e", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                    <ExternalLink size={10} />Directions
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.28 }}
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", padding: "10px 15px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))", background: "rgba(5,13,5,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(200,180,126,0.06)", zIndex: 50 }}
      >
        {!isSold && mapsUrl ? (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "15px 22px", borderRadius: 14, fontSize: 15, fontWeight: 600, color: "#f5f0e8", letterSpacing: "0.2px", background: "linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))", border: "1px solid rgba(109,188,109,0.15)", textDecoration: "none", boxShadow: "0 4px 20px rgba(5,15,5,0.5)" }}>
            <MapPin size={15} strokeWidth={2} />Plan your visit
          </a>
        ) : (
          <button onClick={() => router.push("/")} style={{ width: "100%", padding: "15px 22px", borderRadius: 14, fontSize: 15, fontWeight: 600, color: "#f5f0e8", letterSpacing: "0.2px", background: "rgba(13,31,13,0.7)", border: "1px solid rgba(109,188,109,0.1)", cursor: "pointer" }}>
            Browse more finds
          </button>
        )}
      </motion.div>
    </div>
  );
}
