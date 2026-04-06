// app/vendor/[slug]/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink, Facebook } from "lucide-react";
import { getVendorBySlug, getVendorPosts } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Vendor, type Post } from "@/types/treehouse";

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

function VendorPostCard({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{ borderRadius: 13, overflow: "hidden", background: C.surface, border: `1px solid ${C.border}`, opacity: isSold ? 0.65 : 1 }}>
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", paddingBottom: "75%" }}>
              <img src={post.image_url!} alt={post.title} onError={() => setImgErr(true)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: isSold ? "grayscale(0.4) brightness(0.88)" : "brightness(0.97)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to bottom, transparent, rgba(26,26,24,0.55))" }} />
              {isSold && (
                <div style={{ position: "absolute", top: 7, left: 7, fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", padding: "2px 6px", borderRadius: 4, background: "rgba(240,237,230,0.92)", color: C.textMuted, border: `1px solid ${C.border}` }}>Sold</div>
              )}
              {post.price_asking != null && !isSold && (
                <div style={{ position: "absolute", top: 7, right: 7, fontFamily: "monospace", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(240,237,230,0.92)", color: C.textPrimary, border: `1px solid ${C.border}` }}>
                  ${post.price_asking % 1 === 0 ? post.price_asking.toFixed(0) : post.price_asking.toFixed(2)}
                </div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 9px 8px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: "#f5f0e8", lineHeight: 1.25, textShadow: "0 1px 6px rgba(0,0,0,0.5)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                  {post.title}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 10px" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>{post.title}</div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function GridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ borderRadius: 13, overflow: "hidden", background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="skeleton-shimmer" style={{ width: "100%", paddingBottom: "75%" }} />
          <div style={{ padding: "10px" }}>
            <div className="skeleton-shimmer" style={{ height: 12, width: "70%", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VendorPage() {
  const { slug }   = useParams<{ slug: string }>();
  const router     = useRouter();
  const [vendor,   setVendor]   = useState<Vendor | null>(null);
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isMe,     setIsMe]     = useState(false);

  useEffect(() => {
    if (!slug) return;
    getVendorBySlug(slug).then(async v => {
      if (!v) { setNotFound(true); setLoading(false); return; }
      setVendor(v);
      const p = await getVendorPosts(v.id);
      setPosts(p);
      setLoading(false);
      // Check if this is the logged-in vendor
      try {
        const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
        if (raw) {
          const profile = JSON.parse(raw) as LocalVendorProfile;
          setIsMe(profile.vendor_id === v.id);
        }
      } catch {}
    });
  }, [slug]);

  const mall      = vendor?.mall;
  const available = posts.filter(p => p.status === "available");
  const sold      = posts.filter(p => p.status === "sold");

  const mapsUrl = mall?.address
    ? `https://maps.apple.com/?q=${encodeURIComponent(mall.address)}`
    : mall ? `https://maps.apple.com/?q=${encodeURIComponent(`${mall.name} ${mall.city} ${mall.state}`)}` : null;

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: C.textPrimary }}>Vendor not found.</div>
        <button onClick={() => router.push("/")} style={{ fontSize: 13, color: C.green, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Back to feed</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: C.header, backdropFilter: "blur(22px)", borderBottom: `1px solid ${C.border}`, padding: "max(14px, env(safe-area-inset-top, 14px)) 15px 12px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", flexShrink: 0 }}>
            <ArrowLeft size={14} style={{ color: C.textMid }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: C.textPrimary, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vendor?.display_name ?? "Loading…"}</div>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>{vendor?.booth_number ? `Booth ${vendor.booth_number}` : "Vendor"}</div>
          </div>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 11px", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, color: C.green, fontSize: 11, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
              <ExternalLink size={10} />Visit booth
            </a>
          )}
        </header>

        {/* Vendor card */}
        {vendor && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ margin: "14px 14px 0", padding: "14px 15px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}` }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>{vendor.display_name}</div>
                {vendor.booth_number && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Booth {vendor.booth_number}</div>}
                {mall && (
                  <Link href={`/mall/${mall.slug}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <MapPin size={10} style={{ color: C.textMuted, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.textMuted, textDecoration: "underline", textDecorationColor: "rgba(138,132,120,0.4)" }}>{mall.name} · {mall.city}</span>
                    </div>
                  </Link>
                )}
                {/* Facebook link */}
                {vendor.facebook_url && (
                  <a href={vendor.facebook_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#1877f2", textDecoration: "none", fontWeight: 500 }}>
                    <Facebook size={12} />
                    Facebook page
                  </a>
                )}
                {vendor.bio && <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, margin: "10px 0 0", fontStyle: "italic" }}>{vendor.bio}</p>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{available.length}</div>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 2 }}>Available</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Posts */}
        <main style={{ padding: "14px 14px", paddingBottom: "max(60px, env(safe-area-inset-bottom, 60px))" }}>
          {loading ? <GridSkeleton /> : posts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.textPrimary, marginBottom: 10 }}>No finds posted yet.</div>
              <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>Check back soon.</div>
            </motion.div>
          ) : (
            <>
              {available.length > 0 && (
                <>
                  <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>
                    Available now · {available.length} {available.length === 1 ? "find" : "finds"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: sold.length > 0 ? 22 : 0 }}>
                    {available.map((post, i) => <VendorPostCard key={post.id} post={post} index={i} />)}
                  </div>
                </>
              )}
              {sold.length > 0 && (
                <>
                  <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>Found a home · {sold.length}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {sold.map((post, i) => <VendorPostCard key={post.id} post={post} index={i} />)}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(220,216,208,0.7) 25%, rgba(200,196,188,0.9) 50%, rgba(220,216,208,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
