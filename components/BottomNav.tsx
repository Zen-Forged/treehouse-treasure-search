// components/BottomNav.tsx
// Fixed bottom navigation.
//
// R10 (session 107) — 4-tab flat layout.
//
// Before (sessions 90+):  Guest 3-tab, Vendor 4-tab, Admin 5-tab role-conditional.
// After  (R10 session 107): Home · Map · Profile · Saved — 4 tabs flat for everyone.
//
// Why flat: per docs/r10-location-map-design.md D1+D2, the postcard mall card
// header now identifies the "where am I shopping" scope on Home + Saved + Map,
// and the Booths-as-list page becomes redundant once /map is the canonical
// browse-locations surface. My Booth + Admin entry points relocate to inline
// links on the Profile tab destination (/login/email when authed).
//
// Saved tab badge (D4) — Times-New-Roman numeral on the green pill, matching
// the booth-numeral typography system from session 75 (project-wide rule:
// letters → FONT_LORA / FONT_SYS; numbers → FONT_NUMERAL).

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, MapPin, CircleUser } from "lucide-react";
import FlagGlyph from "./FlagGlyph";
import { FONT_NUMERAL } from "@/lib/tokens";
import { getSession } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export type NavTab = "home" | "map" | "flagged" | "login" | null;

interface BottomNavProps {
  active?: NavTab;
  flaggedCount?: number;
}

const C = {
  bg:         "rgba(232,221,199,0.96)", // v1.1d — paperCream translucent to match Find Detail
  border:     "rgba(42,26,10,0.18)",     // v1.1d — inkHairline for visible separation
  textMuted:  "#6b5538",                 // v1.inkMuted
  green:      "#1e4d2b",
  greenLight: "rgba(30,77,43,0.10)",
};

export default function BottomNav({ active = null, flaggedCount = 0 }: BottomNavProps) {
  const router = useRouter();
  const [, setUser]  = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Auth state read kept for parity with prior sessions and future role
  // surfacing (e.g. badge for unread items on Profile when authed). The
  // visible nav itself is role-flat now.
  useEffect(() => {
    getSession().then(s => {
      setUser(s?.user ?? null);
      setReady(true);
    });
  }, []);

  const badgeLabel = (n: number) => n > 99 ? "99+" : n > 9 ? "9+" : String(n);

  type TabDef = {
    key: NavTab;
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: boolean;
  };

  const tabs: TabDef[] = [
    {
      key: "home", label: "Home", href: "/",
      icon: <Home size={21} strokeWidth={2.0} />,
    },
    {
      key: "map", label: "Map", href: "/map",
      icon: <MapPin size={21} strokeWidth={2.0} />,
    },
    {
      key: "login", label: "Profile", href: "/login",
      icon: <CircleUser size={21} strokeWidth={1.8} />,
    },
    {
      key: "flagged", label: "Saved", href: "/flagged",
      icon: <FlagGlyph size={21} strokeWidth={2.0} />, badge: true,
    },
  ];

  const navStyle: React.CSSProperties = {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 430, zIndex: 100,
    background: C.bg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    borderTop: `1px solid ${C.border}`,
    display: "flex", alignItems: "stretch",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
    minHeight: 60,
  };

  if (!ready) return <nav style={navStyle} />;

  return (
    <nav style={navStyle}>
      {tabs.map(tab => {
        const isActive  = active === tab.key;
        const showBadge = tab.badge && flaggedCount > 0;
        const labelColor = isActive ? C.green : C.textMuted;
        const iconColor  = isActive ? C.green : C.textMuted;
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.href)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 4, padding: "12px 0 10px",
              background: "none", border: "none", cursor: "pointer",
              color: labelColor,
              position: "relative", transition: "color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{
              position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 28, borderRadius: 14,
              background: isActive ? C.greenLight : "transparent",
              color: iconColor,
              transition: "background 0.18s, color 0.15s",
            }}>
              {tab.icon}
              {showBadge && (
                // R10 session 107 — TNR numeral on the green pill per D4.
                // Pill geometry inherited from session 89 (20×20+, 10px radius,
                // green bg, paper-cream stroke retired).
                <div style={{
                  position: "absolute", top: -6, right: -6,
                  minWidth: 20, height: 20, paddingLeft: 5, paddingRight: 5,
                  borderRadius: 10, background: C.green,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT_NUMERAL,
                  fontSize: 12, fontWeight: 600, color: "#fff",
                  lineHeight: 1, letterSpacing: "-0.01em",
                  boxSizing: "border-box", whiteSpace: "nowrap",
                }}>
                  {badgeLabel(flaggedCount)}
                </div>
              )}
            </div>
            <span style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 10, fontWeight: isActive ? 600 : 400,
              letterSpacing: "0.2px", lineHeight: 1, color: "inherit",
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
