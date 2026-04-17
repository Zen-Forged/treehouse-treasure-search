// app/my-shelf/page.tsx
// My Booth — cinematic vendor profile page. Auth-gated.
// Changes:
//   - Page renamed "My Booth" throughout (nav already updated in BottomNav)
//   - Share icon → Send (airplane) icon, positioned on hero banner image
//   - Header when no vendor: matches other pages (logo + "Treehouse Finds" + back chevron)
//   - Share button on banner, top-right, same frosted circle style as product pages

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Send, Check, ImagePlus, Pencil, Loader } from "lucide-react";
import { PiLeaf } from "react-icons/pi";
import { getVendorByUserId, getVendorById, getVendorPosts, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post, type Vendor, type Mall } from "@/types/treehouse";
import { colors } from "@/lib/tokens";
import { vendorHueBg } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import TabSwitcher from "@/components/TabSwitcher";
import BoothFinderCard from "@/components/BoothFinderCard";
import ExploreBanner from "@/components/ExploreBanner";
import { ThreeColGrid, SkeletonGrid, AvailableTile, FoundTile, ShelfGridStyles } from "@/components/ShelfGrid";
import type { User } from "@supabase/supabase-js";

const ADMIN_DEFAULT_VENDOR_ID = "5619b4bf-3d05-4843-8ee1-e8b747fc2d81";
const BASE_URL                = "https://treehouse-treasure-search.vercel.app";

function compressImage(dataUrl: string, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const scale  = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── Add Find tile ────────────────────────────────────────────────────────────

function AddFindTile({ index, vendorId }: { index: number; vendorId?: string }) {
  const router = useRouter();
  function handleAdd() {
    router.push(vendorId ? `/post?vendor=${vendorId}` : "/post");
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1" }}
    >
      <button
        onClick={handleAdd}
        style={{
          width: "100%", height: "100%", borderRadius: 10,
          background: colors.emptyTile, border: "none", cursor: "pointer", padding: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <ImagePlus size={18} strokeWidth={1.4} style={{ color: "rgba(28,26,20,0.38)" }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(28,26,20,0.42)", textTransform: "uppercase", letterSpacing: "1.2px", lineHeight: 1 }}>
          Add
        </span>
      </button>
    </motion.div>
  );
}

// ─── Vendor hero card ─────────────────────────────────────────────────────────
// Item 13: Send (airplane) icon on banner image, top-right
// Item 14: app bar matches other pages

function VendorHero({
  displayName, boothNumber, mallName, mallCity,
  heroImageUrl, heroKey, onShare, hasCopied, hasSlug,
  onHeroImageChange, heroUploading, heroError, vendorId,
}: {
  displayName: string; boothNumber: string | null; mallName?: string; mallCity?: string;
  heroImageUrl?: string | null; heroKey: number;
  onShare: () => void; hasCopied: boolean; hasSlug: boolean;
  onHeroImageChange: (file: File) => void; heroUploading: boolean; heroError: string | null;
  vendorId: string | undefined;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ padding: "max(14px, env(safe-area-inset-top, 14px)) 10px 0" }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onHeroImageChange(f); e.target.value = ""; }} />

      {/* App bar — item 14: matches other pages (logo + title + sign-out link style) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingLeft: 4, paddingRight: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/logo.png" alt="Treehouse Finds" width={20} height={20} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.2px" }}>
            My Booth
          </span>
        </div>
      </div>

      {/* Hero banner */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 200 }}>
        {heroImageUrl
          ? <img key={heroKey} src={heroImageUrl} alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          : <div style={{ position: "absolute", inset: 0, background: vendorHueBg(displayName) }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(18,34,20,0.82) 0%, rgba(18,34,20,0.40) 55%, transparent 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(18,34,20,0.72) 0%, transparent 100%)", zIndex: 1 }} />

        {/* Edit banner button — top-left on banner */}
        {vendorId && (
          <button onClick={() => fileInputRef.current?.click()} disabled={heroUploading}
            style={{ position: "absolute", top: 12, left: 12, zIndex: 10, width: 34, height: 34, borderRadius: "50%", background: "rgba(20,18,12,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: heroUploading ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}>
            {heroUploading
              ? <Loader size={13} style={{ color: "rgba(255,255,255,0.80)", animation: "spin 0.9s linear infinite" }} />
              : <Pencil size={13} style={{ color: "rgba(255,255,255,0.88)" }} />
            }
          </button>
        )}

        {/* Item 13: Send (airplane) share icon — top-right on banner, frosted circle */}
        {hasSlug && (
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
            <AnimatePresence mode="wait">
              {hasCopied ? (
                <motion.div key="copied"
                  initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.14 }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 18, background: "rgba(30,77,43,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <Check size={11} style={{ color: "#fff" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Copied!</span>
                </motion.div>
              ) : (
                <motion.button key="share" onClick={onShare}
                  initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.14 }}
                  style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.30)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                  <Send size={14} style={{ color: "rgba(255,255,255,0.92)" }} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        <div style={{ position: "relative", zIndex: 2, padding: "100px 16px 18px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.52)", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 5px" }}>
            A curated shelf from
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "0 0 5px", textShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
            {displayName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {boothNumber && (
              <div style={{ padding: "4px 11px", borderRadius: 18, background: colors.green, fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>
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

      {heroError && (
        <div style={{ margin: "8px 10px 0", padding: "10px 14px", borderRadius: 10, background: colors.redBg, border: `1px solid ${colors.redBorder}`, fontSize: 12, color: colors.red, lineHeight: 1.5 }}>
          ⚠️ Upload error: {heroError}
        </div>
      )}
    </div>
  );
}

// ─── No booth state ───────────────────────────────────────────────────────────

function NoBooth() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px 0", textAlign: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: colors.surface, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <PiLeaf size={22} style={{ color: colors.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        No booth set up yet
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.75, maxWidth: 230, margin: "0 0 28px" }}>
        Post your first find to create your booth identity and see your shelf here.
      </p>
      <Link href="/post" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 24, background: colors.green, color: "rgba(255,255,255,0.96)", fontSize: 13, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 12px rgba(30,77,43,0.25)" }}>
        Post a find
      </Link>
    </motion.div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function MyBoothInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [user,          setUser]          = useState<User | null>(null);
  const [authReady,     setAuthReady]     = useState(false);
  const [activeVendor,  setActiveVendor]  = useState<Vendor | null>(null);
  const [vendorReady,   setVendorReady]   = useState(false);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [postsLoading,  setPostsLoading]  = useState(false);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [tab,           setTab]           = useState<"available" | "found">("available");
  const [heroImageUrl,  setHeroImageUrl]  = useState<string | null>(null);
  const [heroKey,       setHeroKey]       = useState(0);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError,     setHeroError]     = useState<string | null>(null);

  const userRef       = useRef<User | null>(null);
  const heroLockedRef = useRef(false);

  useEffect(() => {
    getSession().then(s => {
      if (!s?.user) { router.replace("/login"); return; }
      setUser(s.user);
      userRef.current = s.user;
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    const authedUser  = user;
    const adminUser   = isAdmin(authedUser);
    const vendorParam = searchParams.get("vendor");

    async function resolve() {
      if (adminUser && vendorParam) {
        const v = await getVendorById(vendorParam);
        if (v) { loadVendor(v, authedUser.id); return; }
      }
      const v = await getVendorByUserId(authedUser.id);
      if (v) { loadVendor(v, authedUser.id); return; }

      // Self-heal (KI-003 — session 9): if this signed-in user has no linked
      // vendor, try to link one by calling /api/setup/lookup-vendor. This is the
      // same endpoint /setup uses during first-run onboarding. Running it here
      // makes /my-shelf a valid landing point for the Flow 2/3 journey even if
      // the user bypassed /setup (e.g. approval-email CTA lands them directly
      // on /my-shelf via /login's redirect handling). Admin users skip this —
      // they fall through to ADMIN_DEFAULT_VENDOR_ID instead.
      if (!adminUser) {
        try {
          const res  = await authFetch("/api/setup/lookup-vendor", {
            method: "POST",
            body:   JSON.stringify({}),
          });
          const json = await res.json();
          if (res.ok && json?.ok && json.vendor) {
            loadVendor(json.vendor as Vendor, authedUser.id);
            return;
          }
        } catch (err) {
          console.error("[my-shelf] self-heal lookup-vendor failed:", err);
        }
      }

      if (adminUser) {
        const defaultV = await getVendorById(ADMIN_DEFAULT_VENDOR_ID);
        if (defaultV) { loadVendor(defaultV, authedUser.id); return; }
      }
      setVendorReady(true);
    }

    resolve();
  }, [authReady, user?.id]);

  function loadVendor(vendor: Vendor, userId: string) {
    setActiveVendor(vendor);
    if (vendor.hero_image_url && !heroLockedRef.current) {
      setHeroImageUrl(vendor.hero_image_url as string);
    }
    const cached: LocalVendorProfile = {
      display_name: vendor.display_name,
      booth_number: vendor.booth_number ?? "",
      mall_id:      vendor.mall_id,
      mall_name:    (vendor.mall as Mall | undefined)?.name ?? "",
      mall_city:    (vendor.mall as Mall | undefined)?.city ?? "",
      vendor_id:    vendor.id,
      slug:         vendor.slug,
      user_id:      userId,
    };
    try { localStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(cached)); } catch {}
    if (vendor.mall) {
      setMall(vendor.mall as Mall);
    } else {
      getAllMalls().then(malls => setMall(malls.find(m => m.id === vendor.mall_id) ?? null));
    }
    setVendorReady(true);
  }

  useEffect(() => {
    if (!activeVendor) return;
    setPostsLoading(true);
    getVendorPosts(activeVendor.id, 200).then(data => {
      setPosts(data);
      setPostsLoading(false);
    });
  }, [activeVendor?.id]);

  async function handleHeroImageChange(file: File) {
    if (!activeVendor?.id) return;
    
    // Size guard: reject files larger than 12MB
    if (file.size > 12_000_000) {
      setHeroError("Image too large. Please choose a photo smaller than 12MB.");
      return;
    }
    
    setHeroUploading(true);
    setHeroError(null);
    heroLockedRef.current = true;
    const vendorId    = activeVendor.id;
    const fallbackUrl = (activeVendor.hero_image_url as string | null) ?? null;
    try {
      const reader  = new FileReader();
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(dataUrl);
      setHeroImageUrl(compressed);
      setHeroKey(k => k + 1);
      const res  = await fetch("/api/vendor-hero", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ base64DataUrl: compressed, vendorId }) });
      const json = await res.json();
      if (!res.ok || json.error) {
        setHeroError(json.error ?? "Upload failed.");
        setHeroImageUrl(fallbackUrl);
        setHeroKey(k => k + 1);
        return;
      }
      setHeroImageUrl(json.url);
      setHeroKey(k => k + 1);
      setActiveVendor(v => v ? { ...v, hero_image_url: json.url } : v);
    } catch (err) {
      setHeroError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      setHeroImageUrl(fallbackUrl);
      setHeroKey(k => k + 1);
    } finally {
      setHeroUploading(false);
      setTimeout(() => { heroLockedRef.current = false; }, 3000);
    }
  }

  async function handleShare() {
    const slug = activeVendor?.slug;
    if (!slug) return;
    const url  = `${BASE_URL}/shelf/${slug}`;
    const name = activeVendor.display_name;
    if (navigator.share) { try { await navigator.share({ title: `${name} on Treehouse`, text: `Check out finds from ${name}.`, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  }

  if (!authReady) return null;

  const available   = posts.filter(p => p.status === "available");
  const found       = posts.filter(p => p.status === "sold");
  const displayName = activeVendor?.display_name ?? "";
  const boothNumber = activeVendor?.booth_number  ?? null;
  const hasSlug     = !!activeVendor?.slug;
  const mallName    = mall?.name ?? (activeVendor?.mall as Mall | undefined)?.name ?? "America's Antique Mall";
  const mallCity    = mall?.city ?? (activeVendor?.mall as Mall | undefined)?.city ?? "Louisville, KY";
  const loading     = !vendorReady || postsLoading;

  return (
    <div style={{ minHeight: "100dvh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {activeVendor ? (
        <VendorHero
          displayName={displayName} boothNumber={boothNumber}
          mallName={mallName} mallCity={mallCity}
          heroImageUrl={heroImageUrl} heroKey={heroKey}
          onShare={handleShare} hasCopied={copied} hasSlug={hasSlug}
          onHeroImageChange={handleHeroImageChange} heroUploading={heroUploading}
          vendorId={activeVendor.id}
          heroError={heroError}
        />
      ) : (
        /* Item 14: fallback header matches other pages */
        <header style={{ background: colors.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${colors.border}`, padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Treehouse Finds" width={24} height={24} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.3px" }}>My Booth</span>
        </header>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <SkeletonGrid />
        ) : !activeVendor ? (
          <NoBooth />
        ) : (
          <>
            <TabSwitcher tab={tab} availableCount={available.length} foundCount={found.length} onChange={t => setTab(t)} />

            {tab === "available" && (
              <ThreeColGrid>
                {available.map((post, i) => <AvailableTile key={post.id} post={post} index={i} />)}
                <AddFindTile index={available.length} vendorId={activeVendor.id} />
              </ThreeColGrid>
            )}

            {tab === "found" && (
              found.length > 0 ? (
                <ThreeColGrid>
                  {found.map((post, i) => <FoundTile key={post.id} post={post} index={i} />)}
                </ThreeColGrid>
              ) : (
                <div style={{ padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <PiLeaf size={28} style={{ color: colors.textFaint }} />
                  <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.7, margin: 0 }}>
                    Nothing found yet —<br />your shelf is wide open.
                  </p>
                </div>
              )
            )}

            <BoothFinderCard boothNumber={boothNumber} displayName={displayName} mallName={mallName} mallCity={mallCity} />
            <ExploreBanner />
            <div style={{ height: 12 }} />
          </>
        )}
      </div>

      <BottomNav active="my-shelf" />

      <ShelfGridStyles />
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}

export default function MyBoothPage() {
  return (
    <Suspense>
      <MyBoothInner />
    </Suspense>
  );
}
