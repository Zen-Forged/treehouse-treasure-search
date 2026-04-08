// app/admin/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw, CheckSquare, Square, AlertTriangle, Wrench } from "lucide-react";
import { LOCAL_VENDOR_KEY } from "@/types/treehouse";
import type { LocalVendorProfile } from "@/types/treehouse";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  surfaceDeep: "#dedad0",
  border:      "rgba(26,26,24,0.1)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.09)",
  greenBorder: "rgba(30,77,43,0.22)",
  red:         "#8b2020",
  redBg:       "rgba(139,32,32,0.07)",
  redBorder:   "rgba(139,32,32,0.18)",
};

interface AdminPost {
  id: string;
  title: string;
  status: string;
  image_url: string | null;
  vendor_id: string;
  created_at: string;
  vendor?: { id: string; display_name: string; booth_number: string | null };
}

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [profile, setProfile] = useState<LocalVendorProfile | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    fetchPosts();
    try {
      const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
      if (raw) setProfile(JSON.parse(raw) as LocalVendorProfile);
    } catch {}
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/posts");
    const json = await res.json();
    setPosts(json.posts ?? []);
    setLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map(p => p.id)));
    }
  }

  async function deleteSelected() {
    if (selected.size === 0 || busy) return;
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    const json = await res.json();
    if (json.ok) {
      setResult(`✓ Deleted ${json.postsDeleted} post${json.postsDeleted !== 1 ? "s" : ""} + ${json.storageDeleted} image${json.storageDeleted !== 1 ? "s" : ""}`);
      setSelected(new Set());
      await fetchPosts();
    } else {
      setResult(`Error: ${json.error}`);
    }
    setBusy(false);
  }

  async function deleteAll() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    setConfirmAll(false);
    const res = await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteAll: true }),
    });
    const json = await res.json();
    if (json.ok) {
      setResult(`✓ Nuked ${json.postsDeleted} post${json.postsDeleted !== 1 ? "s" : ""} + ${json.storageDeleted} image${json.storageDeleted !== 1 ? "s" : ""}`);
      setSelected(new Set());
      await fetchPosts();
    } else {
      setResult(`Error: ${json.error}`);
    }
    setBusy(false);
  }

  function clearLocalProfile() {
    try {
      localStorage.removeItem(LOCAL_VENDOR_KEY);
      setProfile(null);
      setResult("✓ Local vendor profile cleared — re-setup on next post");
    } catch {}
  }

  const allSelected = posts.length > 0 && selected.size === posts.length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", padding: "0 0 100px" }}>

      {/* Header */}
      <div style={{
        padding: "max(20px, env(safe-area-inset-top, 20px)) 20px 16px",
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 3 }}>
            Treehouse
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
            Admin
          </div>
        </div>
        <button onClick={() => router.push("/")} style={{ fontSize: 12, color: C.green, background: "none", border: "none", cursor: "pointer" }}>
          ← Feed
        </button>
      </div>

      {/* Local profile section */}
      <div style={{ margin: "20px 20px 0" }}>
        <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>
          Local vendor profile
        </div>
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 14px" }}>
          {profile ? (
            <>
              <div style={{ fontSize: 13, color: C.textPrimary, marginBottom: 2 }}>
                <strong>{profile.display_name}</strong> · Booth {profile.booth_number}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>
                Mall ID: <code style={{ fontFamily: "monospace", fontSize: 10 }}>{profile.mall_id?.slice(0, 16)}…</code>
              </div>
              <div style={{ fontSize: 11, color: profile.vendor_id ? C.green : C.red, marginBottom: 10 }}>
                {profile.vendor_id
                  ? <>vendor_id: <code style={{ fontFamily: "monospace", fontSize: 10 }}>{profile.vendor_id.slice(0, 16)}…</code></>
                  : "⚠ No vendor_id stored — this is why delete is missing on older posts"}
              </div>
              <button
                onClick={clearLocalProfile}
                style={{
                  fontSize: 11, color: C.red, background: "none",
                  border: `1px solid ${C.redBorder}`, borderRadius: 7,
                  padding: "5px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Wrench size={10} /> Clear local profile
              </button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>
              No local profile found.
            </div>
          )}
        </div>
      </div>

      {/* Posts section */}
      <div style={{ margin: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px" }}>
            All posts ({posts.length})
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={fetchPosts}
              disabled={loading || busy}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textMuted }}
            >
              <RefreshCw size={11} style={{ opacity: loading ? 0.4 : 1 }} />
              Refresh
            </button>
            {posts.length > 0 && (
              <button
                onClick={toggleAll}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textMid }}
              >
                {allSelected
                  ? <CheckSquare size={13} style={{ color: C.green }} />
                  : <Square size={13} />
                }
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div style={{
            padding: "10px 12px", borderRadius: 9, marginBottom: 12,
            background: result.startsWith("✓") ? C.greenLight : C.redBg,
            border: `1px solid ${result.startsWith("✓") ? C.greenBorder : C.redBorder}`,
            fontSize: 12,
            color: result.startsWith("✓") ? C.green : C.red,
          }}>
            {result}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: 13, color: C.textFaint, padding: "20px 0", textAlign: "center" }}>Loading…</div>
        ) : posts.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textFaint, padding: "20px 0", textAlign: "center", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
            No posts in database.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {posts.map(post => {
              const isSel = selected.has(post.id);
              return (
                <div
                  key={post.id}
                  onClick={() => toggleSelect(post.id)}
                  style={{
                    background: isSel ? C.greenLight : C.surface,
                    border: `1px solid ${isSel ? C.greenBorder : C.border}`,
                    borderRadius: 11,
                    padding: "10px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {isSel
                    ? <CheckSquare size={15} style={{ color: C.green, flexShrink: 0 }} />
                    : <Square size={15} style={{ color: C.textFaint, flexShrink: 0 }} />
                  }
                  {post.image_url && (
                    <img src={post.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                      {post.vendor?.display_name ?? "no vendor"} · {post.status}
                    </div>
                    <div style={{ fontSize: 9, color: C.textFaint, fontFamily: "monospace", marginTop: 1 }}>
                      vendor_id: {post.vendor_id?.slice(0, 12)}…
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action bar */}
      {(selected.size > 0 || posts.length > 0) && (
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          background: "rgba(240,237,230,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: `1px solid ${C.border}`,
          padding: "12px 20px",
          paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          display: "flex", gap: 10,
        }}>
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={busy}
              style={{
                flex: 1, padding: "11px", borderRadius: 10,
                fontSize: 13, fontWeight: 500,
                background: C.red, color: "#fff",
                border: "none", cursor: "pointer",
                opacity: busy ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Trash2 size={13} />
              Delete {selected.size} selected
            </button>
          )}

          {posts.length > 0 && !confirmAll && (
            <button
              onClick={() => setConfirmAll(true)}
              disabled={busy}
              style={{
                flex: selected.size > 0 ? 0 : 1,
                padding: "11px 14px", borderRadius: 10,
                fontSize: 13,
                background: "none",
                color: C.red,
                border: `1px solid ${C.redBorder}`,
                cursor: "pointer",
                opacity: busy ? 0.5 : 1,
                whiteSpace: "nowrap",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <AlertTriangle size={13} />
              Nuke all
            </button>
          )}

          {confirmAll && (
            <button
              onClick={deleteAll}
              disabled={busy}
              style={{
                flex: 1, padding: "11px", borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                background: C.red, color: "#fff",
                border: "none", cursor: "pointer",
                opacity: busy ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Trash2 size={13} />
              {busy ? "Deleting…" : "Confirm — delete ALL posts + images"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
