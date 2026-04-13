// app/admin/page.tsx
// Admin — gated to NEXT_PUBLIC_ADMIN_EMAIL via Supabase Auth session.
// Non-admin or unauth users see a sign-in prompt.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw, CheckSquare, Square, AlertTriangle, LogOut } from "lucide-react";
import { getSession, isAdmin, signOut } from "@/lib/auth";
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

export default function AdminPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<User | null>(null);
  const [authReady,  setAuthReady]  = useState(false);
  const [posts,      setPosts]      = useState<AdminPost[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [busy,       setBusy]       = useState(false);
  const [result,     setResult]     = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    getSession().then(s => {
      setUser(s?.user ?? null);
      setAuthReady(true);
      if (s?.user && isAdmin(s.user)) fetchPosts();
    });
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setResult(null);
    const res  = await fetch("/api/admin/posts");
    const json = await res.json();
    setPosts(json.posts ?? []);
    setLoading(false);
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
    const res  = await fetch("/api/admin/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) });
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
    const res  = await fetch("/api/admin/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleteAll: true }) });
    const json = await res.json();
    if (json.ok) {
      setResult(`✓ Nuked ${json.postsDeleted} post${json.postsDeleted !== 1 ? "s" : ""} + ${json.storageDeleted} image${json.storageDeleted !== 1 ? "s" : ""}`);
      setSelected(new Set());
      await fetchPosts();
    } else { setResult(`Error: ${json.error}`); }
    setBusy(false);
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

      {/* Posts section */}
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

      {/* Action bar */}
      {(selected.size > 0 || posts.length > 0) && (
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
    </div>
  );
}
