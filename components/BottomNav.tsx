// components/BottomNav.tsx
// Fixed bottom navigation.
//
// R10 (session 107) shipped a 4-tab flat: Home · Map · Profile · Saved.
// R10 follow-up (session 109) trims to 3 tabs by relocating Profile to the
// masthead left slot — see <MastheadProfileButton>. REVERSES R10 D1.
//
// Before (sessions 90+):     Guest 3-tab, Vendor 4-tab, Admin 5-tab role-conditional.
// R10 v1 (session 107):      Home · Map · Profile · Saved (4 tabs flat).
// R10 v1.1 (session 109):    Home · Map · Saved (3 tabs flat).
//
// Why drop Profile: BottomNav's job is wayfinding between primary
// destinations. Profile is identity, not destination — pairing it with a
// masthead left-slot affordance (mirroring back-button geometry on detail
// pages) gives every page a consistent "you are here / who you are" pair
// without burning a nav slot. My Booth + Admin entry points still live as
// inline links on the Profile destination (/login/email when authed).
//
// Saved tab badge (D4) — Times-New-Roman numeral on the green pill, matching
// the booth-numeral typography system from session 75 (project-wide rule:
// letters → FONT_LORA / FONT_SYS; numbers → FONT_NUMERAL).

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, MapPin } from "lucide-react";
import FlagGlyph from "./FlagGlyph";
import { FONT_NUMERAL } from "@/lib/tokens";
import { getSession } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

// "login" was a valid value in sessions 107+108 when Profile occupied a
// nav slot. Session 109 retires the Profile tab in favor of the masthead
// left-slot affordance, but the type member is preserved so any external
// consumer that still passes active="login" type-checks; the tab itself
// no longer renders.
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

  // Profile tab retired session 109 — relocated to masthead left slot.
  // 3 tabs flat: Home · Map · Saved.
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
