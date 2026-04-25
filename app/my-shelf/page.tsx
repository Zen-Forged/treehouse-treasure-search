// app/my-shelf/page.tsx
// My Booth — vendor profile page. Session 35 (2026-04-20) — multi-booth aware.
// Session 40 (2026-04-21) — Q-007 Window Sprint client wiring added.
//
// Changes from v1.1h/v1.2:
//   - getVendorByUserId → getVendorsByUserId (array return)
//   - Active booth resolved via lib/activeBooth.resolveActiveBooth (safeStorage
//     `treehouse_active_vendor_id`, falls back to vendors[0] deterministically)
//   - When vendors.length > 1: masthead renders "Viewing · [Booth Name] ▾"
//     block as a single tap target that opens <BoothPickerSheet>.
//   - When vendors.length ≤ 1: masthead is unchanged from v1.1l — 99% of
//     current users see today's UX exactly as before. No chevron, no sheet.
//   - Admin `?vendor=id` impersonation preserved — bypasses active-booth
//     resolution and renders against the requested vendor directly.
//
// Session 35 — self-heal always runs (fix for booth-002 not linking):
//   The original session-35 resolver short-circuited at (b) whenever
//   getVendorsByUserId returned any rows, so a user who already owned ONE
//   linked vendor never triggered the /api/setup/lookup-vendor self-heal
//   when a SECOND approved unlinked vendor row was waiting on their email.
//   Result: picker never appeared because the second row was never linked.
//
//   Fix: for any signed-in non-admin user, always run both the DB fetch AND
//   the lookup-vendor call, then merge by vendor.id. Extra cost is one
//   indexed short-circuit SELECT on `vendors.user_id` per /my-shelf load —
//   trivial. Benefit: /my-shelf is now self-correcting for newly-approved
//   booths on every visit, which also closes a latent Flow 2 demo-approval
//   edge case where the vendor would previously need to sign out and back
//   in to see their booth.
//
// Session 40 — Window share wiring:
//   - Masthead right slot gets a paper-airplane icon that opens
//     <ShareBoothSheet>. Icon is HIDDEN when `available.length < 1` to
//     match the server's 409 empty-window guard — vendors with nothing to
//     share never see the entry point. No server-side check needed;
//     `available` is already computed client-side for the WindowView.
//   - Pre-session-40 right slot was `<div />` (empty placeholder), so this
//     does not displace any existing affordance.
//
// Session 45 (2026-04-22) — BoothHero URL link-share retired:
//   The old top-right frosted airplane bubble inside BoothHero (link-share
//   via navigator.share / clipboard) was removed from the shared primitive.
//   The masthead airplane (Window email) is now the sole share affordance
//   on this page. The local `copied` state, the `handleShare` function,
//   and the `BASE_URL` constant (only used by that function) were all
//   deleted here at the same commit. See components/BoothPage.tsx header
//   for the shared-primitive rationale.
//
// The approved mockup (docs/mockups/my-shelf-multi-booth-v1.html) is the
// authority for the masthead layout. If this code and the mockup diverge,
// the mockup wins.
//
// Booth page v1.1h commitments otherwise unchanged:
//   - Banner is a pure photograph; vendor name as IM Fell 32px title below
//   - Booth post-it pinned to banner (bottom-right, +6deg)
//   - Window View (default) / Shelf View toggle
//   - AddFindSheet + ?openAdd=1 redirect shim from /post preserved

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PiLeaf } from "react-icons/pi";
import { getVendorsByUserId, getVendorById, getVendorPosts, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { compressImage as compressForAdd } from "@/lib/imageUpload";
import { postStore } from "@/lib/postStore";
import { loadFollowedIds } from "@/lib/utils";
import { track } from "@/lib/clientEvents";
import {
  resolveActiveBooth,
  setActiveBoothId,
} from "@/lib/activeBooth";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post, type Vendor, type Mall } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import AddFindSheet from "@/components/AddFindSheet";
import BoothPickerSheet from "@/components/BoothPickerSheet";
import ShareBoothSheet from "@/components/ShareBoothSheet";
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

// ─── Masthead ─────────────────────────────────────────────────────────────────
// Center slot is the app brand lockup — always "Treehouse Finds" regardless
// of single- vs. multi-booth state. Q-002 (session 57) moved the multi-booth
// picker affordance OUT of the masthead and INLINE with the 32px booth name
// under the hero banner (see BoothTitleBlock's onPickerOpen prop).
//
// Right slot: paper-airplane share affordance when `canShare` is true; 38px
// spacer otherwise so the "38px 1fr 38px" grid stays centered.
//
// Scroll target remains the page's overflow-auto container (passed by parent)
// per v1.1l's internal-scroll-safe pattern.

function Masthead({
  scrollTarget,
  canShare,
  onShareOpen,
}: {
  scrollTarget: React.RefObject<HTMLDivElement | null>;
  canShare:     boolean;
  onShareOpen:  () => void;
}) {
  return (
    <StickyMasthead
      scrollTarget={scrollTarget}
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
      {canShare ? (
        <button
          onClick={onShareOpen}
          aria-label="Share this booth by email"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: v1.iconBubble,
            border: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <MastheadPaperAirplane />
        </button>
      ) : (
        <div />
      )}
    </StickyMasthead>
  );
}

// Inline paper-airplane glyph for the masthead right-slot share button.
// Drawn slightly off-axis to echo the +6° tilt used elsewhere in v1.1h/v1.2
// (booth post-it). Uses v1.green to read as an active / commit-shaped
// affordance at the page-header level.
function MastheadPaperAirplane() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={v1.green}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
    </svg>
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

  // Multi-booth state (session 35)
  const [vendorList,    setVendorList]    = useState<Vendor[]>([]);
  const [activeVendor,  setActiveVendor]  = useState<Vendor | null>(null);
  const [adminOverride, setAdminOverride] = useState(false);   // true when ?vendor=id is used
  const [vendorReady,   setVendorReady]   = useState(false);
  const [pickerOpen,    setPickerOpen]    = useState(false);

  // Session 40 — Window share sheet state.
  const [shareOpen,     setShareOpen]     = useState(false);

  const [posts,         setPosts]         = useState<Post[]>([]);
  const [postsLoading,  setPostsLoading]  = useState(false);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [view,          setView]          = useState<BoothView>("window");
  const [heroImageUrl,  setHeroImageUrl]  = useState<string | null>(null);
  const [heroKey,       setHeroKey]       = useState(0);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError,     setHeroError]     = useState<string | null>(null);

  // v1.2 — AddFindSheet state + hidden file inputs.
  const [showAddSheet, setShowAddSheet] = useState(false);
  const cameraInputRef  = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Q-003 (session 36): Find Map saved-count badge passthrough. Mirrors the
  // Home reference implementation in app/page.tsx. safeStorage-backed count,
  // refreshed on focus and visibilitychange so bookmarks toggled elsewhere
  // propagate back to the badge when the user returns to this tab.
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const heroLockedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Auth gate ──────────────────────────────────────────────────────────
  useEffect(() => {
    getSession().then(s => {
      if (!s?.user) { router.replace("/login"); return; }
      setUser(s.user);
      setAuthReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // R3 — page_viewed analytics event.
  useEffect(() => { track("page_viewed", { path: "/my-shelf" }); }, []);

  // ── Q-003 (session 36): bookmark count sync ───────────────────────────
  // Mirror of app/page.tsx pattern — same sync fn, same event set. We also
  // listen to visibilitychange because My Booth is a frequent return surface
  // after a vendor saves/unsaves a find on another page in the same tab.
  useEffect(() => {
    function syncBookmarkCount() {
      try { setBookmarkCount(loadFollowedIds().size); } catch {}
    }
    syncBookmarkCount();
    function onFocus() { syncBookmarkCount(); }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") syncBookmarkCount();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // ── Vendor resolution ──────────────────────────────────────────────────
  // Session 35 resolver (post-fix):
  //   (a) Admin with ?vendor=id → render that vendor directly (adminOverride=true)
  //   (b) Non-admin: fetch getVendorsByUserId AND /api/setup/lookup-vendor
  //       in parallel, merge by vendor.id. lookup-vendor links any
  //       newly-approved unlinked rows and returns the full linked set;
  //       getVendorsByUserId is the direct DB read. Both converge on the
  //       same list once lookup-vendor finishes. Merging tolerates either
  //       returning first in the Promise.all.
  //   (c) Admin fallback — ADMIN_DEFAULT_VENDOR_ID when no impersonation param.
  useEffect(() => {
    if (!authReady || !user) return;

    const authedUser  = user;
    const adminUser   = isAdmin(authedUser);
    const vendorParam = searchParams.get("vendor");

    async function resolve() {
      // (a) Admin impersonation
      if (adminUser && vendorParam) {
        const v = await getVendorById(vendorParam);
        if (v) {
          setAdminOverride(true);
          setVendorList([v]);             // treat impersonated as single-booth
          loadVendor(v, authedUser.id);
          return;
        }
      }

      // (b) Non-admin: parallel DB read + self-heal.
      // Admins skip self-heal entirely — they don't have vendor_requests
      // and we don't want ADMIN_DEFAULT_VENDOR_ID's user_id rewritten.
      if (!adminUser) {
        const merged = await loadLinkedVendors(authedUser.id);
        if (merged.length > 0) {
          setVendorList(merged);
          const active = resolveActiveBooth(merged);
          if (active) { loadVendor(active, authedUser.id); return; }
        }
      } else {
        // Admin without ?vendor=id: read-only DB fetch, skip self-heal.
        const direct = await getVendorsByUserId(authedUser.id);
        if (direct.length > 0) {
          setVendorList(direct);
          const active = resolveActiveBooth(direct);
          if (active) { loadVendor(active, authedUser.id); return; }
        }
      }

      // (c) Admin with no default — fallback
      if (adminUser) {
        const defaultV = await getVendorById(ADMIN_DEFAULT_VENDOR_ID);
        if (defaultV) {
          setAdminOverride(true);
          setVendorList([defaultV]);
          loadVendor(defaultV, authedUser.id);
          return;
        }
      }

      setVendorReady(true);
    }

    resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]);

  /**
   * Session 35 fix: race DB-direct and self-heal, merge by id.
   *
   * Both calls hit the same Supabase instance and converge on the same
   * linked set once lookup-vendor finishes its link UPDATE — but racing
   * lets us render whichever comes back first and then "top up" with the
   * other if it adds rows.
   *
   * lookup-vendor's short-circuit (step 1 of the route) makes this cheap
   * for already-linked users: it returns the existing vendors array with
   * no linking work. For users with newly-approved unlinked rows, it does
   * the composite-key link and returns the full set including the new row.
   *
   * Promise.all rather than sequential because there's no ordering
   * dependency — merging dedupes by id.
   */
  async function loadLinkedVendors(userId: string): Promise<Vendor[]> {
    const [directRes, lookupRes] = await Promise.allSettled([
      getVendorsByUserId(userId),
      authFetch("/api/setup/lookup-vendor", {
        method: "POST",
        body:   JSON.stringify({}),
      }).then(async r => {
        if (!r.ok) return null;
        const json = await r.json();
        if (json?.ok && Array.isArray(json.vendors)) return json.vendors as Vendor[];
        return null;
      }).catch(err => {
        console.error("[my-shelf] self-heal lookup-vendor failed:", err);
        return null;
      }),
    ]);

    const direct = directRes.status === "fulfilled" ? directRes.value : [];
    const lookup = lookupRes.status === "fulfilled" && lookupRes.value ? lookupRes.value : [];

    // Merge by id. Prefer the direct-DB version when there's a duplicate
    // because it's guaranteed to have the mall join that getVendorsByUserId
    // always requests; the lookup-vendor response also joins mall, but we
    // stay deterministic here regardless of which side returns first.
    const byId = new Map<string, Vendor>();
    for (const v of lookup) byId.set(v.id, v);
    for (const v of direct) byId.set(v.id, v); // direct overwrites

    return Array.from(byId.values()).sort((a, b) => {
      // Preserve the getVendorsByUserId created_at ASC ordering so the
      // resolveActiveBooth fallback (vendors[0] = oldest) is stable.
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return ta - tb;
    });
  }

  function loadVendor(vendor: Vendor, userId: string) {
    setActiveVendor(vendor);
    // Reset hero-locked flag on vendor switch so the new booth's hero image
    // loads instead of keeping the previous one pinned.
    heroLockedRef.current = false;
    if (vendor.hero_image_url) {
      setHeroImageUrl(vendor.hero_image_url as string);
      setHeroKey(k => k + 1);
    } else {
      setHeroImageUrl(null);
      setHeroKey(k => k + 1);
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

  // ── Posts hydration ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeVendor) return;
    setPostsLoading(true);
    getVendorPosts(activeVendor.id, 200).then(data => {
      setPosts(data);
      setPostsLoading(false);
    });
  }, [activeVendor?.id]);

  // ── Picker selection ───────────────────────────────────────────────────
  function handlePickerSelect(vendorId: string) {
    if (!user) return;
    const next = vendorList.find(v => v.id === vendorId);
    if (!next) return;
    setActiveBoothId(next.id);
    loadVendor(next, user.id);
  }

  // ── Hero upload (unchanged from v1.1l) ─────────────────────────────────
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
      // Also mutate the matching row in vendorList so a subsequent booth
      // switch back returns the new hero, not the stale one.
      setVendorList(list =>
        list.map(v => v.id === vendorId ? { ...v, hero_image_url: json.url } : v)
      );
    } catch (err) {
      setHeroError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      setHeroImageUrl(fallbackUrl);
      setHeroKey(k => k + 1);
    } finally {
      setHeroUploading(false);
      setTimeout(() => { heroLockedRef.current = false; }, 3000);
    }
  }

  // ── AddFindSheet plumbing (unchanged from v1.2) ────────────────────────
  function openAddSheet() {
    setShowAddSheet(true);
  }

  useEffect(() => {
    if (!vendorReady || !activeVendor) return;
    if (searchParams.get("openAdd") !== "1") return;
    setShowAddSheet(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("openAdd");
    const qs = params.toString();
    router.replace(`/my-shelf${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorReady, activeVendor?.id]);

  async function handleAddFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setShowAddSheet(false);
      return;
    }
    if (!activeVendor) {
      setShowAddSheet(false);
      return;
    }
    try {
      const reader  = new FileReader();
      const rawData = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed = await compressForAdd(rawData);
      postStore.set(compressed);
      setShowAddSheet(false);
      const vendorParam = searchParams.get("vendor");
      const dest = vendorParam ? `/post/preview?vendor=${vendorParam}` : "/post/preview";
      router.push(dest);
    } catch (err) {
      console.error("[my-shelf] add-find file read failed:", err);
      setShowAddSheet(false);
    }
  }

  function onAddInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAddFile(f);
    e.target.value = "";
  }

  if (!authReady) return null;

  const available   = posts.filter(p => p.status === "available");
  const displayName = activeVendor?.display_name ?? "";
  const boothNumber = activeVendor?.booth_number  ?? null;
  const mallName    = mall?.name ?? (activeVendor?.mall as Mall | undefined)?.name ?? "America's Antique Mall";
  const mallCity    = mall?.city ?? (activeVendor?.mall as Mall | undefined)?.city ?? "Louisville, KY";
  const address     = mall?.address ?? null;
  const loading     = !vendorReady || postsLoading;

  // Multi-booth gating — admin impersonation always reads as single-booth,
  // otherwise it follows the real list length.
  const showPicker = !adminOverride && vendorList.length > 1;

  // Session 40 — share icon visibility. Build-spec §4: hidden when the
  // vendor has no available posts. Client-side check mirrors the server's
  // 409 empty_window guard. `available` is already filtered above.
  const canShare = !!activeVendor && available.length >= 1;

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
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
        }}
      >
        <Masthead
          scrollTarget={scrollContainerRef}
          canShare={canShare}
          onShareOpen={() => setShareOpen(true)}
        />
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

            <BoothTitleBlock
              displayName={displayName}
              onPickerOpen={showPicker ? () => setPickerOpen(true) : undefined}
            />
            <MallBlock mallName={mallName} mallCity={mallCity} address={address} />
            <DiamondDivider topPad={22} bottomPad={12} horizontalPad={44} />
            <ViewToggle view={view} onChange={setView} />

            {view === "window" ? (
              <WindowView
                posts={available}
                vendorId={activeVendor.id}
                showAddTile={true}
                showPlaceholders={true}
                onAddClick={openAddSheet}
              />
            ) : (
              available.length > 0 ? (
                <ShelfView
                  posts={available}
                  vendorId={activeVendor.id}
                  showAddTile={true}
                  onAddClick={openAddSheet}
                />
              ) : (
                <ShelfView
                  posts={[]}
                  vendorId={activeVendor.id}
                  showAddTile={true}
                  onAddClick={openAddSheet}
                />
              )
            )}

            <BoothCloser />
          </>
        )}
      </div>

      <BottomNav active="my-shelf" flaggedCount={bookmarkCount} />

      {/* Hidden file inputs — camera + gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onAddInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={onAddInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <AddFindSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onTakePhoto={() => cameraInputRef.current?.click()}
        onChooseFromLibrary={() => galleryInputRef.current?.click()}
      />

      {/* Booth picker — only instantiated when vendor owns >1 booth */}
      {showPicker && activeVendor && user?.email && (
        <BoothPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          vendors={vendorList}
          activeVendorId={activeVendor.id}
          onSelect={handlePickerSelect}
          vendorEmail={user.email}
        />
      )}

      {/* Session 40 — Window share sheet. Mounted whenever we have an active
          vendor so the sheet's open/close can be fully controlled by state.
          Visibility of the entry point (masthead icon) is gated separately
          above via `canShare`. */}
      {activeVendor && (
        <ShareBoothSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          vendor={activeVendor}
          mall={mall}
          previewPosts={available}
        />
      )}

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
