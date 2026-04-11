// components/DevAuthPanel.tsx
// DEV ONLY — floating auth state panel.
// Only renders on localhost. Never visible in production.
//
// Shows current auth state (guest / vendor / admin) and provides:
//  - Pre-filled magic link send for admin + vendor test accounts
//  - One-tap sign out
//  - Current user email + uid display
//
// Usage: drop <DevAuthPanel /> into app/layout.tsx (already done).

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, sendMagicLink, signOut, isAdmin } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAIL  = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "david@zenforged.com";
// Change this to any email you'll use for vendor testing
const VENDOR_EMAIL = process.env.NEXT_PUBLIC_DEV_VENDOR_EMAIL ?? "vendor@test.com";

type AuthTier = "guest" | "vendor" | "admin";

function tierColor(tier: AuthTier) {
  if (tier === "admin")  return { bg: "rgba(80,20,20,0.92)",  dot: "#f87171", label: "ADMIN" };
  if (tier === "vendor") return { bg: "rgba(20,50,30,0.92)",  dot: "#4ade80", label: "VENDOR" };
  return                        { bg: "rgba(30,28,20,0.88)",  dot: "#94a3b8", label: "GUEST" };
}

export default function DevAuthPanel() {
  const router = useRouter();
  const [user,      setUser]      = useState<User | null>(null);
  const [ready,     setReady]     = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [sending,   setSending]   = useState<string | null>(null);
  const [sentMsg,   setSentMsg]   = useState<string | null>(null);

  // Only render on localhost
  const [isLocal, setIsLocal] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocal(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    }
  }, []);

  useEffect(() => {
    if (!isLocal) return;
    getSession().then(s => {
      setUser(s?.user ?? null);
      setReady(true);
    });
  }, [isLocal]);

  if (!isLocal || !ready) return null;

  const tier: AuthTier = !user ? "guest" : isAdmin(user) ? "admin" : "vendor";
  const { bg, dot, label } = tierColor(tier);

  async function handleSendLink(email: string, role: string) {
    setSending(role);
    setSentMsg(null);
    const { error } = await sendMagicLink(email);
    setSending(null);
    if (error) {
      setSentMsg(`Error: ${error}`);
    } else {
      setSentMsg(`Link sent to ${email} — check your inbox`);
    }
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setSentMsg("Signed out — now in guest mode");
    router.refresh();
  }

  return (
    <div style={{
      position: "fixed", bottom: 80, right: 14, zIndex: 9999,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Collapsed pill */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px 6px 8px",
            borderRadius: 20, background: bg,
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            cursor: "pointer", color: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" }}>{label}</span>
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          width: 240, borderRadius: 16,
          background: "rgba(18,16,10,0.94)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: "#fff" }}>{label}</span>
            </div>
            <button onClick={() => { setExpanded(false); setSentMsg(null); }}
              style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: 0 }}>
              ×
            </button>
          </div>

          {/* Current user */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 5 }}>Current session</div>
            {user ? (
              <>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", wordBreak: "break-all", marginBottom: 3 }}>{user.email}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", wordBreak: "break-all" }}>{user.id.slice(0, 16)}…</div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", fontStyle: "italic" }}>No session — guest mode</div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 2 }}>Switch role</div>

            {/* Admin login */}
            <ActionButton
              label={`Admin — ${ADMIN_EMAIL}`}
              color="#f87171"
              active={tier === "admin"}
              loading={sending === "admin"}
              onClick={() => handleSendLink(ADMIN_EMAIL, "admin")}
            />

            {/* Vendor login */}
            <ActionButton
              label={`Vendor — ${VENDOR_EMAIL}`}
              color="#4ade80"
              active={tier === "vendor" && !isAdmin(user)}
              loading={sending === "vendor"}
              onClick={() => handleSendLink(VENDOR_EMAIL, "vendor")}
            />

            {/* Guest (sign out) */}
            <ActionButton
              label="Guest — sign out"
              color="#94a3b8"
              active={tier === "guest"}
              loading={false}
              onClick={handleSignOut}
              disabled={!user}
            />
          </div>

          {/* Status message */}
          {sentMsg && (
            <div style={{ margin: "0 14px 12px", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{sentMsg}</p>
            </div>
          )}

          {/* Tip */}
          <div style={{ padding: "0 14px 12px" }}>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.20)", lineHeight: 1.6 }}>
              Magic link sent → check inbox → click link → session persists.
              Collapse panel with × above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, color, active, loading, onClick, disabled = false }: {
  label: string; color: string; active: boolean; loading: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || (active && !label.includes("sign out")) || disabled}
      style={{
        width: "100%", padding: "8px 10px", borderRadius: 9, textAlign: "left",
        background: active ? `${color}22` : "rgba(255,255,255,0.04)",
        border: active ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.07)",
        cursor: loading || (active && !label.includes("sign out")) || disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", gap: 8,
        opacity: disabled ? 0.35 : 1, transition: "opacity 0.15s",
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: active ? color : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: active ? color : "rgba(255,255,255,0.55)", lineHeight: 1.3, flex: 1 }}>
        {loading ? "Sending…" : label}
      </span>
      {active && !label.includes("sign out") && (
        <span style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: "0.8px" }}>✓</span>
      )}
    </button>
  );
}
