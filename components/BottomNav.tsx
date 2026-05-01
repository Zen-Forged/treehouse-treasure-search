// components/BottomNav.tsx
// Fixed bottom navigation.
//
// Tab layout (session 90):
//   Guest:        Home · Profile · Saved                  (3 tabs)
//   Vendor:       Home · Profile · Saved · My Booth       (4 tabs)
//   Admin:        Home · Profile · Booths · Saved · Admin (5 tabs)
//
// The Profile tab routes to /login in every state — guests see the OTP
// flow, authed users see the same page with a "sign out" affordance under
// the first-time helper line. Admin tab uses IoKey (react-icons/io5) for
// visual distinction from the other Lucide-stroked tabs.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Store, LayoutGrid, CircleUser } from "lucide-react";
import { IoKey } from "react-icons/io5";
import FlagGlyph from "./FlagGlyph";
import { getSession, isAdmin } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export type NavTab = "home" | "shelves" | "flagged" | "my-shelf" | "admin" | "login" | null;

interface BottomNavProps {
  active?: NavTab;
  flaggedCount?: number;
}

const C = {
  bg:         "rgba(232,221,199,0.96)", // v1.1d — paperCream translucent to match Find Detail
  border:     "rgba(42,26,10,0.18)",     // v1.1d — inkHairline for visible separation
  textMuted:  "#6b5538",                 // v1.1l — aligned to v1.inkMuted (was #8a8476 legacy textMuted which disappeared against paperCream)
  green:      "#1e4d2b",
  greenLight: "rgba(30,77,43,0.10)",
};

export default function BottomNav({ active = null, flaggedCount = 0 }: BottomNavProps) {
  const router = useRouter();
  const [user,  setUser]  = useState<User | null>(null);
  const [ready, setReady] = useState(false);

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

  const homeTab: TabDef = {
    key: "home", label: "Home", href: "/",
    icon: <Home size={21} strokeWidth={2.0} />,
  };
  const loginTab: TabDef = {
    key: "login", label: "Profile", href: "/login",
    icon: <CircleUser size={21} strokeWidth={1.8} />,
  };
  const findsTab: TabDef = {
    key: "flagged", label: "Saved", href: "/flagged",
    icon: <FlagGlyph size={21} strokeWidth={2.0} />, badge: true,
  };
  const boothsTab: TabDef = {
    key: "shelves", label: "Booths", href: "/shelves",
    icon: <LayoutGrid size={21} strokeWidth={2.0} />,
  };
  const myBoothTab: TabDef = {
    key: "my-shelf", label: "My Booth", href: "/my-shelf",
    icon: <Store size={21} strokeWidth={2.0} />,
  };
  const adminTab: TabDef = {
    key: "admin", label: "Admin", href: "/admin",
    // IoKey is filled (no strokeWidth); size 21 matches the row.
    icon: <IoKey size={21} />,
  };

  // Session 90 — Sign In sits second-position after Home in every state.
  // Booths is admin-only; vendors discover via the feed → /shelf/[slug].
  // Guest:  Home · Sign In · Saved
  // Vendor: Home · Sign In · Saved · My Booth
  // Admin:  Home · Sign In · Booths · Saved · Admin
  const userIsAdmin = !!user && isAdmin(user);
  const tabs: TabDef[] = !user
    ? [homeTab, loginTab, findsTab]
    : userIsAdmin
      ? [homeTab, loginTab, boothsTab, findsTab, adminTab]
      : [homeTab, loginTab, findsTab, myBoothTab];

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
                // Session 89 — count badge stripped of paper-warm stroke and
                // bumped from 16 → 20 so the saved-count signal reads at a
                // glance. Shifted further from the icon (top/right -4 → -6)
                // for clearer visual separation now that the badge is bigger.
                <div style={{
                  position: "absolute", top: -6, right: -6,
                  minWidth: 20, height: 20, paddingLeft: 5, paddingRight: 5,
                  borderRadius: 10, background: C.green,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                  lineHeight: 1, letterSpacing: "-0.3px",
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
