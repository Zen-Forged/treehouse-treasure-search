// app/admin/page.tsx
// Admin — gated to NEXT_PUBLIC_ADMIN_EMAIL via Supabase Auth session.
// Non-admin or unauth users see a sign-in prompt.
//
// All data access goes through server API routes (authFetch attaches the
// bearer token for server-side requireAdmin gating):
//   GET  /api/admin/posts              — list posts
//   DEL  /api/admin/posts              — delete posts (selected or all)
//   GET  /api/admin/vendor-requests    — list vendor requests
//   POST /api/admin/vendor-requests    — { action: "approve", requestId }
//   POST /api/admin/diagnose-request   — { requestId } → collision picture
//
// Session 7 (2026-04-17) — T3 mobile-first approval polish:
//  - Removed obsolete email template copy flow (Resend SMTP sends on approve)
//  - Approve button sized for 44px iOS thumb-reach minimum
//  - Post-approval toast: structured, durable (6s), bottom-anchored, animated
//
// Session 13 (2026-04-17) — KI-004 resolution + in-mall diagnostic UI:
//  - Inline "Diagnose" link on every pending request row
//  - On approval error: error toast exposes "Diagnose" button + details panel
//  - Diagnosis panel renders collision specifics from /api/admin/diagnose-request
//  - Approve toast surfaces `note` field (e.g. "slug was taken, assigned X-2")
//
// Session 13 fix — toast stacking:
//  - zIndex: 100 → 9999 (defensive against any future high-z content)
//  - Solid opaque backgrounds (was rgba with ~0.08 alpha, caused bleed-through)
//  - Stronger shadow for clear elevation over content
//  - Kept inline render (NOT portaled — portal + AnimatePresence introduced
//    a regression where Approve clicks did not fire)

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, RefreshCw, CheckSquare, Square, AlertTriangle, LogOut, Users, Store, X, Stethoscope, Image as ImageIcon, Upload, Loader as LoaderIcon, MapPin, ChevronDown, BarChart3, Building2 } from "lucide-react";
import { getSession, isAdmin, signOut } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { colors, v1 } from "@/lib/tokens";
import { compressImage } from "@/lib/imageUpload";
import { getSiteSettingUrl, type SiteSettingKey } from "@/lib/siteSettings";
import { getAllMalls } from "@/lib/posts";
import { VendorsTab } from "@/components/admin/VendorsTab";
import RequestsTab from "@/components/admin/RequestsTab";
import type { User } from "@supabase/supabase-js";
import type {
  Mall,
  MallStatus,
  VendorRequest,
  DiagnosisConflict,
  DiagnosisVendorSnapshot,
  DiagnosisAuthUser,
  DiagnosisReport,
} from "@/types/treehouse";

interface AdminPost {
  id:         string;
  title:      string;
  status:     string;
  image_url:  string | null;
  vendor_id:  string;
  created_at: string;
  vendor?: { id: string; display_name: string; booth_number: string | null };
}

// VendorRequest + DiagnosisReport interfaces relocated to @/types/treehouse
// in session 136 Arc 2 commit 5 (per docs/admin-requests-tab-design.md D15)
// so the extracted <RequestsTab> can share them. Imports added at top of file.

type Toast =
  | { kind: "success"; name: string; email: string; booth: string | null; mall: string | null; warning?: string; note?: string }
  | { kind: "deny-success"; name: string; warning?: "email_failed" }  // session 136 D11 — soft email sent, optional email_failed warning if Resend hiccuped post-flip
  | { kind: "error"; message: string; requestId?: string; diagnosis?: string; conflict?: DiagnosisConflict }
  | { kind: "mall-status"; name: string; status: MallStatus; firstActivation: boolean };

const TOAST_DURATION_MS_SUCCESS       = 6000;
const TOAST_DURATION_MS_ERROR         = 12000; // errors linger longer so admin can act
const TOAST_DURATION_MS_MALL_ACTIVATE = 8000;  // activation lingers longer per design spec
const TOAST_DURATION_MS_MALL_STATUS   = 5000;  // draft / coming-soon transitions

// R4c — collapse the Draft group by default when it has more than 5 rows.
// Threshold per design record; tunable as the active-mall ratio changes.
const DRAFT_COLLAPSE_THRESHOLD = 5;

// R3 — Events tab types + constants.
interface EventRow {
  id:          string;
  event_type:  string;
  user_id:     string | null;
  session_id:  string | null;
  payload:     Record<string, unknown>;
  occurred_at: string;
}
type EventFilter =
  | "all"
  | "saves"
  | "views"
  | "shares"
  | "bookmarks"      // R3 v1.1 — UI bucket: booth_bookmarked + booth_unbookmarked
  | "tag_flow"       // R3 v1.1 — UI bucket: tag_extracted + tag_skipped
  | "find_shared"    // R3 v1.1 — concrete event type
  | "filter_applied"
  | "vendor_request_submitted"
  | "vendor_request_approved"
  | "mall_activated"
  | "mall_deactivated";
const EVENTS_PAGE_SIZE = 50;

export default function AdminPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<User | null>(null);
  const [authReady,  setAuthReady]  = useState(false);
  const [posts,      setPosts]      = useState<AdminPost[]>([]);
  const [requests,   setRequests]   = useState<VendorRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [busy,       setBusy]       = useState(false);
  const [requestBusy, setRequestBusy] = useState<Set<string>>(new Set());
  const [result,     setResult]     = useState<string | null>(null);
  const [toast,      setToast]      = useState<Toast | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "requests" | "banners" | "malls" | "events" | "vendors">("requests");

  // Diagnosis panel — per-request loading + result state
  const [diagnosisBusy,    setDiagnosisBusy]    = useState<Set<string>>(new Set());
  const [diagnosisReports, setDiagnosisReports] = useState<Record<string, DiagnosisReport>>({});
  const [diagnosisErrors,  setDiagnosisErrors]  = useState<Record<string, string>>({});

  // T4b (session 37) — Add Booth primitive state
  // Mall list is loaded once alongside session resolution. The add-booth sheet
  // on /shelves previously loaded malls every page mount; folding the capability
  // into /admin means malls load only when an admin actually lands here.
  const [malls,         setMalls]         = useState<Mall[]>([]);
  const [mallsLoading,  setMallsLoading]  = useState(false);
  // addBoothOpen state retired Arc 4 Arc 3.2 — AddBoothInline removed from
  // Requests tab; pre-seed surface lives on the new Vendors tab (D6/D9).

  // R4c — Malls tab state
  const [expandedMallId, setExpandedMallId] = useState<string | null>(null);
  const [mallBusy,       setMallBusy]       = useState<Set<string>>(new Set());
  const [draftsOpen,     setDraftsOpen]     = useState(false);

  // R3 — Events tab state
  const [events,           setEvents]           = useState<EventRow[]>([]);
  const [eventCounts,      setEventCounts]      = useState<{ last24h: number; last7d: number; all: number }>({ last24h: 0, last7d: 0, all: 0 });
  const [eventsLoading,    setEventsLoading]    = useState(false);
  const [eventFilter,      setEventFilter]      = useState<EventFilter>("all");
  const [expandedEventId,  setExpandedEventId]  = useState<string | null>(null);
  const [eventsHasMore,    setEventsHasMore]    = useState(false);
  const [showMoreFilters,  setShowMoreFilters]  = useState(false);

  // R3 stale-data diag (session 73) — fires /api/admin/events-raw alongside
  // every Events-tab fetch and stashes its first_occurred_at for side-by-side
  // comparison against the library route. Strip out once R3 is closed (or
  // when admin Events tab retires per Q-014 / Metabase migration).
  const [rawProbe, setRawProbe] = useState<{
    libFirst:  string | null;
    rawFirst:  string | null;
    rawFetchMs: number | null;
    rawRows:   number | null;
    libRows:   number | null;
    error:     string | null;
  } | null>(null);

  useEffect(() => {
    getSession().then(s => {
      setUser(s?.user ?? null);
      setAuthReady(true);
      if (s?.user && isAdmin(s.user)) {
        fetchPosts();
        fetchVendorRequests();
        fetchMalls();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // R3 — refetch events whenever the filter chip changes, or when the
  // Events tab becomes active. Initial-mount fetch is gated on admin-auth
  // resolution (we don't want to call authFetch before the bearer token
  // exists), so we only fire here once the user is set + admin.
  useEffect(() => {
    if (!user || !isAdmin(user)) return;
    if (activeTab !== "events") return;
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, eventFilter]);

  // Auto-dismiss toast (duration depends on kind)
  useEffect(() => {
    if (!toast) return;
    const duration =
      toast.kind === "error"
        ? TOAST_DURATION_MS_ERROR
        : toast.kind === "mall-status"
          ? toast.firstActivation
            ? TOAST_DURATION_MS_MALL_ACTIVATE
            : TOAST_DURATION_MS_MALL_STATUS
          : TOAST_DURATION_MS_SUCCESS;
    const t = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(t);
  }, [toast]);

  // R4c — load malls (idempotent; callable from tab refresh button)
  async function fetchMalls() {
    setMallsLoading(true);
    const rows = await getAllMalls();
    setMalls(rows);
    // Auto-open drafts section if it's small enough to just show inline.
    const draftCount = rows.filter(m => m.status === "draft").length;
    setDraftsOpen(draftCount > 0 && draftCount <= DRAFT_COLLAPSE_THRESHOLD);
    setMallsLoading(false);
  }

  // R3 — load events page from /api/admin/events.
  // append=true tacks results onto existing list (Load more); append=false
  // replaces it (filter change / refresh). Counts are returned alongside the
  // page payload so we don't need a separate round-trip.
  async function fetchEvents(opts: { append?: boolean } = {}) {
    setEventsLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventFilter !== "all") params.set("event_type", eventFilter);
      params.set("limit", String(EVENTS_PAGE_SIZE));
      if (opts.append && events.length > 0) {
        params.set("before", events[events.length - 1]!.occurred_at);
      }

      // R3 stale-data diag (session 73) — fire library route + raw probe in
      // parallel so a side-by-side diff is visible in the UI for every fetch.
      // Pass the active event_type filter to the raw probe so the comparison
      // is apples-to-apples (without parity, filtered chips would always
      // show huge bogus deltas vs the unfiltered raw).
      const rawParams = new URLSearchParams();
      if (eventFilter !== "all") rawParams.set("event_type", eventFilter);
      const [res, rawRes] = await Promise.all([
        authFetch(`/api/admin/events?${params.toString()}`),
        authFetch(`/api/admin/events-raw?${rawParams.toString()}`).catch(err => {
          console.error("raw probe fetch error:", err);
          return null;
        }),
      ]);

      const json = await res.json();
      if (!res.ok) {
        setToast({ kind: "error", message: json.error || "Failed to load events" });
        if (!opts.append) setEvents([]);
      } else {
        const incoming = (json.events ?? []) as EventRow[];
        setEvents(opts.append ? [...events, ...incoming] : incoming);
        setEventCounts(json.counts ?? { last24h: 0, last7d: 0, all: 0 });
        setEventsHasMore(incoming.length === EVENTS_PAGE_SIZE);
      }

      // Populate the diag strip — only on non-append fetches (the comparison
      // is meaningful on the default-page query, not on Load-more pagination).
      if (!opts.append) {
        const libFirst = (json.events?.[0]?.occurred_at as string | undefined) ?? null;
        const libRows  = json.events?.length ?? 0;
        if (rawRes && rawRes.ok) {
          const rawJson  = await rawRes.json();
          setRawProbe({
            libFirst,
            rawFirst:   rawJson.first_occurred_at ?? null,
            rawFetchMs: rawJson.fetch_ms ?? null,
            rawRows:    rawJson.rows_returned ?? 0,
            libRows,
            error:      null,
          });
        } else {
          setRawProbe({
            libFirst,
            rawFirst:   null,
            rawFetchMs: null,
            rawRows:    null,
            libRows,
            error:      rawRes ? `raw probe HTTP ${rawRes.status}` : "raw probe fetch failed",
          });
        }
      }
    } catch (err) {
      console.error("fetchEvents error:", err);
      setToast({ kind: "error", message: "Failed to load events" });
      if (!opts.append) setEvents([]);
    }
    setEventsLoading(false);
  }

  async function updateMallStatus(mall: Mall, nextStatus: MallStatus) {
    if (mallBusy.has(mall.id)) return;
    if (mall.status === nextStatus) { setExpandedMallId(null); return; }

    // Optimistic update
    const wasFirstActivation = nextStatus === "active" && !mall.activated_at;
    const optimistic: Mall = {
      ...mall,
      status: nextStatus,
      activated_at: wasFirstActivation ? new Date().toISOString() : mall.activated_at,
    };
    setMalls(prev => prev.map(m => (m.id === mall.id ? optimistic : m)));
    setMallBusy(prev => { const next = new Set(prev); next.add(mall.id); return next; });

    try {
      const res = await authFetch("/api/admin/malls", {
        method: "PATCH",
        body: JSON.stringify({ id: mall.id, status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        // Revert optimistic update
        setMalls(prev => prev.map(m => (m.id === mall.id ? mall : m)));
        setToast({ kind: "error", message: json.error || "Failed to update location status." });
      } else {
        // Replace with server-canonical row (picks up activated_at stamp)
        setMalls(prev => prev.map(m => (m.id === mall.id ? (json.mall as Mall) : m)));
        setToast({
          kind: "mall-status",
          name: mall.name,
          status: nextStatus,
          firstActivation: wasFirstActivation,
        });
        setExpandedMallId(null);
      }
    } catch (err) {
      setMalls(prev => prev.map(m => (m.id === mall.id ? mall : m)));
      setToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to update location status.",
      });
    }

    setMallBusy(prev => { const next = new Set(prev); next.delete(mall.id); return next; });
  }

  async function fetchPosts() {
    setLoading(true);
    setResult(null);
    try {
      const res  = await authFetch("/api/admin/posts");
      const json = await res.json();
      if (!res.ok) {
        setResult(`Error: ${json.error || "Failed to load posts"}`);
        setPosts([]);
      } else {
        setPosts(json.posts ?? []);
      }
    } catch (err) {
      console.error("fetchPosts error:", err);
      setResult("Error: Failed to load posts");
      setPosts([]);
    }
    setLoading(false);
  }

  async function fetchVendorRequests() {
    setRequestsLoading(true);
    try {
      // Session 136 Arc 2 commit 6 — fetch ?status=all so the chip strip in
      // <RequestsTab> can render counts for every status (pending / approved
      // / denied / all). RequestsTab filters client-side per D3 single-select.
      // Server-side ?status= filter remains supported for future/external
      // consumers; admin UI just doesn't use it (one fetch, four chips).
      const res  = await authFetch("/api/admin/vendor-requests?status=all");
      const json = await res.json();
      if (!res.ok) {
        setToast({ kind: "error", message: json.error || "Failed to load vendor requests" });
        setRequests([]);
      } else {
        setRequests(json.requests ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch vendor requests:", err);
      setToast({ kind: "error", message: "Failed to load vendor requests" });
      setRequests([]);
    }
    setRequestsLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleAll() {
    setSelected(selected.size === posts.length ? new Set() : new Set(posts.map(p => p.id)));
  }

  async function deleteSelected() {
    if (selected.size === 0 || busy) return;
    setBusy(true); setResult(null);
    const res  = await authFetch("/api/admin/posts", {
      method: "DELETE",
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    const json = await res.json();
    if (json.ok) {
      setResult(`✓ Deleted ${json.postsDeleted} post${json.postsDeleted !== 1 ? "s" : ""} + ${json.storageDeleted} image${json.storageDeleted !== 1 ? "s" : ""}`);
      setSelected(new Set());
      await fetchPosts();
    } else { setResult(`Error: ${json.error}`); }
    setBusy(false);
  }

  async function deleteAll() {
    if (busy) return;
    setBusy(true); setResult(null); setConfirmAll(false);
    const res  = await authFetch("/api/admin/posts", {
      method: "DELETE",
      body: JSON.stringify({ deleteAll: true }),
    });
    const json = await res.json();
    if (json.ok) {
      setResult(`✓ Nuked ${json.postsDeleted} post${json.postsDeleted !== 1 ? "s" : ""} + ${json.storageDeleted} image${json.storageDeleted !== 1 ? "s" : ""}`);
      setSelected(new Set());
      await fetchPosts();
    } else { setResult(`Error: ${json.error}`); }
    setBusy(false);
  }

  async function approveVendorRequest(request: VendorRequest) {
    if (requestBusy.has(request.id)) return;
    setRequestBusy(prev => { const next = new Set(prev); next.add(request.id); return next; });

    try {
      const res = await authFetch("/api/admin/vendor-requests", {
        method: "POST",
        body: JSON.stringify({ action: "approve", requestId: request.id }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setToast({
          kind: "error",
          message: `Couldn't approve ${request.name}: ${json.error || "unknown error"}`,
          requestId: request.id,
          diagnosis: json.diagnosis,
          conflict: json.conflict,
        });
        setRequestBusy(prev => { const next = new Set(prev); next.delete(request.id); return next; });
        return;
      }

      setToast({
        kind: "success",
        name: request.name,
        email: request.email,
        booth: request.booth_number,
        mall: request.mall_name,
        warning: json.warning,
        note: json.note,
      });

      await fetchVendorRequests();
    } catch (err) {
      console.error("Vendor approval error:", err);
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Unknown error", requestId: request.id });
    }

    setRequestBusy(prev => { const next = new Set(prev); next.delete(request.id); return next; });
  }

  async function denyVendorRequest(request: VendorRequest, denialReason: string) {
    if (requestBusy.has(request.id)) return;
    setRequestBusy(prev => { const next = new Set(prev); next.add(request.id); return next; });

    try {
      const res = await authFetch("/api/admin/vendor-requests", {
        method: "POST",
        body: JSON.stringify({
          action: "deny",
          requestId: request.id,
          denial_reason: denialReason,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setToast({
          kind: "error",
          message: `Couldn't deny ${request.name}: ${json.error || "unknown error"}`,
          requestId: request.id,
          diagnosis: json.diagnosis,
        });
        setRequestBusy(prev => { const next = new Set(prev); next.delete(request.id); return next; });
        return;
      }

      // D11 — success toast variant. `warning: "email_failed"` triggers
      // the amber email-fail-after-status-flip variant (status was saved
      // but Resend didn't send; vendor not notified).
      const firstName =
        (request.first_name?.trim()) ||
        request.name.split(/\s+/)[0] ||
        request.name;

      setToast({
        kind: "deny-success",
        name: firstName,
        warning: json.warning === "email_failed" ? "email_failed" : undefined,
      });

      await fetchVendorRequests();
    } catch (err) {
      console.error("Vendor deny error:", err);
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Unknown error", requestId: request.id });
    }

    setRequestBusy(prev => { const next = new Set(prev); next.delete(request.id); return next; });
  }

  async function diagnoseRequest(requestId: string) {
    if (diagnosisBusy.has(requestId)) return;
    setDiagnosisBusy(prev => { const next = new Set(prev); next.add(requestId); return next; });
    setDiagnosisErrors(prev => { const next = { ...prev }; delete next[requestId]; return next; });

    try {
      const res = await authFetch("/api/admin/diagnose-request", {
        method: "POST",
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();

      if (!res.ok) {
        setDiagnosisErrors(prev => ({ ...prev, [requestId]: json.error || "Diagnosis failed" }));
      } else {
        setDiagnosisReports(prev => ({ ...prev, [requestId]: json }));
      }
    } catch (err) {
      setDiagnosisErrors(prev => ({
        ...prev,
        [requestId]: err instanceof Error ? err.message : "Diagnosis failed",
      }));
    }

    setDiagnosisBusy(prev => { const next = new Set(prev); next.delete(requestId); return next; });
  }

  function dismissDiagnosis(requestId: string) {
    setDiagnosisReports(prev => { const next = { ...prev }; delete next[requestId]; return next; });
    setDiagnosisErrors(prev => { const next = { ...prev }; delete next[requestId]; return next; });
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (!authReady) return null;

  // ── Not admin — show gate ──
  if (!user || !isAdmin(user)) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center", gap: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>Admin access only</div>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.65, margin: 0 }}>
          {user ? "Your account doesn't have admin access." : "Sign in with your admin account to continue."}
        </p>
        <button onClick={() => router.push(user ? "/" : "/admin/login")}
          style={{ padding: "11px 24px", borderRadius: 24, background: colors.green, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "Georgia, serif" }}>
          {user ? "Back to feed" : "Sign in"}
        </button>
        {user && (
          <button onClick={handleSignOut} style={{ fontSize: 11, color: colors.textFaint, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Sign out
          </button>
        )}
      </div>
    );
  }

  const allSelected = posts.length > 0 && selected.size === posts.length;
  const pendingRequests = requests.filter(r => r.status === "pending");

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: "max(20px, env(safe-area-inset-top, 20px)) 20px 16px", background: colors.bg, borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 3 }}>Treehouse</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>Admin</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => router.push("/")} style={{ fontSize: 12, color: colors.green, background: "none", border: "none", cursor: "pointer" }}>← Feed</button>
          <button onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, background: "none", border: `1px solid ${colors.border}`, cursor: "pointer", fontSize: 11, color: colors.textFaint }}>
            <LogOut size={10} /> Sign out
          </button>
        </div>
      </div>

      {/* Admin identity */}
      <div style={{ margin: "16px 20px 0", padding: "10px 14px", borderRadius: 10, background: colors.greenLight, border: `1px solid ${colors.greenBorder}` }}>
        <div style={{ fontSize: 9, color: colors.green, textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 2 }}>Signed in as admin</div>
        <div style={{ fontSize: 12, color: colors.textPrimary }}>{user.email}</div>
      </div>

      {/* Tab switcher — Arc 4 Arc 3.1: 6 tabs (Requests / Posts / Banners /
          Locations / Events / Vendors). Vendors = D1 new slot, vendors-table
          management surface (force-unlink, relink, force-delete, invite, edit).
          Stacked-icon-above-label layout (R3) keeps 6 cells fitting 375px;
          tighter than 5 but readable. */}
      <div style={{ margin: "20px 20px 0", display: "flex", gap: 4 }}>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            flex: 1, padding: "8px 2px", borderRadius: 10, fontSize: 10, fontWeight: 500,
            background: activeTab === "requests" ? colors.green : "none",
            color: activeTab === "requests" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "requests" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          }}>
          <Users size={13} />
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            Requests
            {pendingRequests.length > 0 && (
              <span style={{
                background: activeTab === "requests" ? "rgba(255,255,255,0.25)" : colors.green,
                color: "#fff",
                padding: "1px 5px", borderRadius: 8, fontSize: 9, fontWeight: 700,
              }}>
                {pendingRequests.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            flex: 1, padding: "8px 2px", borderRadius: 10, fontSize: 10, fontWeight: 500,
            background: activeTab === "posts" ? colors.green : "none",
            color: activeTab === "posts" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "posts" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          }}>
          <Store size={13} /> Posts
        </button>
        <button
          onClick={() => setActiveTab("banners")}
          style={{
            flex: 1, padding: "8px 2px", borderRadius: 10, fontSize: 10, fontWeight: 500,
            background: activeTab === "banners" ? colors.green : "none",
            color: activeTab === "banners" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "banners" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          }}>
          <ImageIcon size={13} /> Banners
        </button>
        <button
          onClick={() => setActiveTab("malls")}
          style={{
            flex: 1, padding: "8px 2px", borderRadius: 10, fontSize: 10, fontWeight: 500,
            background: activeTab === "malls" ? colors.green : "none",
            color: activeTab === "malls" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "malls" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          }}>
          <MapPin size={13} /> Locations
        </button>
        <button
          onClick={() => setActiveTab("events")}
          style={{
            flex: 1, padding: "8px 2px", borderRadius: 10, fontSize: 10, fontWeight: 500,
            background: activeTab === "events" ? colors.green : "none",
            color: activeTab === "events" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "events" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          }}>
          <BarChart3 size={13} /> Events
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          style={{
            flex: 1, padding: "8px 2px", borderRadius: 10, fontSize: 10, fontWeight: 500,
            background: activeTab === "vendors" ? colors.green : "none",
            color: activeTab === "vendors" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "vendors" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          }}>
          <Building2 size={13} /> Vendors
        </button>
      </div>

      {/* Vendor Requests Tab — extracted to <RequestsTab> in session 136
          Arc 2 commit 5. Pure refactor; all state + handlers stay here. */}
      {activeTab === "requests" && (
        <RequestsTab
          requests={requests}
          requestsLoading={requestsLoading}
          requestBusy={requestBusy}
          diagnosisBusy={diagnosisBusy}
          diagnosisReports={diagnosisReports}
          diagnosisErrors={diagnosisErrors}
          onApprove={approveVendorRequest}
          onDeny={denyVendorRequest}
          onDiagnose={diagnoseRequest}
          onDismissDiagnosis={dismissDiagnosis}
          onRefresh={fetchVendorRequests}
          renderDiagnosisPanel={(report) => <DiagnosisPanel report={report} />}
        />
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div style={{ margin: "24px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px" }}>
              All posts ({posts.length})
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={fetchPosts} disabled={loading || busy}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted }}>
                <RefreshCw size={11} style={{ opacity: loading ? 0.4 : 1 }} /> Refresh
              </button>
              {posts.length > 0 && (
                <button onClick={toggleAll}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMid }}>
                  {allSelected ? <CheckSquare size={13} style={{ color: colors.green }} /> : <Square size={13} />}
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>
          </div>

          {result && (
            <div style={{ padding: "10px 12px", borderRadius: 9, marginBottom: 12, background: result.startsWith("✓") ? colors.greenLight : colors.redBg, border: `1px solid ${result.startsWith("✓") ? colors.greenBorder : colors.redBorder}`, fontSize: 12, color: result.startsWith("✓") ? colors.green : colors.red }}>
              {result}
            </div>
          )}

          {loading ? (
            <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center" }}>Loading…</div>
          ) : posts.length === 0 ? (
            <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center", fontStyle: "italic", fontFamily: "Georgia, serif" }}>No posts in database.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {posts.map(post => {
                const isSel = selected.has(post.id);
                return (
                  <div key={post.id} onClick={() => toggleSelect(post.id)}
                    style={{ background: isSel ? colors.greenLight : colors.surface, border: `1px solid ${isSel ? colors.greenBorder : colors.border}`, borderRadius: 11, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "background 0.15s, border-color 0.15s" }}>
                    {isSel ? <CheckSquare size={15} style={{ color: colors.green, flexShrink: 0 }} /> : <Square size={15} style={{ color: colors.textFaint, flexShrink: 0 }} />}
                    {post.image_url && <img src={post.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: colors.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>{post.vendor?.display_name ?? "no vendor"} · {post.status}</div>
                      <div style={{ fontSize: 9, color: colors.textFaint, fontFamily: "monospace", marginTop: 1 }}>vendor_id: {post.vendor_id?.slice(0, 12)}…</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Banners Tab — v1.1l: admin-editable featured banner images */}
      {activeTab === "banners" && (
        <div style={{ margin: "24px 20px 0" }}>
          <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>
            Featured banner images
          </div>
          <p style={{
            fontSize: 12, color: colors.textMid, lineHeight: 1.55, marginBottom: 20,
            fontFamily: "Georgia, serif", fontStyle: "italic",
          }}>
            Upload the hero images shown on the Home feed and the Find Map. Each image replaces the previous one. Leave blank to hide the banner entirely.
          </p>

          <FeaturedBannerEditor
            settingKey="featured_find_image_url"
            label="Home — Featured Find"
            helper="Shown between the masthead and the feed on the Home page. Recommended: wide landscape photo, 1600×900 or larger."
          />

          <div style={{ height: 18 }} />

          <FeaturedBannerEditor
            settingKey="find_map_banner_image_url"
            label="Find Map — Hero banner"
            helper="Shown at the top of the Find Map. The title “Find Map” overlays the image. Recommended: 1600×720 or larger; darker/quieter photos read better under white overlay text."
          />
        </div>
      )}

      {/* Malls Tab — R4c session 57 */}
      {activeTab === "malls" && (
        <MallsTab
          malls={malls}
          loading={mallsLoading}
          onRefresh={fetchMalls}
          expandedMallId={expandedMallId}
          onToggleRow={(id) => setExpandedMallId(prev => prev === id ? null : id)}
          mallBusy={mallBusy}
          onUpdateStatus={updateMallStatus}
          draftsOpen={draftsOpen}
          onToggleDrafts={() => setDraftsOpen(v => !v)}
        />
      )}

      {/* Events Tab — R3 session 58 */}
      {activeTab === "events" && (
        <EventsTab
          events={events}
          counts={eventCounts}
          loading={eventsLoading}
          filter={eventFilter}
          onFilterChange={setEventFilter}
          showMoreFilters={showMoreFilters}
          onToggleMoreFilters={() => setShowMoreFilters(v => !v)}
          onRefresh={() => fetchEvents()}
          expandedEventId={expandedEventId}
          onToggleRow={(id) => setExpandedEventId(prev => prev === id ? null : id)}
          hasMore={eventsHasMore}
          onLoadMore={() => fetchEvents({ append: true })}
          rawProbe={rawProbe}
        />
      )}

      {/* Arc 4 Arc 3.1 — Vendors tab. Owns its own fetch + state lifecycle.
          /vendors-test smoke route is now redundant; retire candidate. */}
      {activeTab === "vendors" && (
        <div style={{ marginTop: 24 }}>
          <VendorsTab />
        </div>
      )}

      {/* Action bar - only show for posts tab */}
      {activeTab === "posts" && (selected.size > 0 || posts.length > 0) && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: colors.header, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: `1px solid ${colors.border}`, padding: "12px 20px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))", display: "flex", gap: 10 }}>
          {selected.size > 0 && (
            <button onClick={deleteSelected} disabled={busy}
              style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: colors.red, color: "#fff", border: "none", cursor: "pointer", opacity: busy ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Trash2 size={13} /> Delete {selected.size} selected
            </button>
          )}
          {posts.length > 0 && !confirmAll && (
            <button onClick={() => setConfirmAll(true)} disabled={busy}
              style={{ flex: selected.size > 0 ? 0 : 1, padding: "11px 14px", borderRadius: 10, fontSize: 13, background: "none", color: colors.red, border: `1px solid ${colors.redBorder}`, cursor: "pointer", opacity: busy ? 0.5 : 1, whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <AlertTriangle size={13} /> Nuke all
            </button>
          )}
          {confirmAll && (
            <button onClick={deleteAll} disabled={busy}
              style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: colors.red, color: "#fff", border: "none", cursor: "pointer", opacity: busy ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Trash2 size={13} /> {busy ? "Deleting…" : "Confirm — delete ALL posts + images"}
            </button>
          )}
        </div>
      )}

      {/* Approval toast — wrapper-div pattern (KI-002, session 9).
          Session 13 fixes: zIndex: 100 → 9999 defensively, solid opaque
          backgrounds (was rgba 0.08 alpha which caused bleed-through), and
          stronger shadow for elevation clarity. */}
      <AnimatePresence>
        {toast && (
          <div
            key="approval-toast-shell"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: "max(20px, env(safe-area-inset-bottom, 20px))",
              zIndex: 9999,
              display: "flex",
              justifyContent: "center",
              padding: "0 16px",
              pointerEvents: "none",
            }}
          >
            <motion.div
              key="approval-toast"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={() => setToast(null)}
              role="status"
              aria-live="polite"
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: 398,
                background: toast.kind === "error" ? "#fff" : "#f0ede6",
                border: `1px solid ${toast.kind === "error" ? colors.redBorder : colors.greenBorder}`,
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 10px 32px rgba(26,26,24,0.18)",
                cursor: "pointer",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.kind === "success" ? (
                <>
                  <div style={{
                    fontSize: 9, color: colors.green, textTransform: "uppercase",
                    letterSpacing: "1.8px", marginBottom: 4, fontWeight: 600
                  }}>
                    ✓ Approved · ready to sign in
                  </div>
                  <div style={{
                    fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600,
                    color: colors.textPrimary, marginBottom: 2
                  }}>
                    {toast.name}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMid, marginBottom: 2 }}>
                    {toast.email}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>
                    {toast.booth ? `Booth ${toast.booth}` : "No booth"} · {toast.mall || "No location"}
                  </div>
                  {toast.note && (
                    <div style={{
                      fontSize: 11, color: colors.textMid, marginTop: 6,
                      fontStyle: "italic"
                    }}>
                      ℹ️ {toast.note}
                    </div>
                  )}
                  {toast.warning && (
                    <div style={{
                      fontSize: 11, color: colors.red, marginTop: 6,
                      fontStyle: "italic"
                    }}>
                      ⚠️ {toast.warning}
                    </div>
                  )}
                </>
              ) : toast.kind === "deny-success" ? (
                <>
                  <div style={{
                    fontSize: 9,
                    color: toast.warning === "email_failed" ? "#b6843a" : colors.green,
                    textTransform: "uppercase",
                    letterSpacing: "1.8px", marginBottom: 4, fontWeight: 600
                  }}>
                    {toast.warning === "email_failed"
                      ? "⚠️ Denied · email failed"
                      : "✓ Denied · soft email sent"}
                  </div>
                  <div style={{
                    fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600,
                    color: colors.textPrimary, marginBottom: 2
                  }}>
                    {toast.name}
                  </div>
                  {toast.warning === "email_failed" && (
                    <div style={{
                      fontSize: 11, color: colors.textMid, marginTop: 4,
                      fontStyle: "italic", lineHeight: 1.5,
                    }}>
                      Status saved but email didn't send. Vendor not notified.
                    </div>
                  )}
                </>
              ) : toast.kind === "mall-status" ? (
                <>
                  <div style={{
                    fontSize: 9, color: colors.green, textTransform: "uppercase",
                    letterSpacing: "1.8px", marginBottom: 4, fontWeight: 600
                  }}>
                    {toast.firstActivation
                      ? "✓ Activated · now live to shoppers"
                      : `✓ ${toast.name} → ${STATUS_LABEL[toast.status]}`}
                  </div>
                  <div style={{
                    fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600,
                    color: colors.textPrimary, marginBottom: 2
                  }}>
                    {toast.name}
                  </div>
                  {toast.firstActivation && (
                    <div style={{
                      fontSize: 11, color: colors.textMid, marginTop: 2,
                      fontStyle: "italic",
                    }}>
                      activated_at set to today · this mall is now selectable in the shopper feed picker and vendor-request dropdown.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: 9, color: colors.red, textTransform: "uppercase",
                    letterSpacing: "1.8px", marginBottom: 4, fontWeight: 600
                  }}>
                    {toast.diagnosis ? `Error · ${toast.diagnosis}` : "Error"}
                  </div>
                  <div style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 1.5 }}>
                    {toast.message}
                  </div>
                  {toast.conflict && (
                    <div style={{
                      marginTop: 6, padding: "6px 8px", borderRadius: 6,
                      background: "rgba(139,32,32,0.04)",
                      fontSize: 10, color: colors.textMid, fontFamily: "monospace",
                      lineHeight: 1.5,
                    }}>
                      <div>Existing: {toast.conflict.display_name}</div>
                      <div>Booth: {toast.conflict.booth_number ?? "(none)"}</div>
                      <div>Slug: {toast.conflict.slug}</div>
                      <div>Linked: {toast.conflict.user_id ? "yes" : "no"}</div>
                    </div>
                  )}
                  {toast.requestId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rid = toast.requestId!;
                        setToast(null);
                        diagnoseRequest(rid);
                      }}
                      style={{
                        marginTop: 10, padding: "6px 12px", borderRadius: 6,
                        background: colors.red, color: "#fff", border: "none",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                      <Stethoscope size={11} /> Run full diagnosis
                    </button>
                  )}
                </>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setToast(null); }}
              aria-label="Dismiss"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 4, marginTop: -2, marginRight: -4,
                color: toast.kind === "error" ? colors.red : colors.green,
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── R4c — Mall status labels + pill renderer ─────────────────────────────────

const STATUS_LABEL: Record<MallStatus, string> = {
  draft:       "Draft",
  coming_soon: "Coming soon",
  active:      "Active",
};

function StatusPill({ status }: { status: MallStatus }) {
  const style: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
    textTransform: "uppercase", letterSpacing: "0.9px", whiteSpace: "nowrap",
    border: "1px solid transparent",
  };
  if (status === "active") {
    return <span style={{ ...style, background: colors.green, color: "#fff", borderColor: colors.green }}>{STATUS_LABEL.active}</span>;
  }
  if (status === "coming_soon") {
    return <span style={{ ...style, background: v1.amberBg, color: v1.amber, borderColor: v1.amberBorder }}>{STATUS_LABEL.coming_soon}</span>;
  }
  return <span style={{ ...style, background: "rgba(42,26,10,0.05)", color: colors.textMuted, borderColor: colors.border }}>{STATUS_LABEL.draft}</span>;
}

function formatActivatedDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch { return null; }
}

// ── R4c — Malls tab ───────────────────────────────────────────────────────────

function MallsTab({
  malls,
  loading,
  onRefresh,
  expandedMallId,
  onToggleRow,
  mallBusy,
  onUpdateStatus,
  draftsOpen,
  onToggleDrafts,
}: {
  malls:          Mall[];
  loading:        boolean;
  onRefresh:      () => void;
  expandedMallId: string | null;
  onToggleRow:    (id: string) => void;
  mallBusy:       Set<string>;
  onUpdateStatus: (mall: Mall, status: MallStatus) => void;
  draftsOpen:     boolean;
  onToggleDrafts: () => void;
}) {
  const active      = malls.filter(m => m.status === "active");
  const comingSoon  = malls.filter(m => m.status === "coming_soon");
  const drafts      = malls.filter(m => m.status === "draft");

  return (
    <div style={{ margin: "24px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px" }}>
          Malls ({malls.length})
        </div>
        <button onClick={onRefresh} disabled={loading}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted }}>
          <RefreshCw size={11} style={{ opacity: loading ? 0.4 : 1 }} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center" }}>
          Loading malls…
        </div>
      ) : malls.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          No malls in database.
        </div>
      ) : (
        <>
          {/* Active */}
          <MallGroupHead label="Active" count={active.length} tone="active" />
          {active.length === 0 ? (
            <MallGroupEmpty>No mall is active yet. Flip a Draft or Coming soon to &ldquo;Active&rdquo; to surface it to shoppers.</MallGroupEmpty>
          ) : (
            active.map(mall => (
              <MallRow
                key={mall.id}
                mall={mall}
                tone="active"
                expanded={expandedMallId === mall.id}
                busy={mallBusy.has(mall.id)}
                onToggle={() => onToggleRow(mall.id)}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}

          {/* Coming soon */}
          <MallGroupHead label="Coming soon" count={comingSoon.length} tone="coming_soon" style={{ marginTop: 20 }} />
          {comingSoon.length === 0 ? (
            <MallGroupEmpty>Empty.</MallGroupEmpty>
          ) : (
            comingSoon.map(mall => (
              <MallRow
                key={mall.id}
                mall={mall}
                tone="coming_soon"
                expanded={expandedMallId === mall.id}
                busy={mallBusy.has(mall.id)}
                onToggle={() => onToggleRow(mall.id)}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}

          {/* Draft (collapsible) */}
          <MallGroupHead
            label="Draft"
            count={drafts.length}
            tone="draft"
            collapsible
            open={draftsOpen}
            onToggle={onToggleDrafts}
            style={{ marginTop: 20 }}
          />
          {drafts.length === 0 ? (
            <MallGroupEmpty>No drafts.</MallGroupEmpty>
          ) : draftsOpen ? (
            drafts.map(mall => (
              <MallRow
                key={mall.id}
                mall={mall}
                tone="draft"
                expanded={expandedMallId === mall.id}
                busy={mallBusy.has(mall.id)}
                onToggle={() => onToggleRow(mall.id)}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          ) : (
            <div style={{ fontSize: 11, color: colors.textFaint, fontStyle: "italic", fontFamily: "Georgia, serif", padding: "6px 2px 0" }}>
              Tap to expand. Drafts are hidden from shopper pickers and the vendor-request mall dropdown.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── R3 — Events tab ───────────────────────────────────────────────────────────

const EVENT_DOT_COLOR: Record<string, string> = {
  page_viewed:              "#3d4a52",  // slate
  post_saved:               "#1e4d2b",  // green
  post_unsaved:             "#8a7b68",  // draft-gray
  filter_applied:           "#7d8f96",  // slate-faint
  share_sent:               "#8a5a14",  // amber
  vendor_request_submitted: "#1e4d2b",
  vendor_request_approved:  "#1e4d2b",
  mall_activated:           "#1e4d2b",
  mall_deactivated:         "#8a7b68",
  // R3 v1.1 — green for positive engagement, draft-gray for inverse,
  // amber for share / friction signals (matches share_sent convention).
  booth_bookmarked:         "#1e4d2b",
  booth_unbookmarked:       "#8a7b68",
  find_shared:              "#8a5a14",
  tag_extracted:            "#1e4d2b",
  tag_skipped:              "#8a5a14",
};

const FILTER_CHIPS_PRIMARY: { key: EventFilter; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "saves",     label: "Saves" },
  { key: "views",     label: "Views" },
  { key: "shares",    label: "Shares" },
  // R3 v1.1 — booth bookmarks are high-frequency shopper engagement, on
  // par with saves/views/shares. Surfaced as a primary chip (not overflow).
  { key: "bookmarks", label: "Bookmarks" },
];

const FILTER_CHIPS_OVERFLOW: { key: EventFilter; label: string }[] = [
  { key: "filter_applied",           label: "Filters" },
  { key: "find_shared",              label: "Find shares" },
  { key: "tag_flow",                 label: "Tag flow" },
  { key: "vendor_request_submitted", label: "Requests submitted" },
  { key: "vendor_request_approved",  label: "Requests approved" },
  { key: "mall_activated",           label: "Location activated" },
  { key: "mall_deactivated",         label: "Location deactivated" },
];

function formatEventClock(iso: string): string {
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }); }
  catch { return iso.slice(11, 19); }
}

function dayBucketLabel(iso: string): string {
  try {
    const d     = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const that  = new Date(d); that.setHours(0, 0, 0, 0);
    const diff  = Math.round((today.getTime() - that.getTime()) / 86_400_000);
    if (diff === 0) return `Today · ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    if (diff === 1) return `Yesterday · ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  } catch { return iso.slice(0, 10); }
}

function payloadSummary(payload: Record<string, unknown>): string {
  const entries = Object.entries(payload).slice(0, 3);
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => {
      const vs = typeof v === "string" ? v : v === null || v === undefined ? "—" : JSON.stringify(v);
      return `${k}: ${vs.length > 24 ? vs.slice(0, 24) + "…" : vs}`;
    })
    .join(" · ");
}

function EventsTab({
  events, counts, loading, filter, onFilterChange,
  showMoreFilters, onToggleMoreFilters, onRefresh,
  expandedEventId, onToggleRow, hasMore, onLoadMore,
  rawProbe,
}: {
  events:                EventRow[];
  counts:                { last24h: number; last7d: number; all: number };
  loading:               boolean;
  filter:                EventFilter;
  onFilterChange:        (f: EventFilter) => void;
  showMoreFilters:       boolean;
  onToggleMoreFilters:   () => void;
  onRefresh:             () => void;
  expandedEventId:       string | null;
  onToggleRow:           (id: string) => void;
  hasMore:               boolean;
  onLoadMore:            () => void;
  rawProbe:              {
    libFirst:   string | null;
    rawFirst:   string | null;
    rawFetchMs: number | null;
    rawRows:    number | null;
    libRows:    number | null;
    error:      string | null;
  } | null;
}) {
  // Group events by day bucket (Today / Yesterday / Mon · …) for separator chrome.
  const groups: Array<{ label: string; rows: EventRow[] }> = [];
  let lastLabel = "";
  for (const ev of events) {
    const label = dayBucketLabel(ev.occurred_at);
    if (label !== lastLabel) {
      groups.push({ label, rows: [ev] });
      lastLabel = label;
    } else {
      groups[groups.length - 1]!.rows.push(ev);
    }
  }

  // R3 stale-data diag strip (session 73). Renders a small monospace row
  // comparing /api/admin/events (library/supabase-js) against /api/admin/events-raw
  // (bare fetch → PostgREST). Strip out once R3 closes or admin tab retires.
  const probeStrip = (() => {
    if (!rawProbe) return null;
    const fmt = (iso: string | null) => {
      if (!iso) return "—";
      try {
        const d = new Date(iso);
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const mm = String(d.getUTCMinutes()).padStart(2, "0");
        const ss = String(d.getUTCSeconds()).padStart(2, "0");
        return `${hh}:${mm}:${ss}Z`;
      } catch { return iso.slice(11, 19) + "Z"; }
    };
    const diffMs = rawProbe.libFirst && rawProbe.rawFirst
      ? new Date(rawProbe.rawFirst).getTime() - new Date(rawProbe.libFirst).getTime()
      : null;
    const diffLabel = diffMs == null
      ? "—"
      : Math.abs(diffMs) < 5000
        ? "in sync"
        : `${diffMs > 0 ? "raw ahead" : "lib ahead"} ${Math.round(Math.abs(diffMs) / 1000)}s`;
    const diffColor = diffMs == null ? "#7d8f96"
      : Math.abs(diffMs) < 5000 ? "#1e4d2b"
      : Math.abs(diffMs) < 60_000 ? "#8a5a14"
      : "#a13a2c";
    return (
      <div style={{
        background:    "#211f1b",
        color:         "#e0d8c5",
        padding:       "10px 12px",
        borderRadius:  10,
        fontFamily:    "ui-monospace, Menlo, Consolas, monospace",
        fontSize:      10.5,
        lineHeight:    1.5,
        marginBottom:  14,
        border:        `1px solid ${diffColor}`,
      }}>
        <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
          R3 stale-data diag
        </div>
        <div>lib /events: <strong>{fmt(rawProbe.libFirst)}</strong> · {rawProbe.libRows ?? 0} rows</div>
        <div>raw probe:   <strong>{fmt(rawProbe.rawFirst)}</strong> · {rawProbe.rawRows ?? 0} rows{rawProbe.rawFetchMs != null ? ` · ${rawProbe.rawFetchMs}ms` : ""}</div>
        <div style={{ marginTop: 4, color: diffColor }}>
          {rawProbe.error ? `error: ${rawProbe.error}` : `delta: ${diffLabel}`}
        </div>
      </div>
    );
  })();

  return (
    <div style={{ margin: "20px 20px 0", paddingBottom: 80 }}>
      {probeStrip}
      {/* Summary strip — 24h / 7d / all */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <SumCard n={counts.last24h.toLocaleString()} label="Last 24h" />
        <SumCard n={counts.last7d.toLocaleString()}  label="Last 7d" />
        <SumCard n={counts.all.toLocaleString()}     label="All time" />
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {FILTER_CHIPS_PRIMARY.map(c => (
          <FilterChip key={c.key} label={c.label} selected={filter === c.key} onClick={() => onFilterChange(c.key)} />
        ))}
        <FilterChip
          label={showMoreFilters ? "− less" : "+ more"}
          ghost
          selected={false}
          onClick={onToggleMoreFilters}
        />
        {showMoreFilters && FILTER_CHIPS_OVERFLOW.map(c => (
          <FilterChip key={c.key} label={c.label} selected={filter === c.key} onClick={() => onFilterChange(c.key)} />
        ))}
      </div>

      {/* Header row — eyebrow + refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px" }}>
          Stream ({events.length}{hasMore ? "+" : ""})
        </div>
        <button onClick={onRefresh} disabled={loading}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted }}>
          <RefreshCw size={11} style={{ opacity: loading ? 0.4 : 1 }} /> Refresh
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center" }}>
          Loading events…
        </div>
      ) : events.length === 0 ? (
        <div style={{ fontSize: 12, color: colors.textFaint, padding: "20px 4px", fontStyle: "italic", fontFamily: "Georgia, serif", lineHeight: 1.6 }}>
          No events captured yet. Once shoppers start interacting with finds, this stream will populate.
        </div>
      ) : (
        <>
          {groups.map(group => (
            <div key={group.label}>
              <div style={{
                fontSize: 9, color: colors.textFaint, textTransform: "uppercase",
                letterSpacing: "1.6px", fontWeight: 600,
                margin: "16px 0 8px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span>{group.label}</span>
                <span style={{ flex: 1, height: 1, background: colors.border }} />
              </div>
              {group.rows.map(ev => (
                <EventRowView
                  key={ev.id}
                  event={ev}
                  expanded={expandedEventId === ev.id}
                  onToggle={() => onToggleRow(ev.id)}
                />
              ))}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={loading}
              style={{
                marginTop: 14, width: "100%", padding: "10px",
                borderRadius: 10, fontSize: 12, fontWeight: 500,
                background: colors.surface, color: colors.textMid,
                border: `1px solid ${colors.border}`,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SumCard({ n, label }: { n: string; label: string }) {
  return (
    <div style={{
      flex: 1, padding: "10px 8px", borderRadius: 10,
      background: colors.surface, border: `1px solid ${colors.border}`,
      textAlign: "center",
    }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "1.2px", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function FilterChip({
  label, selected, ghost, onClick,
}: {
  label:    string;
  selected: boolean;
  ghost?:   boolean;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 11px", borderRadius: 999,
        fontSize: 11, fontWeight: 500,
        background: selected ? colors.green : (ghost ? "transparent" : colors.surface),
        color:      selected ? "#fff"        : (ghost ? colors.textFaint : colors.textMid),
        border: `1px ${ghost ? "dashed" : "solid"} ${selected ? colors.green : colors.border}`,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function EventRowView({
  event, expanded, onToggle,
}: {
  event:    EventRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const dotColor = EVENT_DOT_COLOR[event.event_type] ?? colors.textMid;

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${expanded ? colors.greenBorder : colors.border}`,
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 6,
        boxShadow: expanded ? "0 4px 18px rgba(30,77,43,0.08)" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "none", border: "none", cursor: "pointer",
          width: "100%", padding: 0, textAlign: "left",
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: dotColor,
          marginTop: 5, flex: "0 0 auto",
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{
              fontFamily: "monospace", fontSize: 11, fontWeight: 600,
              color: colors.textPrimary, letterSpacing: "0.2px",
            }}>
              {event.event_type}
            </span>
            <span style={{
              fontSize: 10, color: colors.textFaint, fontFamily: "monospace",
              marginLeft: "auto",
            }}>
              {formatEventClock(event.occurred_at)}
            </span>
          </div>
          <div style={{
            fontSize: 11, color: colors.textMuted, lineHeight: 1.4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {payloadSummary(event.payload)}
          </div>
        </div>
      </button>

      {expanded && (
        <pre style={{
          marginTop: 10, padding: "10px 12px", borderRadius: 8,
          background: "#211f1b", color: "#d7ccad",
          fontFamily: "monospace", fontSize: 10.5, lineHeight: 1.55,
          whiteSpace: "pre", overflowX: "auto",
        }}>
{JSON.stringify({
  event_type:  event.event_type,
  user_id:     event.user_id,
  session_id:  event.session_id,
  occurred_at: event.occurred_at,
  payload:     event.payload,
}, null, 2)}
        </pre>
      )}
    </div>
  );
}

function MallGroupHead({
  label, count, tone, collapsible, open, onToggle, style,
}: {
  label:        string;
  count:        number;
  tone:         "active" | "coming_soon" | "draft";
  collapsible?: boolean;
  open?:        boolean;
  onToggle?:    () => void;
  style?:       React.CSSProperties;
}) {
  const dotColor =
    tone === "active" ? colors.green
    : tone === "coming_soon" ? v1.amber
    : colors.textFaint;

  const content = (
    <>
      <span style={{
        fontSize: 10, fontWeight: 700, color: dotColor,
        textTransform: "uppercase", letterSpacing: "1.8px", display: "flex",
        alignItems: "center", gap: 6,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
        {label} · {count}
      </span>
      {collapsible && (
        <span style={{ fontSize: 10, color: colors.textFaint, display: "flex", alignItems: "center", gap: 3 }}>
          {open ? "Hide" : "Show"}
          <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }} />
        </span>
      )}
    </>
  );

  const baseStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "6px 2px", marginBottom: 6, ...style,
  };

  if (collapsible) {
    return (
      <button
        onClick={onToggle}
        style={{ ...baseStyle, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
      >
        {content}
      </button>
    );
  }
  return <div style={baseStyle}>{content}</div>;
}

function MallGroupEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, color: colors.textFaint, fontStyle: "italic",
      fontFamily: "Georgia, serif", padding: "2px 2px 8px",
    }}>
      {children}
    </div>
  );
}

function MallRow({
  mall, tone, expanded, busy, onToggle, onUpdateStatus,
}: {
  mall:           Mall;
  tone:           "active" | "coming_soon" | "draft";
  expanded:       boolean;
  busy:           boolean;
  onToggle:       () => void;
  onUpdateStatus: (mall: Mall, next: MallStatus) => void;
}) {
  const activatedLabel = mall.activated_at
    ? `Activated ${formatActivatedDate(mall.activated_at) ?? "—"}`
    : null;

  const toneBg =
    tone === "active" ? colors.greenLight
    : tone === "draft" ? "rgba(42,26,10,0.03)"
    : colors.surface;

  const toneBorder =
    tone === "active" ? colors.greenBorder
    : tone === "coming_soon" ? v1.amberBorder
    : colors.border;

  return (
    <div
      style={{
        background: expanded ? colors.surface : toneBg,
        border: `1px ${tone === "draft" ? "dashed" : "solid"} ${expanded ? colors.greenBorder : toneBorder}`,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
        boxShadow: expanded ? "0 4px 18px rgba(30,77,43,0.08)" : "none",
        transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <button
        onClick={onToggle}
        disabled={busy}
        aria-expanded={expanded}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "none", border: "none", cursor: busy ? "default" : "pointer",
          width: "100%", padding: 0, textAlign: "left",
          opacity: busy ? 0.6 : 1,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600,
            color: colors.textPrimary, whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {mall.name}
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
            {mall.city}, {mall.state}
          </div>
          {activatedLabel && (
            <div style={{ fontSize: 10, color: colors.textFaint, fontFamily: "monospace", marginTop: 3 }}>
              {activatedLabel}
            </div>
          )}
        </div>
        <StatusPill status={mall.status} />
      </button>

      {expanded && (
        <>
          <div style={{ height: 1, background: colors.border, margin: "12px 0" }} />
          <div style={{
            display: "flex", gap: 6, padding: 3,
            background: "rgba(42,26,10,0.05)", borderRadius: 10,
          }}>
            {(["draft", "coming_soon", "active"] as MallStatus[]).map(s => {
              const selected = mall.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(mall, s)}
                  disabled={busy}
                  style={{
                    flex: 1, padding: "9px 6px", borderRadius: 8, fontSize: 11,
                    fontWeight: 600, textAlign: "center",
                    color: selected
                      ? (s === "active" ? "#fff" : colors.textPrimary)
                      : colors.textMid,
                    background: selected
                      ? (s === "active" ? colors.green : "#fff")
                      : "transparent",
                    border: `1px solid ${selected
                      ? (s === "active" ? colors.green : colors.border)
                      : "transparent"}`,
                    boxShadow: selected && s !== "active" ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                    cursor: busy ? "default" : "pointer",
                  }}
                >
                  {STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
          {busy && (
            <div style={{ marginTop: 8, fontSize: 10, color: colors.textMuted, fontStyle: "italic", display: "flex", alignItems: "center", gap: 5 }}>
              <LoaderIcon size={10} style={{ animation: "spin 0.9s linear infinite" }} />
              Updating…
            </div>
          )}

          {/* R11 (Wave 1 Task 7, session 91) — mall hero upload affordance.
              Sits below the status toggle so the lifecycle controls stay
              the row's primary surface. Only renders when expanded. */}
          <MallHeroBlock mall={mall} />
        </>
      )}
    </div>
  );
}

// ── Mall hero upload (R11) ──────────────────────────────────────────────────

function MallHeroBlock({ mall }: { mall: Mall }) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(mall.hero_image_url ?? null);
  const [uploading,  setUploading]  = useState(false);
  const [removing,   setRemoving]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 12_000_000) {
      setError("Image too large. Please choose a photo smaller than 12MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(dataUrl);
      const res = await authFetch("/api/admin/malls/hero-image", {
        method: "POST",
        body:   JSON.stringify({ base64DataUrl: compressed, mallId: mall.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error ?? `Upload failed (HTTP ${res.status})`);
      } else {
        setCurrentUrl(json.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
    setUploading(false);
  }

  async function handleRemove() {
    if (!currentUrl) return;
    if (!window.confirm(`Remove the hero image for ${mall.name}? It will disappear from the feed when shoppers filter to this mall.`)) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await authFetch(`/api/admin/malls/hero-image?mallId=${encodeURIComponent(mall.id)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? `Remove failed (HTTP ${res.status})`);
      } else {
        setCurrentUrl(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
    setRemoving(false);
  }

  const inputId = `mall-hero-input-${mall.id}`;

  return (
    <div style={{ marginTop: 12, padding: "12px 12px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.surface }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>
          Hero photo
        </div>
        {currentUrl && (
          <div style={{ fontSize: 9, color: colors.green, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>
            Live
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: colors.textMuted, lineHeight: 1.55, marginBottom: 10 }}>
        Renders above the feed header when shoppers filter to this mall.
      </div>

      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: 8,
        overflow: "hidden",
        border: `1px ${currentUrl ? "solid" : "dashed"} ${currentUrl ? colors.border : colors.textFaint}`,
        background: colors.bg,
        marginBottom: 10,
      }}>
        {currentUrl ? (
          <img src={currentUrl} alt={`${mall.name} hero preview`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: colors.textFaint, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
            <ImageIcon size={13} />
            No hero set
          </div>
        )}
        {(uploading || removing) && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: 500, color: colors.textMid }}>
            <LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} />
            {uploading ? "Uploading…" : "Removing…"}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <label htmlFor={inputId} style={{
          flex: 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "9px 12px",
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          background: "#fff",
          cursor: uploading || removing ? "default" : "pointer",
          fontSize: 11, fontWeight: 600, color: colors.textPrimary,
          opacity: uploading || removing ? 0.5 : 1,
        }}>
          <Upload size={12} />
          {currentUrl ? "Replace" : "Upload"}
        </label>
        <input id={inputId} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading || removing} style={{ display: "none" }} />
        {currentUrl && (
          <button onClick={handleRemove} disabled={uploading || removing} style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: "#fff",
            cursor: uploading || removing ? "default" : "pointer",
            fontSize: 11, fontWeight: 600, color: colors.textMid,
            opacity: uploading || removing ? 0.5 : 1,
          }}>
            Remove
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6, background: v1.redBg, border: `1px solid ${v1.redBorder}`, fontSize: 11, color: v1.red, lineHeight: 1.4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Diagnosis Panel ─────────────────────────────────────────────────────────

function DiagnosisPanel({ report }: { report: DiagnosisReport }) {
  const hasBooth = report.conflicts.booth_collision.length > 0;
  const hasName  = report.conflicts.name_collision.length > 0;
  const hasAuth  = report.conflicts.auth_user !== null;

  const severityColor =
    report.diagnosis === "no_conflict" || report.diagnosis === "booth_unlinked_name_match"
      ? colors.green
      : report.diagnosis === "slug_collision"
        ? colors.textMid  // will auto-resolve, informational only
        : colors.red;

  const severityBg =
    report.diagnosis === "no_conflict" || report.diagnosis === "booth_unlinked_name_match"
      ? colors.greenLight
      : report.diagnosis === "slug_collision"
        ? colors.surface
        : colors.redBg;

  const severityBorder =
    report.diagnosis === "no_conflict" || report.diagnosis === "booth_unlinked_name_match"
      ? colors.greenBorder
      : report.diagnosis === "slug_collision"
        ? colors.border
        : colors.redBorder;

  return (
    <div style={{
      marginTop: 10, padding: "12px 14px", borderRadius: 10,
      background: severityBg, border: `1px solid ${severityBorder}`,
    }}>
      <div style={{
        fontSize: 9, color: severityColor, textTransform: "uppercase",
        letterSpacing: "1.8px", marginBottom: 6, fontWeight: 600,
      }}>
        Diagnosis · {report.diagnosis}
      </div>
      <div style={{
        fontSize: 12, color: colors.textPrimary, lineHeight: 1.5, marginBottom: 10,
      }}>
        {report.suggested_action}
      </div>

      {(hasBooth || hasName || hasAuth) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {hasBooth && (
            <DiagnosisSection
              label="Booth collision"
              rows={report.conflicts.booth_collision.map(v => ({
                primary: v.display_name,
                secondary: `booth ${v.booth_number ?? "(none)"} · slug ${v.slug}`,
                tertiary: v.user_id ? `linked · user ${v.user_id.slice(0, 8)}…` : "unlinked",
                danger: !!v.user_id,
              }))}
            />
          )}
          {hasName && (
            <DiagnosisSection
              label="Slug / name collision"
              rows={report.conflicts.name_collision.map(v => ({
                primary: v.display_name,
                secondary: `slug ${v.slug} · booth ${v.booth_number ?? "(none)"}`,
                tertiary: v.user_id ? `linked · user ${v.user_id.slice(0, 8)}…` : "unlinked",
                danger: false, // auto-resolved by suffix — informational
              }))}
            />
          )}
          {hasAuth && report.conflicts.auth_user && (
            <DiagnosisSection
              label="Existing auth user for this email"
              rows={[{
                primary: report.conflicts.auth_user.email,
                secondary:
                  `signed in ${report.conflicts.auth_user.last_sign_in_at
                    ? new Date(report.conflicts.auth_user.last_sign_in_at).toLocaleDateString()
                    : "never"}`,
                tertiary: `user ${report.conflicts.auth_user.id.slice(0, 8)}…`,
                danger: false,
              }]}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DiagnosisSection({
  label,
  rows,
}: {
  label: string;
  rows: { primary: string; secondary: string; tertiary: string; danger: boolean }[];
}) {
  return (
    <div>
      <div style={{
        fontSize: 9, color: colors.textFaint, textTransform: "uppercase",
        letterSpacing: "1.5px", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            padding: "6px 8px", borderRadius: 6,
            background: row.danger ? "rgba(139,32,32,0.06)" : colors.bg,
            border: `1px solid ${row.danger ? colors.redBorder : colors.border}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textPrimary }}>
              {row.primary}
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "monospace", marginTop: 1 }}>
              {row.secondary}
            </div>
            <div style={{ fontSize: 10, color: row.danger ? colors.red : colors.textMid, marginTop: 1 }}>
              {row.tertiary}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FeaturedBannerEditor — v1.1l ───────────────────────────────────────
//
// Self-contained upload widget for one site_settings key. Flow:
//   1. On mount, fetch current URL via getSiteSettingUrl(settingKey).
//   2. Render a preview (current image or dashed placeholder) + file input.
//   3. On file select: FileReader → compressImage → POST to
//      /api/admin/featured-image with { base64DataUrl, settingKey }.
//   4. On success, refetch the URL so the preview updates with the canonical
//      public URL from Supabase Storage.
//
// Errors are surfaced inline below the helper copy. Not a blocker state —
// admin can retry immediately. No persistent error toasts (they'd collide
// with the approval toast system).

function FeaturedBannerEditor({
  settingKey,
  label,
  helper,
}: {
  settingKey: SiteSettingKey;
  label:      string;
  helper:     string;
}) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [removing,   setRemoving]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);

  async function loadCurrent() {
    setLoading(true);
    const url = await getSiteSettingUrl(settingKey);
    setCurrentUrl(url);
    setLoading(false);
  }

  useEffect(() => {
    loadCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingKey]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-selected
    if (!file) return;
    if (file.size > 12_000_000) {
      setError("Image too large. Please choose a photo smaller than 12MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(dataUrl);

      const res = await authFetch("/api/admin/featured-image", {
        method: "POST",
        body:   JSON.stringify({ base64DataUrl: compressed, settingKey }),
      });
      const json = await res.json();

      if (!res.ok || !json.url) {
        setError(json.error ?? `Upload failed (HTTP ${res.status})`);
      } else {
        setCurrentUrl(json.url);
        setSuccess("Uploaded — live now.");
        setTimeout(() => setSuccess(null), 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }

    setUploading(false);
  }

  async function handleRemove() {
    if (!currentUrl) return;
    if (!window.confirm(`Remove the ${label.toLowerCase()} image? This takes it off the live site.`)) return;

    setRemoving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch(`/api/admin/featured-image?settingKey=${encodeURIComponent(settingKey)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? `Remove failed (HTTP ${res.status})`);
      } else {
        setCurrentUrl(null);
        setSuccess("Removed — placeholder is live.");
        setTimeout(() => setSuccess(null), 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }

    setRemoving(false);
  }

  const inputId = `featured-banner-input-${settingKey}`;

  return (
    <div style={{
      padding: "14px 14px 16px",
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      background: colors.surface,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
          {label}
        </div>
        {currentUrl && (
          <div style={{
            fontSize: 9, color: colors.green, textTransform: "uppercase",
            letterSpacing: "1.5px", fontWeight: 600,
          }}>
            Live
          </div>
        )}
      </div>

      <div style={{
        fontSize: 11, color: colors.textMuted, lineHeight: 1.55, marginBottom: 12,
      }}>
        {helper}
      </div>

      {/* Preview */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px ${currentUrl ? "solid" : "dashed"} ${currentUrl ? colors.border : colors.textFaint}`,
        background: colors.bg,
        marginBottom: 12,
      }}>
        {loading ? (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 11, color: colors.textFaint,
          }}>
            Loading…
          </div>
        ) : currentUrl ? (
          <img
            src={currentUrl}
            alt={`${label} preview`}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 11, color: colors.textFaint, fontStyle: "italic",
            fontFamily: "Georgia, serif",
          }}>
            <ImageIcon size={14} />
            No image set yet
          </div>
        )}
        {(uploading || removing) && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
            background: "rgba(255,255,255,0.82)",
            fontSize: 12, fontWeight: 500, color: colors.textMid,
          }}>
            <LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} />
            {uploading ? "Uploading…" : "Removing…"}
          </div>
        )}
      </div>

      {/* Upload button */}
      <label
        htmlFor={inputId}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "10px 14px",
          borderRadius: 10,
          background: (uploading || removing) ? colors.surface : colors.green,
          color: (uploading || removing) ? colors.textMuted : "#fff",
          fontSize: 12, fontWeight: 600,
          border: `1px solid ${(uploading || removing) ? colors.border : colors.green}`,
          cursor: (uploading || removing) ? "default" : "pointer",
          opacity: (uploading || removing) ? 0.6 : 1,
        }}
      >
        <Upload size={12} />
        {currentUrl ? "Replace image" : "Upload image"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        disabled={uploading || removing}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Remove link — visible only when an image is currently set */}
      {currentUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploading || removing}
          style={{
            display: "block",
            width: "100%",
            marginTop: 8,
            padding: "8px 14px",
            borderRadius: 10,
            background: "transparent",
            color: (uploading || removing) ? colors.textFaint : colors.red,
            fontSize: 11, fontWeight: 500,
            border: `1px solid ${(uploading || removing) ? colors.border : colors.redBorder}`,
            cursor: (uploading || removing) ? "default" : "pointer",
            opacity: (uploading || removing) ? 0.5 : 1,
          }}
        >
          Remove image
        </button>
      )}

      {/* Feedback */}
      {error && (
        <div style={{
          marginTop: 10, padding: "8px 10px", borderRadius: 8,
          background: colors.redBg, border: `1px solid ${colors.redBorder}`,
          fontSize: 11, color: colors.red, lineHeight: 1.5,
        }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{
          marginTop: 10, padding: "8px 10px", borderRadius: 8,
          background: colors.greenLight, border: `1px solid ${colors.greenBorder}`,
          fontSize: 11, color: colors.green, lineHeight: 1.5, fontWeight: 500,
        }}>
          ✓ {success}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── AddBoothInline lifted to components/AddBoothInline.tsx — session 44.
//   Both /admin and /shelves now import it. See that file for full docs.
