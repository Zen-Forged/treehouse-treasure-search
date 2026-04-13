// app/shelf/[slug]/page.tsx
// Public Saved Shelf — read-only view of a vendor's shelf.
// Identical cinematic layout to My Shelf but with no editing capability:
//   - No hero image edit button
//   - No "Add" tile
//   - No sign-out button
//   - No admin link
// Linked from vendor's "Share" button in My Shelf.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, ArrowLeft, Heart } from "lucide-react";
import { getVendorBySlug, getVendorPosts, getAllMalls } from "@/lib/posts";
import type { Post, Vendor, Mall } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";

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
  greenLight:  "rgba(30,77,43,0.08)",
  greenBorder: "rgba(30,77,43,0.20)",
  emptyTile:   "#dedad2",
  bannerFrom:  "#1e3d24",
  bannerTo:    "#2d5435",
};

const GAP       = 6;
const GRID_COLS = 3;
const BOOKMARK_PREFIX = "treehouse_bookmark_";

function loadBookmarkCount(): number {
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") count++;
    }
  } catch {}
  return count;
}

function mapsUrl(query: string) { return `https://maps.apple.com/?q=${encodeURIComponent(query)}`; }

function vendorHueBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const hues = [142, 168, 195, 220, 25, 340];
  return `hsl(${hues[h % hues.length]}, 22%, 78%)`;
}

// ─── Read-only hero card ───────────────────────────────────────────────────────

function PublicVendorHero({ displayName, boothNumber, mallName, mallCity, heroImageUrl, onBack }: {
  displayName: string; boothNumber: string | null; mallName?: string; mallCity?: string;
  heroImageUrl?: string | null; onBack: () => void;
}) {
  return (
    <div style={{ padding: "max(14px, env(safe-area-inset-top, 14px)) 10px 0" }}>

      {/* App bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingLeft: 4, paddingRight: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack}
            style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${C.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            <ArrowLeft size={13} style={{ color: C.textMid }} />
          </button>
          <Image src="/logo.png" alt="Treehouse Finds" width={18} height={18} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: C.green, letterSpacing: "0.4px" }}>
            Treehouse Finds
          </span>
        </div>
        {/* No explore link, no share/sign-out/admin — read-only */}
      </div>

      {/* Hero card (no edit button) */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 200 }}>
        {heroImageUrl
          ? <img src={heroImageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          : <div style={{ position: "absolute", inset: 0, background: vendorHueBg(displayName) }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(18,34,20,0.82) 0%, rgba(18,34,20,0.40) 55%, transparent 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(18,34,20,0.72) 0%, transparent 100%)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, padding: "100px 16px 18px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.52)", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 5px" }}>
            A curated shelf from
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "0 0 5px", textShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
            {displayName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {boothNumber && (
              <div style={{ padding: "4px 11px", borderRadius: 18, background: C.green, fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>
                Booth {boothNumber}
              </div>
            )}
            {mallName && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={9} style={{ color: "rgba(255,255,255,0.52)", flexShrink: 0 }} />
                <span style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "rgba(255,255,255,0.62)" }}>
                  {mallName}{mallCity ? ` · ${mallCity}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab switcher ──────────────────────────────────────────────────────────────

function TabSwitcher({ tab, availableCount, foundCount, onChange }: { tab: "available" | "found"; availableCount: number; foundCount: number; onChange: (t: "available" | "found") => void }) {
  return (
    <div style={{ display: "flex", margin: "12px 10px 8px", background: C.surface, borderRadius: 22, padding: 3, gap: 2 }}>
      {(["available", "found"] as const).map(t => {
        const active = tab === t;
        const count  = t === "available" ? availableCount : foundCount;
        return (
          <button key={t} onClick={() => onChange(t)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 19, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "background 0.18s", WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: active ? 700 : 400, color: active ? C.textPrimary : C.textMuted }}>
              {t === "available" ? "Available" : "Found"}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.green : C.textFaint }}>({count})</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Tiles (read-only — no owner controls) ─────────────────────────────────────

function ShelfTile({ post, index, sold }: { post: Post; index: number; sold?: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative", opacity: sold ? 0.62 : 1 }}>
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        {post.image_url && !imgErr
          ? <img src={post.image_url} alt={post.title} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: sold ? "grayscale(0.55) brightness(0.82)" : "none" }} />
          : <div style={{ width: "100%", height: "100%", background: C.surface }} />
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(20,18,12,0.72) 0%, transparent 100%)", padding: "18px 8px 8px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {post.title}
          </div>
        </div>
        {sold && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 8px", borderRadius: 5, background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.93)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", whiteSpace: "nowrap" }}>
            Found
          </div>
        )}
      </Link>
    </motion.div>
  );
}

function ThreeColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: GAP, padding: `0 ${GAP}px` }}>
      {children}
    </div>
  );
}

// ─── Booth finder card ─────────────────────────────────────────────────────────

function BoothFinderCard({ boothNumber, displayName, mallName, mallCity }: { boothNumber: string | null; displayName: string; mallName: string; mallCity?: string }) {
  const q = [mallName, mallCity].filter(Boolean).join(", ");
  return (
    <a href={mapsUrl(q)} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "stretch", margin: "20px 10px 0", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff", textDecoration: "none" }}>
      <div style={{ width: 100, flexShrink: 0, background: `linear-gradient(135deg, ${C.bannerFrom}, ${C.bannerTo})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MapPin size={22} style={{ color: "rgba(255,255,255,0.40)" }} />
      </div>
      <div style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
          <MapPin size={11} style={{ color: C.textMuted, flexShrink: 0 }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Find this booth in person</span>
        </div>
        <p style={{ margin: "0 0 3px", fontFamily: "Georgia, serif", fontSize: 12, color: C.textMid }}>{displayName}{boothNumber ? ` · Booth ${boothNumber}` : ""}</p>
        <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 12, color: C.textMuted }}>{mallName}{mallCity ? `, ${mallCity}` : ""}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingRight: 14 }}>
        <ChevronRight size={16} style={{ color: C.textFaint }} />
      </div>
    </a>
  );
}

// ─── Explore CTA ───────────────────────────────────────────────────────────────

function ExploreBanner() {
  return (
    <div style={{ margin: "14px 10px 0", borderRadius: 16, background: `linear-gradient(110deg, ${C.bannerFrom} 0%, ${C.bannerTo} 100%)`, padding: "20px 18px" }}>
      <p style={{ margin: "0 0 4px", fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.50)", letterSpacing: "2px", textTransform: "uppercase" }}>
        {"There's more to discover"}
      </p>
      <h2 style={{ margin: "0 0 6px", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Explore more shelves nearby</h2>
      <p style={{ margin: "0 0 16px", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>From local booths. Across Kentucky.</p>
      <Link href="/"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 24, background: "rgba(255,255,255,0.95)", textDecoration: "none", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: C.bannerFrom }}>
        Enter the Treehouse <ChevronRight size={14} style={{ color: C.bannerFrom }} />
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div style={{ padding: `${GAP}px` }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: GAP }}>
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ borderRadius: 10, width: "100%", aspectRatio: "1" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicShelfPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();
  const [vendor,        setVendor]       = useState<Vendor | null>(null);
  const [posts,         setPosts]        = useState<Post[]>([]);
  const [mall,          setMall]         = useState<Mall | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [notFound,      setNotFound]     = useState(false);
  const [tab,           setTab]          = useState<"available" | "found">("available");
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    setBookmarkCount(loadBookmarkCount());
  }, []);

  useEffect(() => {
    if (!slug) return;
    getVendorBySlug(slug).then(async v => {
      if (!v) { setNotFound(true); setLoading(false); return; }
      setVendor(v);
      const p = await getVendorPosts(v.id, 200);
      setPosts(p);
      if (v.mall) {
        setMall(v.mall as Mall);
      } else if (v.mall_id) {
        getAllMalls().then(malls => setMall(malls.find(m => m.id === v.mall_id) ?? null));
      }
      setLoading(false);
    });
  }, [slug]);

  if (notFound) {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
        <Heart size={32} style={{ color: C.textFaint }} />
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, textAlign: "center" }}>Shelf not found</div>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 1.7, margin: 0 }}>
          This shelf may have moved or the link may be outdated.
        </p>
        <Link href="/" style={{ fontSize: 13, color: C.green, textDecoration: "none", fontWeight: 600 }}>← Back to feed</Link>
      </div>
    );
  }

  const available = posts.filter(p => p.status === "available");
  const found     = posts.filter(p => p.status === "sold");
  const mallName  = mall?.name ?? vendor?.mall?.name ?? "America's Antique Mall";
  const mallCity  = mall?.city ?? vendor?.mall?.city ?? "Louisville, KY";

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {vendor ? (
        <PublicVendorHero
          displayName={vendor.display_name}
          boothNumber={vendor.booth_number ?? null}
          mallName={mallName}
          mallCity={mallCity}
          heroImageUrl={vendor.hero_image_url}
          onBack={() => router.back()}
        />
      ) : (
        /* Header skeleton */
        <div style={{ padding: "max(14px, env(safe-area-inset-top, 14px)) 10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
            <div className="skeleton-shimmer" style={{ width: 18, height: 18, borderRadius: "50%" }} />
            <div className="skeleton-shimmer" style={{ width: 120, height: 14, borderRadius: 6 }} />
          </div>
          <div className="skeleton-shimmer" style={{ borderRadius: 16, minHeight: 200, width: "100%" }} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <SkeletonGrid />
        ) : posts.length === 0 ? (
          <div style={{ padding: "60px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Heart size={28} style={{ color: C.textFaint }} />
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>
              Nothing on the shelf yet — check back soon.
            </p>
          </div>
        ) : (
          <>
            <TabSwitcher tab={tab} availableCount={available.length} foundCount={found.length} onChange={t => setTab(t)} />

            {tab === "available" && (
              <ThreeColGrid>
                {available.map((post, i) => <ShelfTile key={post.id} post={post} index={i} />)}
              </ThreeColGrid>
            )}

            {tab === "found" && (
              found.length > 0 ? (
                <ThreeColGrid>
                  {found.map((post, i) => <ShelfTile key={post.id} post={post} index={i} sold />)}
                </ThreeColGrid>
              ) : (
                <div style={{ padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <Heart size={28} style={{ color: C.textFaint }} />
                  <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>
                    Nothing found yet — this shelf is wide open.
                  </p>
                </div>
              )
            )}

            <BoothFinderCard
              boothNumber={vendor?.booth_number ?? null}
              displayName={vendor?.display_name ?? ""}
              mallName={mallName}
              mallCity={mallCity}
            />
            <ExploreBanner />
            <div style={{ height: 12 }} />
          </>
        )}
      </div>

      <BottomNav active="shelves" flaggedCount={bookmarkCount} />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
