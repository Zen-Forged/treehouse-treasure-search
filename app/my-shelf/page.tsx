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
//   - Banner is a pure photograph; vendor name as Lora 32px title below
//   - Booth post-it pinned to banner (bottom-right, +6deg)
//   - Window View (default) / Shelf View toggle
//   - AddFindSheet + ?openAdd=1 redirect shim from /post preserved

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useLayoutEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PiLeafBold } from "react-icons/pi";
import { ArrowLeft } from "lucide-react";
import { getVendorsByUserId, getVendorById, getVendorPosts, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { isReviewMode } from "@/lib/reviewMode";
import { FIXTURE_VENDORS, FIXTURE_SHOPPER } from "@/lib/fixtures";
import { authFetch } from "@/lib/authFetch";
import { compressImage as compressForAdd } from "@/lib/imageUpload";
import { postStore } from "@/lib/postStore";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { track } from "@/lib/clientEvents";
import {
  resolveActiveBooth,
  setActiveBoothId,
} from "@/lib/activeBooth";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post, type Vendor, type Mall } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";
import StickyMasthead from "@/components/StickyMasthead";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import AddFindSheet from "@/components/AddFindSheet";
import BoothPickerSheet from "@/components/BoothPickerSheet";
import ShareSheet from "@/components/ShareSheet";
import EditBoothSheet from "@/components/EditBoothSheet";
import {
  BoothHero,
  BoothTitleBlock,
  MallBlock,
  WindowView,
  BoothCloser,
  BoothPageStyles,
} from "@/components/BoothPage";
import { v1, v2, radius, FONT_CORMORANT, FONT_INTER, MOTION_EASE_OUT, MOTION_EMPTY_DURATION } from "@/lib/tokens";
import { PiCamera } from "react-icons/pi";
import type { User } from "@supabase/supabase-js";

const ADMIN_DEFAULT_VENDOR_ID = "5619b4bf-3d05-4843-8ee1-e8b747fc2d81";

// Session 85 — back-nav scroll anchoring. Module-scope cache survives
// /find/[id] navigation (App Router unmounts the page; module scope persists
// for the SPA session). Hydrating posts from cache on mount lets WindowTile
// photographs render without a skeleton flash. Cache is keyed by
// vendorId so multi-booth picker switching never restores stale posts to the
// wrong booth. Pure scroll behavior — no motion changes.
let cachedMyShelf: { vendorId: string; posts: Post[] } | null = null;

// Session 168 round 4 finding 3 — David iPhone QA: "When switching to the
// Booth page as vendor the loading glitches most likely due to auth gate
// but it should be seamless once logged in." Root cause: page mounts with
// authReady=false → renders `null` (blank) at line 725 → getSession()
// resolves async → setAuthReady(true) triggers next render with skeleton.
// The blank-then-skeleton sequence reads as a glitch when the user is
// already signed in.
//
// Fix mirrors the cachedMyShelf pattern above — module-scope user cache
// survives nav between (tabs)/ surfaces (Booth tab → other tab → Booth
// tab) so the second visit hydrates synchronously with authReady=true on
// first render. getSession() still runs in the background; if the session
// has expired (cache stale), the existing redirect-to-/login path catches
// it. Cleared explicitly on sign-out (null session) so a subsequent visit
// post-logout doesn't flash content for the wrong user before redirecting.
let cachedAuthUser: User | null = null;

// Session 168 round 5 finding 3 (BoothHero image flash) — round 4's
// cachedAuthUser killed the blank screen but BoothHero photo still
// flashed because heroImageUrl wasn't populated until the vendor fetch
// resolved. Caching the vendor + hero + mall bundle keyed by userId
// lets the FIRST paint show the full BoothHero composition (photo +
// title + mall strip) on warm-nav Booth-tab visits. Vendor fetch still
// runs in background to refresh; if the cached vendor is stale (vendor
// switch, profile edit, hero re-upload), loadVendor() reconciles in
// the same render cycle as the existing cachedMyShelf posts refresh.
//
// Bundle includes everything the first paint needs (vendor identity +
// hero asset + mall geometry) so all three primary visual surfaces
// (BoothHero / BoothTitleBlock / address strip) hydrate in one shot.
let cachedVendorBundle: {
  userId:       string;
  vendor:       Vendor;
  heroImageUrl: string | null;
  mall:         Mall | null;
} | null = null;
const MY_SHELF_SCROLL_KEY = "treehouse_my_shelf_scroll";

// Session 85 — write to BOTH localStorage and sessionStorage. iOS Safari
// has been observed to lose sessionStorage values intermittently across
// back-nav (suspected Next.js App Router router cache + iOS lifecycle
// suspension interaction). localStorage has stronger persistence guarantees
// on iOS. Read from both with localStorage as primary.
function readScrollY(): number | null {
  try {
    const ls = localStorage.getItem(MY_SHELF_SCROLL_KEY);
    if (ls) {
      const y = parseInt(ls, 10);
      if (!isNaN(y) && y > 0) return y;
    }
  } catch {}
  try {
    const ss = sessionStorage.getItem(MY_SHELF_SCROLL_KEY);
    if (ss) {
      const y = parseInt(ss, 10);
      if (!isNaN(y) && y > 0) return y;
    }
  } catch {}
  return null;
}
// Refuse to write 0. Next.js App Router's scroll-to-top transition fires
// real scroll events on outbound navigation; without this filter our
// scroll listener would clobber the user's actual scroll position with 0
// just before unmount, breaking back-nav restore. 0 is meaningless as a
// restore target anyway (empty storage already restores to 0 by default).
function writeScrollY(y: number) {
  const rounded = Math.round(y);
  if (rounded <= 0) return;
  const v = String(rounded);
  try { localStorage.setItem(MY_SHELF_SCROLL_KEY, v); } catch {}
  try { sessionStorage.setItem(MY_SHELF_SCROLL_KEY, v); } catch {}
}

// ─── Masthead ─────────────────────────────────────────────────────────────────
// Center slot is the app brand lockup — always "Treehouse Finds".
//
// Session 159 — masthead right slot: airplane → MastheadProfileButton
// universal (David Q3). Share affordance moves to BoothHero photo overlay
// per Q4; see <BoothHero onShare={...} /> wiring below. canShare +
// onShareOpen props retire from the local <Masthead> wrapper; the
// privately-defined <MastheadPaperAirplane> glyph also retires (was the
// only consumer).

function Masthead({
  onBack,
}: {
  onBack?: () => void;
}) {
  // Session 70 — locked-grid slot API. Inner grid + safe-area padding now
  // owned by StickyMasthead itself.
  // Session 85 — back button only renders when onBack is supplied (admin
  // path from /shelves; vendor self-view has no back since /my-shelf is
  // the canonical landing for the vendor mode).
  return (
    <StickyMasthead
      bg={v2.surface.warm}
      left={
        onBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: v1.iconBubble,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              padding: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </button>
        ) : null
      }
      right={<MastheadProfileButton />}
    />
  );
}

// ─── No booth state (preserved from session 10) ───────────────────────────────

function NoBooth() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_EMPTY_DURATION, ease: MOTION_EASE_OUT }}
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
          background: v2.surface.warm,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
        }}
      >
        <PiLeafBold size={22} style={{ color: v2.text.muted }} />
      </div>
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontSize: 24,
          color: v2.text.primary,
          marginBottom: 10,
          lineHeight: 1.3,
        }}
      >
        No booth linked to this account
      </div>
      <p
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 15,
          color: v2.text.muted,
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
        style={{ borderRadius: radius.lg, minHeight: 260, width: "100%" }}
      />
      <div style={{ padding: "16px 22px 6px" }}>
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

  // Session 168 round 4 finding 3 — synchronous hydrate from cachedAuthUser
  // (declared at module scope) so warm-auth Booth-tab nav doesn't flash a
  // blank screen. getSession() in the useEffect below still runs to refresh
  // / detect expired sessions; cache is just a render seed.
  const [user,          setUser]          = useState<User | null>(cachedAuthUser);
  const [authReady,     setAuthReady]     = useState(cachedAuthUser !== null);

  // Session 168 round 5 finding 3 (BoothHero image flash) — hydrate
  // active vendor + downstream state from cachedVendorBundle if cached
  // user matches. activeVendor sync-populated means BoothHero / Title /
  // mall strip all paint on first frame; the vendor-resolution effect
  // below still runs to refresh from network.
  const bundleHit = cachedVendorBundle && cachedAuthUser
    && cachedVendorBundle.userId === cachedAuthUser.id
    ? cachedVendorBundle : null;

  // Multi-booth state (session 35)
  const [vendorList,    setVendorList]    = useState<Vendor[]>([]);
  const [activeVendor,  setActiveVendor]  = useState<Vendor | null>(bundleHit?.vendor ?? null);
  const [adminOverride, setAdminOverride] = useState(false);   // true when ?vendor=id is used
  const [vendorReady,   setVendorReady]   = useState(bundleHit !== null);
  const [pickerOpen,    setPickerOpen]    = useState(false);

  // Session 40 — Window share sheet state.
  const [shareOpen,     setShareOpen]     = useState(false);

  // Hydrate posts from module-scope cache. The active vendor isn't yet
  // resolved on initial render (resolution happens async below), but if a
  // cache exists from a prior visit we render those tiles synchronously. The
  // posts effect below verifies the resolved vendor matches the cached
  // vendorId and refetches if not.
  const [posts,         setPosts]         = useState<Post[]>(cachedMyShelf?.posts ?? []);
  const [postsLoading,  setPostsLoading]  = useState(false);

  const pendingScrollY = useRef<number | null>(null);
  const scrollRestored = useRef(false);

  const [mall,          setMall]          = useState<Mall | null>(bundleHit?.mall ?? null);
  const [heroImageUrl,  setHeroImageUrl]  = useState<string | null>(bundleHit?.heroImageUrl ?? null);
  const [heroKey,       setHeroKey]       = useState(0);

  // v1.2 — AddFindSheet state + hidden file inputs.
  const [showAddSheet,  setShowAddSheet]  = useState(false);
  // Wave 1 Task 4 (session 91) — vendor self-edit booth name sheet.
  const [showEditSheet, setShowEditSheet] = useState(false);
  const cameraInputRef  = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Q-003 (session 36): Saved-count badge passthrough for BottomNav.
  // R1 Arc 4 — sourced from useShopperSaves so the count tracks both
  // localStorage (guest path) and shopper_saves (authed path). Hook owns
  // its own auth + cross-instance event listeners.
  const saves = useShopperSaves();
  const bookmarkCount = saves.ids.size;

  // ── Auth gate ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Review Board (session 150) — fixture-user; skip session check.
    if (isReviewMode()) {
      setUser({ id: FIXTURE_SHOPPER.user_id, email: FIXTURE_SHOPPER.email } as User);
      setAuthReady(true);
      return;
    }
    getSession().then(s => {
      if (!s?.user) {
        // Clear stale caches so a future Booth-tab visit doesn't flash the
        // signed-out user's chrome before redirecting. Round 5 — also
        // clears the vendor bundle (round 4 only cleared the user).
        cachedAuthUser     = null;
        cachedVendorBundle = null;
        router.replace("/login");
        return;
      }
      cachedAuthUser = s.user;
      setUser(s.user);
      setAuthReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // R3 — page_viewed analytics event.
  useEffect(() => { track("page_viewed", { path: "/my-shelf" }); }, []);

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

    // Review Board (session 150) — fixture vendor; skip API resolution.
    if (isReviewMode()) {
      loadVendor(FIXTURE_VENDORS[0], FIXTURE_SHOPPER.user_id);
      return;
    }

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
    const heroUrl = vendor.hero_image_url ? (vendor.hero_image_url as string) : null;
    setHeroImageUrl(heroUrl);
    setHeroKey(k => k + 1);
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
    // Review Board (session 150) — skip localStorage write (fixtures are read-only).
    if (!isReviewMode()) {
      try { localStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(cached)); } catch {}
    }
    let resolvedMall: Mall | null = null;
    if (vendor.mall) {
      resolvedMall = vendor.mall as Mall;
      setMall(resolvedMall);
    } else {
      getAllMalls().then(malls => {
        const found = malls.find(m => m.id === vendor.mall_id) ?? null;
        setMall(found);
        // Late mall resolution — patch the cache so a subsequent warm
        // nav gets the full bundle.
        if (cachedVendorBundle?.userId === userId && cachedVendorBundle.vendor.id === vendor.id) {
          cachedVendorBundle = { ...cachedVendorBundle, mall: found };
        }
      });
    }
    setVendorReady(true);
    // Session 168 round 5 finding 3 — populate cachedVendorBundle for
    // next warm-nav first-paint. Skipped on Review Board (fixtures).
    if (!isReviewMode()) {
      cachedVendorBundle = {
        userId,
        vendor,
        heroImageUrl: heroUrl,
        mall:         resolvedMall,
      };
    }
  }

  // ── Posts hydration ────────────────────────────────────────────────────
  // When the resolved active vendor matches the module-scope cache, hydrate
  // state from cache immediately and refresh in the background. Without the
  // cache hit (cold start, vendor switch), do the normal fetch with the
  // loading flag set.
  useEffect(() => {
    if (!activeVendor) return;
    if (cachedMyShelf?.vendorId === activeVendor.id) {
      setPosts(cachedMyShelf.posts);
      setPostsLoading(false);
      // Background refresh so the user sees up-to-date inventory after a
      // round-trip without ever showing a skeleton on cache hits.
      getVendorPosts(activeVendor.id, 200).then(data => {
        setPosts(data);
        cachedMyShelf = { vendorId: activeVendor.id, posts: data };
      });
      return;
    }
    setPostsLoading(true);
    getVendorPosts(activeVendor.id, 200).then(data => {
      setPosts(data);
      cachedMyShelf = { vendorId: activeVendor.id, posts: data };
      setPostsLoading(false);
    });
  }, [activeVendor?.id]);

  // Disable browser scroll restoration on /my-shelf so it doesn't fight our
  // manual restore. iOS Safari + Next.js App Router both attempt to anchor
  // scroll on back-nav, but neither cooperates with this page's multi-stage
  // async render (authReady → vendorReady → posts hydrate → image load).
  // Manual mode means our retry-scrollTo is the sole authority.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = window.history.scrollRestoration;
    try { window.history.scrollRestoration = "manual"; } catch {}
    return () => { try { window.history.scrollRestoration = prev; } catch {} };
  }, []);

  // Save on every scroll event so back-nav from /find/[id] lands where the
  // user tapped. Read sessionStorage once on mount into the pendingScrollY
  // ref — sessionStorage may be clobbered later by reflow-triggered scroll
  // events (iOS Safari fires onScroll during page-height transitions); the
  // ref captures the saved value before any of that can happen.
  useEffect(() => {
    const savedNum = readScrollY();
    if (savedNum !== null) pendingScrollY.current = savedNum;

    function persistScroll() { writeScrollY(window.scrollY); }
    // Save on multiple deterministic moments — iPhone iOS Safari sometimes
    // de-prioritizes scroll events during transitions, and listener cleanup
    // can run before the final scroll event lands. Belt-and-suspenders.
    window.addEventListener("scroll", persistScroll, { passive: true });
    document.addEventListener("click", persistScroll, true);
    document.addEventListener("touchend", persistScroll, { passive: true });
    document.addEventListener("visibilitychange", persistScroll);
    window.addEventListener("pagehide", persistScroll);
    return () => {
      window.removeEventListener("scroll", persistScroll);
      document.removeEventListener("click", persistScroll, true);
      document.removeEventListener("touchend", persistScroll);
      document.removeEventListener("visibilitychange", persistScroll);
      window.removeEventListener("pagehide", persistScroll);
    };
  }, []);

  // Restore scroll. useLayoutEffect fires synchronously after DOM commit
  // and before paint, which is the earliest reliable hook to win against
  // any framework / browser auto-scroll-to-top. The retry loop covers the
  // async gates that grow document.scrollHeight after this effect first
  // fires (BoothHero image load, masonry layout commit, etc.) — each
  // attempt is skipped while document isn't tall enough to reach targetY.
  // Restore loop — extracted so the BFCache (pageshow) handler below can
  // re-trigger it without remounting. Returns a cancel function.
  function runRestore(targetY: number): () => void {
    let attempts = 0;
    let cancelled = false;
    function attempt() {
      if (cancelled) return;
      attempts++;
      const maxScrollableY = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScrollableY >= targetY - 2) {
        window.scrollTo({ top: targetY, behavior: "instant" });
        if (Math.abs(window.scrollY - targetY) <= 2) {
          scrollRestored.current = true;
          return;
        }
      }
      if (attempts >= 60) {
        scrollRestored.current = true;
        return;
      }
      setTimeout(attempt, 50);
    }
    requestAnimationFrame(attempt);
    return () => { cancelled = true; };
  }

  useLayoutEffect(() => {
    if (!vendorReady) return;
    if (postsLoading) return;
    if (scrollRestored.current) return;
    if (pendingScrollY.current === null) return;
    return runRestore(pendingScrollY.current);
  }, [vendorReady, postsLoading]);

  // Re-read storage and try restore. Reusable across mount, BFCache,
  // popstate, and URL-param-change paths since any of them can deliver us
  // back to /my-shelf with content present but pendingScrollY ref stale.
  function rereadAndRestore() {
    const targetY = readScrollY();
    if (targetY === null) return;
    pendingScrollY.current = targetY;
    scrollRestored.current = false;
    runRestore(targetY);
  }

  // BFCache handler — pageshow with persisted=true fires when iOS Safari
  // restores a fully-cached page. React state is preserved as-is so
  // mount-time effects don't re-run; we re-read manually.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      rereadAndRestore();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // popstate handler — fires on browser back-nav even when Next.js App
  // Router keeps the page in its router cache without unmounting.
  useEffect(() => {
    function onPopState() {
      rereadAndRestore();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL-change handler — useSearchParams reactivity catches the
  // back-to-/my-shelf transition even when nothing else does.
  useEffect(() => {
    rereadAndRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Picker selection ───────────────────────────────────────────────────
  function handlePickerSelect(vendorId: string) {
    if (!user) return;
    const next = vendorList.find(v => v.id === vendorId);
    if (!next) return;
    setActiveBoothId(next.id);
    loadVendor(next, user.id);
  }

  // Hero edit — fully owned by EditBoothSheet (vendor self-edit Pencil at the
  // booth title). Sheet calls `/api/vendor-hero` POST/DELETE itself; our
  // `onUpdated` callback reconciles activeVendor + vendorList + heroImageUrl
  // so the BoothHero behind the open sheet reflects in-flight hero changes.

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
      postStore.setImage(compressed);
      setShowAddSheet(false);
      // Session 62 — Add Find now routes through /post/tag (tag-capture step)
      // before /post/preview. /post/tag uses router.replace to land on
      // /post/preview, so back-from-preview returns to /my-shelf as before.
      // The ?vendor= admin-impersonation param needs to thread through both
      // hops: /post/tag reads it from the URL too, then carries it to preview.
      const vendorParam = searchParams.get("vendor");
      const dest = vendorParam ? `/post/tag?vendor=${vendorParam}` : "/post/tag";
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
        background: v2.surface.warm,
        maxWidth: 430,
        margin: "0 auto",
        paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
      }}
    >
      <Masthead onBack={adminOverride ? () => router.back() : undefined} />

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
              onShare={canShare ? () => setShareOpen(true) : undefined}
            />

            <BoothTitleBlock
              displayName={displayName}
              onPickerOpen={showPicker ? () => setPickerOpen(true) : undefined}
              // Wave 1 Task 4 — vendor self-edit affordance. Arc 7.4.5
              // (session 148) extends to admin impersonation for vendor-
              // parity: admin viewing /my-shelf?vendor=<id> sees the same
              // Pencil and uses the same vendor-mode EditBoothSheet (display
              // _name only). /api/vendor/profile PATCH allows admin bypass
              // on ownership check + records acting_as_admin in audit event.
              // /shelves EditBoothSheet remains the canonical 3-field admin
              // edit surface (mall + booth_number + display_name).
              onEditName={() => setShowEditSheet(true)}
            />
            <MallBlock mallName={mallName} mallCity={mallCity} address={address} />

            {/* Session 169 round 3 — Review Board Finding 1: "Add a Find"
                primary CTA promotes from the dashed-tile slot in WindowView
                (showAddTile retires) to the slot ABOVE WindowView where
                DiamondDivider used to sit, matching /shelf/[slug]'s
                Bookmark Booth placement from session-169-round-1 (commit
                18fe631). David: "add button under the address that says
                Add a Find. This replaces the existing add a find button
                on the page."
                Vendor-self primary action lives ABOVE the find grid
                where the user sees it on first scroll, instead of
                appearing as a dashed tile inside the grid (which read
                as "filler placeholder" rather than primary affordance).
                Visual contract mirrors /shelf/[slug]'s primary CTA
                exactly — v2.accent.greenMid bg, FONT_INTER 11px uppercase
                0.12em weight 600, 10px radius, full-width with 10px
                padding. PiCamera glyph instead of Phosphor BookmarkSimple
                ('add new find' = camera vocabulary). DiamondDivider
                primitive retires from this surface (still exported from
                BoothPage.tsx; no other consumer remaining after this
                commit — opportunistic dead-code follow-up). */}
            <div style={{ padding: "22px 22px 12px" }}>
              <button
                type="button"
                onClick={openAddSheet}
                aria-label="Add a Find"
                style={{
                  width:          "100%",
                  background:     v2.accent.greenMid,
                  color:          "#fff",
                  border:         "none",
                  borderRadius:   10,
                  padding:        10,
                  fontFamily:     FONT_INTER,
                  fontSize:       11,
                  fontWeight:     600,
                  letterSpacing:  "0.12em",
                  textTransform:  "uppercase",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            8,
                  cursor:         "pointer",
                  WebkitTapHighlightColor: "transparent",
                  transition:     "background 0.15s ease",
                }}
              >
                <PiCamera size={14} aria-hidden />
                Add a Find
              </button>
            </div>

            {/* Session 128 (refinement design D2 + D3): ViewToggle + ShelfView
                retired. WindowView is the only find-rendering path.
                Session 169 round 3 — showAddTile retires (was true);
                the dashed Add-Find tile inside the grid promoted to a
                primary CTA above the grid (see button block above).
                onAddClick prop drops since no AddFindTile consumer
                remains inside WindowView for this surface. */}
            <WindowView
              posts={available}
              vendorId={activeVendor.id}
              showAddTile={false}
            />

            <BoothCloser />
          </>
        )}

      {/* R10 (session 107) — My Booth tab retired from BottomNav.
          R1 walk (session 113) — Booth tab restored as role-conditional
          (vendor + admin only) per BottomNav design log. /my-shelf is
          the destination, so highlight active="booth". */}
      <BottomNav active="booth" flaggedCount={bookmarkCount} />

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

      {/* Wave 1 Task 4 — vendor self-edit booth name. Vendor mode renders
          display_name only; submit hits /api/vendor/profile (requireAuth +
          ownership). Arc 7.4.5 (session 148) — admin impersonation mounts
          the same vendor-mode sheet for parity; /api/vendor/profile PATCH
          ownership check now bypasses for admin acting on another vendor
          (audit event records acting_as_admin). */}
      {showEditSheet && activeVendor && (
        <EditBoothSheet
          vendor={activeVendor}
          mode="vendor"
          onClose={() => setShowEditSheet(false)}
          onUpdated={(updated) => {
            setActiveVendor(updated);
            setVendorList(list =>
              list.map(v => v.id === updated.id ? updated : v),
            );
            // Keep the heroImageUrl render state in sync so the BoothHero
            // behind the sheet reflects hero ops while the sheet stays open.
            setHeroImageUrl(updated.hero_image_url ?? null);
            setHeroKey(k => k + 1);
          }}
        />
      )}

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
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          entity={{ kind: "booth", vendor: activeVendor, mall }}
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
