// app/mall/[slug]/page.tsx — fixed: single fetch on mount
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink } from "lucide-react";
import { getMallBySlug, getMallPosts } from "@/lib/posts";
import type { Mall, Post } from "@/types/treehouse";

function GridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ borderRadius: 13, overflow: "hidden", background: "rgba(13,31,13,0.4)", border: "1px solid rgba(109,188,109,0.06)" }}>
          <div className="skeleton-shimmer" style={{ width: "100%", paddingBottom: "75%" }} />
          <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="skeleton-shimmer" style={{ height: 12, width: "70%", borderRadius: 4 }} />
            <div className="skeleton-shimmer" style={{ height: 9,  width: "45%", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MallPostCard({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{ borderRadius: 13, overflow: "hidden", background: "rgba(13,31,13,0.55)", border: "1px solid rgba(109,188,109,0.09)", opacity: isSold ? 0.65 : 1 }}>
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", paddingBottom: "75%" }}>
              <img src={post.image_url!} alt={post.title} onError={() => setImgErr(true)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: isSold ? "brightness(0.55) saturate(0.35)" : "brightness(0.82) saturate(0.76) sepia(0.05)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to bottom, transparent, rgba(5,13,5,0.8))" }} />
              {isSold && (
                <div style={{ position: "absolute", top: 7, left: 7, fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", padding: "2px 6px", borderRadius: 4, background: "rgba(5,13,5,0.88)", color: "#6a5528", border: "1px solid rgba(106,85,40,0.25)" }}>Sold</div>
              )}
              {post.price_asking != null && !isSold && (
                <div style={{ position: "absolute", top: 7, right: 7, fontFamily: "monospace", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(5,13,5,0.82)", color: "#c8b47e", border: "1px solid rgba(200,180,126,0.18)" }}>
                  ${post.price_asking % 1 === 0 ? post.price_asking.toFixed(0) : post.price_asking.toFixed(2)}
                </div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 9px 8px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: "#f5f0e8", lineHeight: 1.25, textShadow: "0 1px 8px rgba(5,13,5,0.9)", marginBottom: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                  {post.title}
                </div>
                {post.vendor && <div style={{ fontSize: 9, color: "#3a2e18" }}>{post.vendor.display_name}</div>}
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 10px" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: "#f5f0e8", lineHeight: 1.3, marginBottom: 4 }}>{post.title}</div>
              {post.vendor && <div style={{ fontSize: 9, color: "#3a2e18" }}>{post.vendor.display_name}</div>}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function MallPage() {
  const { slug }   = useParams<{ slug: string }>();
  const router     = useRouter();
  const [mall,     setMall]     = useState<Mall | null>(null);
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getMallBySlug(slug).then(async m => {
      if (!m) { setNotFound(true); setLoading(false); return; }
      setMall(m);
      const p = await getMallPosts(m.id);
      setPosts(p);
      setLoading(false);
    });
  }, [slug]);

  const mapsUrl = mall?.address
    ? `https://maps.apple.com/?q=${encodeURIComponent(mall.address)}`
    : mall ? `https://maps.apple.com/?q=${encodeURIComponent(`${mall.name} ${mall.city} ${mall.state}`)}` : null;

  const available = posts.filter(p => p.status === "available");
  const sold      = posts.filter(p => p.status === "sold");

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#c8b47e" }}>Mall not found.</div>
        <button onClick={() => router.push("/")} style={{ fontSize: 13, color: "#6a5528", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(106,85,40,0.3)" }}>Back to feed</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ position: "fixed", inset: 0, maxWidth: 430, margin: "0 auto", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(200,180,126,0.035) 0%, transparent 55%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>

        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(5,15,5,0.93)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(200,180,126,0.055)", padding: "max(14px, env(safe-area-inset-top, 14px)) 15px 12px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,31,13,0.6)", border: "1px solid rgba(109,188,109,0.1)", cursor: "pointer", flexShrink: 0 }}>
            <ArrowLeft size={14} style={{ color: "#7a6535" }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: "#f5f0e8", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mall?.name ?? "Loading…"}</div>
            <div style={{ fontSize: 9, color: "#3a2e18", textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>{mall ? `${mall.city}, ${mall.state}` : ""}</div>
          </div>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 11px", borderRadius: 20, background: "rgba(200,180,126,0.08)", border: "1px solid rgba(200,180,126,0.14)", color: "#a8904e", fontSize: 11, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
              <ExternalLink size={10} />Directions
            </a>
          )}
        </header>

        {mall && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ margin: "14px 14px 0", padding: "14px 15px", borderRadius: 14, background: "rgba(13,31,13,0.5)", border: "1px solid rgba(109,188,109,0.09)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#f5f0e8", marginBottom: 5 }}>{mall.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: mall.address ? 3 : 0 }}>
                  <MapPin size={10} style={{ color: "#4a3a1e", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#6a5528" }}>{mall.city}, {mall.state}</span>
                </div>
                {mall.address && <div style={{ fontSize: 11, color: "#4a3a1e", paddingLeft: 14 }}>{mall.address}</div>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#c8b47e", lineHeight: 1 }}>{available.length}</div>
                <div style={{ fontSize: 9, color: "#3a2e18", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 2 }}>Available</div>
              </div>
            </div>
          </motion.div>
        )}

        <main style={{ padding: "14px 14px", paddingBottom: "max(60px, env(safe-area-inset-bottom, 60px))" }}>
          {loading ? <GridSkeleton /> : posts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: "#c8b47e", marginBottom: 10 }}>Nothing posted yet.</div>
              <div style={{ fontSize: 13, color: "#3a2e18", lineHeight: 1.6 }}>Vendors at this mall haven't shared any finds yet.</div>
            </motion.div>
          ) : (
            <>
              {available.length > 0 && (
                <>
                  <div style={{ fontSize: 8, color: "#2a2010", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>Available now · {available.length} {available.length === 1 ? "find" : "finds"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: sold.length > 0 ? 22 : 0 }}>
                    {available.map((post, i) => <MallPostCard key={post.id} post={post} index={i} />)}
                  </div>
                </>
              )}
              {sold.length > 0 && (
                <>
                  <div style={{ fontSize: 8, color: "#1e1808", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>Found a home · {sold.length}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {sold.map((post, i) => <MallPostCard key={post.id} post={post} index={i} />)}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(13,31,13,0.4) 25%, rgba(20,46,20,0.52) 50%, rgba(13,31,13,0.4) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
