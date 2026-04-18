// app/my-shelf/page.tsx
// My Booth — vendor profile page, v1.1h. Auth-gated.
//
// Booth page v1.1h commitments (see docs/design-system.md §Booth page):
//   - Banner is a pure photograph; vendor name relocates to IM Fell 32px title below
//   - Booth post-it pinned to banner (bottom-right, +6deg, "Booth Location" eyebrow + 36px numeral)
//   - Small pin + mall + dotted-underline address block below the title
//   - Window View (default): 3-col 4:5 portrait grid, AddFindTile top-left
//   - Shelf View: horizontal scroll, 52vw/210px max tiles, 22px left padding
//   - Found homes tab retired; sold items don't render on this page
//   - ExploreBanner retired; diamond-divider quiet closer instead
//   - Georgia retired from this page
//
// All auth / self-heal / hero upload wiring preserved from session 10 Flow 2 close.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PiLeaf } from "react-icons/pi";
import { getVendorByUserId, getVendorById, getVendorPosts, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post, type Vendor, type Mall } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";
import {
  BoothHero,
  BoothTitleBlock,
  MallBlock,
  DiamondDivider,
  ViewToggle,
  WindowView,
  ShelfView,
  BoothCloser,
  BoothPageStyles,
  v1,
  FONT_IM_FELL,
  FONT_SYS,
  type BoothView,
} from "@/components/BoothPage";
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

// ─── Masthead (Mode A, owner variant — no back arrow, no right slot) ──────────

function Masthead() {
  return (
    <div
      style={{
        padding: "max(14px, env(safe-area-inset-top, 14px)) 22px 12px",
        display: "grid",
        gridTemplateColumns: "38px 1fr 38px",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div />
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 18,
          color: v1.inkPrimary,
          letterSpacing: "-0.005em",
          textAlign: "center",
        }}
      >
        Treehouse Finds
      </div>
      <div />
    </div>
  );
}

// ─── No booth state (preserved from session 10) ───────────────────────────────

function NoBooth() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 32px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "rgba(42,26,10,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
        }}
      >
        <PiLeaf size={22} style={{ color: v1.inkMuted }} />
      </div>
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 24,
          color: v1.inkPrimary,
          marginBottom: 10,
          lineHeight: 1.2,
        }}
      >
        No booth linked to this account
      </div>
      <p
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 15,
          color: v1.inkMuted,
          lineHeight: 1.65,
          maxWidth: 280,
          margin: "0 auto",
        }}
      >
        If you&rsquo;re a vendor awaiting approval, your booth will appear here once setup is complete. Questions? Reach out to the admin directly.
      </p>
    </motion.div>
  );
}

// ─── Skeleton (while loading) ─────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "0 10px" }}>
      <div
        className="booth-shimmer"
        style={{ borderRadius: v1.bannerRadius, minHeight: 260, width: "100%" }}
      />
      <div style={{ padding: "36px 22px 6px" }}>
        <div className="booth-shimmer" style={{ height: 14, width: 120, borderRadius: 4, marginBottom: 8 }} />
        <div className="booth-shimmer" style={{ height: 34, width: 240, borderRadius: 6 }} />
      </div>
      <div style={{ padding: "16px 22px" }}>
        <div className="booth-shimmer" style={{ height: 22, width: 200, borderRadius: 4, marginBottom: 6 }} />
        <div className="booth-shimmer" style={{ height: 16, width: 240, borderRadius: 4 }} />
      </div>
      <style>{`
        @keyframes boothshimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .booth-shimmer {
          background: linear-gradient(90deg, rgba(225,220,210,0.4) 25%, rgba(208,202,190,0.65) 50%, rgba(225,220,210,0.4) 75%);
          background-size: 800px 100%;
          animation: boothshimmer 1.6s infinite linear;
        }
      `}</style>
    </div>
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
  const [view,          setView]          = useState<BoothView>("window");
  const [heroImageUrl,  setHeroImageUrl]  = useState<string | null>(null);
  const [heroKey,       setHeroKey]       = useState(0);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError,     setHeroError]     = useState<string | null>(null);

  const heroLockedRef = useRef(false);

  useEffect(() => {
    getSession().then(s => {
      if (!s?.user) { router.replace("/login"); return; }
      setUser(s.user);
      setAuthReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Self-heal (KI-003 — session 9): signed-in user with no linked vendor
      // tries /api/setup/lookup-vendor before falling through to NoBooth.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const displayName = activeVendor?.display_name ?? "";
  const boothNumber = activeVendor?.booth_number  ?? null;
  const mallName    = mall?.name ?? (activeVendor?.mall as Mall | undefined)?.name ?? "America's Antique Mall";
  const mallCity    = mall?.city ?? (activeVendor?.mall as Mall | undefined)?.city ?? "Louisville, KY";
  const address     = mall?.address ?? null;
  const loading     = !vendorReady || postsLoading;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Masthead />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
        }}
      >
        {loading ? (
          <Skeleton />
        ) : !activeVendor ? (
          <NoBooth />
        ) : (
          <>
            <BoothHero
              displayName={displayName}
              boothNumber={boothNumber}
              heroImageUrl={heroImageUrl}
              heroKey={heroKey}
              onShare={handleShare}
              hasCopied={copied}
              canEdit={true}
              heroUploading={heroUploading}
              onHeroImageChange={handleHeroImageChange}
            />

            {heroError && (
              <div
                style={{
                  margin: "8px 22px 0",
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: v1.redBg,
                  border: `1px solid ${v1.redBorder}`,
                  fontSize: 12,
                  color: v1.red,
                  lineHeight: 1.5,
                  fontFamily: FONT_SYS,
                }}
              >
                ⚠️ Upload error: {heroError}
              </div>
            )}

            <BoothTitleBlock displayName={displayName} />
            <MallBlock mallName={mallName} mallCity={mallCity} address={address} />
            <DiamondDivider topPad={22} bottomPad={12} horizontalPad={44} />
            <ViewToggle view={view} onChange={setView} />

            {view === "window" ? (
              <WindowView posts={available} vendorId={activeVendor.id} showAddTile={true} />
            ) : (
              available.length > 0 ? (
                <ShelfView posts={available} />
              ) : (
                <div
                  style={{
                    padding: "48px 28px",
                    textAlign: "center",
                    fontFamily: FONT_IM_FELL,
                    fontStyle: "italic",
                    fontSize: 15,
                    color: v1.inkMuted,
                    lineHeight: 1.65,
                  }}
                >
                  The shelf is empty — switch to Window View to add your first find.
                </div>
              )
            )}

            <BoothCloser />
          </>
        )}
      </div>

      <BottomNav active="my-shelf" />

      <BoothPageStyles />
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
