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
// Session 13 fix — toast stacking: rendered via createPortal to document.body
// so it escapes the admin page's stacking context (which was trapping it
// behind the expanded diagnosis panel and subsequent request cards). Also
// bumped zIndex to 9999 as defensive redundancy.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, RefreshCw, CheckSquare, Square, AlertTriangle, LogOut, UserCheck, Users, Store, X, Stethoscope } from "lucide-react";
import { getSession, isAdmin, signOut } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { colors } from "@/lib/tokens";
import type { User } from "@supabase/supabase-js";

interface AdminPost {
  id:         string;
  title:      string;
  status:     string;
  image_url:  string | null;
  vendor_id:  string;
  created_at: string;
  vendor?: { id: string; display_name: string; booth_number: string | null };
}

interface VendorRequest {
  id:           string;
  name:         string;
  email:        string;
  booth_number: string | null;
  mall_id:      string | null;
  mall_name:    string | null;
  status:       string;
  created_at:   string;
}

interface DiagnosisConflict {
  display_name: string;
  booth_number: string | null;
  user_id:      string | null;
  slug:         string;
}

interface DiagnosisVendorSnapshot {
  id:           string;
  display_name: string;
  booth_number: string | null;
  slug:         string;
  user_id:      string | null;
  mall_id:      string;
  created_at:   string;
}

interface DiagnosisAuthUser {
  id:                 string;
  email:              string;
  email_confirmed_at: string | null;
  last_sign_in_at:    string | null;
  created_at:         string;
}

interface DiagnosisReport {
  request: {
    id:           string;
    name:         string;
    email:        string;
    booth_number: string | null;
    mall_id:      string | null;
    mall_name:    string | null;
    status:       string;
    created_at:   string;
  };
  conflicts: {
    booth_collision: DiagnosisVendorSnapshot[];
    name_collision:  DiagnosisVendorSnapshot[];
    auth_user:       DiagnosisAuthUser | null;
  };
  diagnosis:        string;
  suggested_action: string;
}

type Toast =
  | { kind: "success"; name: string; email: string; booth: string | null; mall: string | null; warning?: string; note?: string }
  | { kind: "error"; message: string; requestId?: string; diagnosis?: string; conflict?: DiagnosisConflict };

const TOAST_DURATION_MS_SUCCESS = 6000;
const TOAST_DURATION_MS_ERROR   = 12000; // errors linger longer so admin can act

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
  const [activeTab, setActiveTab] = useState<"posts" | "requests">("requests");

  // Diagnosis panel — per-request loading + result state
  const [diagnosisBusy,    setDiagnosisBusy]    = useState<Set<string>>(new Set());
  const [diagnosisReports, setDiagnosisReports] = useState<Record<string, DiagnosisReport>>({});
  const [diagnosisErrors,  setDiagnosisErrors]  = useState<Record<string, string>>({});

  // Portal target — set once mounted so SSR doesn't try to render into
  // a non-existent document.body.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
    getSession().then(s => {
      setUser(s?.user ?? null);
      setAuthReady(true);
      if (s?.user && isAdmin(s.user)) {
        fetchPosts();
        fetchVendorRequests();
      }
    });
  }, []);

  // Auto-dismiss toast (duration depends on kind)
  useEffect(() => {
    if (!toast) return;
    const duration = toast.kind === "error" ? TOAST_DURATION_MS_ERROR : TOAST_DURATION_MS_SUCCESS;
    const t = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(t);
  }, [toast]);

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
      const res  = await authFetch("/api/admin/vendor-requests");
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
        <button onClick={() => router.push(user ? "/" : "/login")}
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

  // Toast content — rendered via portal to escape page stacking context.
  // See session 13 fix: inline toast was appearing BEHIND diagnosis panel
  // and subsequent request cards because the admin page's flex children
  // were winning on z-index with z-index: 100.
  const toastNode = toast ? (
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
          background: toast.kind === "success" ? "#f0ede6" : "#fff",
          border: `1px solid ${toast.kind === "success" ? colors.greenBorder : colors.redBorder}`,
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
                {toast.booth ? `Booth ${toast.booth}` : "No booth"} · {toast.mall || "No mall"}
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
            color: toast.kind === "success" ? colors.green : colors.red,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </motion.div>
    </div>
  ) : null;

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

      {/* Tab switcher */}
      <div style={{ margin: "20px 20px 0", display: "flex", gap: 8 }}>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: activeTab === "requests" ? colors.green : "none",
            color: activeTab === "requests" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "requests" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}>
          <Users size={13} />
          Vendor Requests {pendingRequests.length > 0 && (
            <span style={{
              background: activeTab === "requests" ? "rgba(255,255,255,0.2)" : colors.green,
              color: activeTab === "requests" ? "#fff" : "#fff",
              padding: "2px 6px", borderRadius: 10, fontSize: 10, fontWeight: 700
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: activeTab === "posts" ? colors.green : "none",
            color: activeTab === "posts" ? "#fff" : colors.textMid,
            border: `1px solid ${activeTab === "posts" ? colors.green : colors.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}>
          <Store size={13} /> Posts ({posts.length})
        </button>
      </div>

      {/* Vendor Requests Tab */}
      {activeTab === "requests" && (
        <div style={{ margin: "24px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px" }}>
              Vendor requests ({requests.length})
            </div>
            <button onClick={fetchVendorRequests} disabled={requestsLoading}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted }}>
              <RefreshCw size={11} style={{ opacity: requestsLoading ? 0.4 : 1 }} /> Refresh
            </button>
          </div>

          {requestsLoading ? (
            <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center" }}>Loading requests…</div>
          ) : requests.length === 0 ? (
            <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center", fontStyle: "italic", fontFamily: "Georgia, serif" }}>No vendor requests yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {requests.map(request => {
                const isPending = request.status === "pending";
                const isBusy = requestBusy.has(request.id);
                const isDiagnosing = diagnosisBusy.has(request.id);
                const report = diagnosisReports[request.id];
                const diagErr = diagnosisErrors[request.id];
                return (
                  <div key={request.id}
                    style={{
                      background: isPending ? colors.surface : colors.bg,
                      border: `1px solid ${isPending ? colors.border : colors.textFaint}`,
                      borderRadius: 12, padding: "16px 18px",
                      opacity: isPending ? 1 : 0.6
                    }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
                          {request.name}
                        </div>
                        <div style={{ fontSize: 12, color: colors.textMid, marginBottom: 2 }}>
                          {request.email}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>
                          {request.booth_number ? `Booth ${request.booth_number}` : "No booth specified"} • {request.mall_name || "No mall specified"}
                        </div>
                        <div style={{ fontSize: 10, color: colors.textFaint, fontFamily: "monospace", marginTop: 4 }}>
                          {new Date(request.created_at).toLocaleDateString()} • {request.status}
                        </div>
                      </div>

                      {isPending && (
                        <button
                          onClick={() => approveVendorRequest(request)}
                          disabled={isBusy}
                          style={{
                            padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                            background: colors.green, color: "#fff", border: "none", cursor: "pointer",
                            opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6,
                            minHeight: 44, flexShrink: 0, whiteSpace: "nowrap"
                          }}>
                          <UserCheck size={14} /> {isBusy ? "…" : "Approve"}
                        </button>
                      )}
                    </div>

                    {/* Diagnose control — always available for every request */}
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      {!report && !diagErr && (
                        <button
                          onClick={() => diagnoseRequest(request.id)}
                          disabled={isDiagnosing}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 11, color: colors.textMid, padding: 0,
                            opacity: isDiagnosing ? 0.5 : 1,
                          }}>
                          <Stethoscope size={12} />
                          {isDiagnosing ? "Diagnosing…" : "Diagnose"}
                        </button>
                      )}
                      {(report || diagErr) && (
                        <button
                          onClick={() => dismissDiagnosis(request.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 11, color: colors.textFaint, padding: 0,
                          }}>
                          Hide diagnosis
                        </button>
                      )}
                    </div>

                    {/* Inline diagnosis panel */}
                    {diagErr && (
                      <div style={{
                        marginTop: 10, padding: "10px 12px", borderRadius: 8,
                        background: colors.redBg, border: `1px solid ${colors.redBorder}`,
                        fontSize: 11, color: colors.red, lineHeight: 1.5,
                      }}>
                        {diagErr}
                      </div>
                    )}
                    {report && <DiagnosisPanel report={report} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

      {/* Approval toast — portaled to document.body to escape page stacking
          context. Previous inline render was appearing BEHIND the diagnosis
          panel and subsequent request cards. Solid background (not translucent)
          defends against any transparency bleed-through. See session 13. */}
      <AnimatePresence>
        {toast && portalTarget && createPortal(toastNode, portalTarget)}
      </AnimatePresence>
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
