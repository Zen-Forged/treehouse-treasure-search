// components/BottomNav.tsx
// Fixed bottom navigation.
//
// R10 D1 history:
//   Before (sessions 90+):     Guest 3-tab, Vendor 4-tab, Admin 5-tab role-conditional.
//   R10 v1   (session 107):    Home · Map · Profile · Saved (4 tabs flat) — D1 lock.
//   R10 v1.1 (session 109):    Home · Map · Saved (3 tabs flat) — Profile to masthead.
//   R10 v1.2 (session 110):    Home · Saved (2 tabs flat) — Map retired from nav.
//   R1 walk  (session 113):    Home · [Booth] · Saved — role-conditional Booth tab
//                              for vendors + admins. R1 Arc 5 QA surfaced that
//                              the previous "vendor/admin reach /my-shelf via
//                              /login/email cards" path was 3 taps and didn't
//                              match the everyday primary-task framing
//                              ("manage their booth, which is what they will
//                              be doing primarily"). Booth tab restores
//                              one-tap access without surfacing a
//                              vendor-only chrome to shoppers/guests.
//   R1 re-walk (session 114):  Home · Saved · [Booth | Admin] — role-conditional
//                              tab moved to the rightmost slot. Saved holds the
//                              stable 2nd position so muscle memory transfers
//                              across role transitions (sign-in / sign-out flips
//                              the rightmost slot, not the middle). Admin variant
//                              added: admin precedence wins (Option A — admin
//                              sees Admin → /admin, not Booth → /my-shelf, even
//                              when admin + vendor both apply). Session 113
//                              shipped Booth in the middle position framed as
//                              "primary work-surface peer of Home"; the re-walk
//                              showed admin-without-booth users hit "No booth
//                              assigned" with no escape and no admin reachability,
//                              so the rightmost slot becomes the role-specialty
//                              slot regardless of which role.
//   R18 (session 121):         Home · Saved · Map · [Booth | Admin]. Map returns
//                              as a universal slot-3 tab; the role-specialty
//                              slot stays rightmost when present. Guest/shopper
//                              gets 3-tab (Home/Saved/Map); vendor + admin get
//                              4-tab with role-tab rightmost. Reverses session
//                              110's "Map retired from nav" — David's session-
//                              121 thesis discussion reframed /map as a peer
//                              destination, not just an interaction surface.
//                              Session 114's "rightmost = role-specialty when
//                              present" rule preserved; Map slides in between
//                              Saved and the role-tab rather than displacing it.
//                              The X-Locations pill on the Home rich card retires
//                              in the same session — Map tab is now the canonical
//                              change-scope path, so the in-card pill became
//                              redundant chrome.
//
// Why drop Map (session 110, REVERSED session 121): the two paths to /map
// (BottomNav tab + tap the postcard mall card on Home/Saved) felt
// disjointed once /map became purely a scope-picker rather than a
// destination. Session 121 reframes /map as a peer destination (path-3
// of David's "Home / Saved / Find Map" thesis) and reinstates the tab.
// The redundancy concern is closed by retiring the Home rich card's
// X-Locations pill in the same session — there is now ONE path to /map
// (the BottomNav tab), not two.
//
// Why drop Profile (session 109): BottomNav's job is wayfinding between
// primary destinations. Profile is identity, not destination — pairing it
// with a masthead left-slot affordance gives every page a consistent
// "you are here / who you are" pair without burning a nav slot. Profile
// stays on the masthead; the new Booth tab is a destination, not identity.
//
// Why role-conditional, not flat (session 113): showing Booth to
// shoppers/guests would pull them into a "No booth assigned" surface or a
// vendor-creation flow with no useful return path. Better to surface
// chrome only when it's actionable. Future iteration may surface a Booth
// tab to guests for managing bookmarked booths (David's note at the
// reversal point) — that's a different destination and gets its own
// tab-content decision.
//
// Saved tab badge (D4) — Times-New-Roman numeral on the green pill, matching
// the booth-numeral typography system from session 75 (project-wide rule:
// letters → FONT_LORA / FONT_SYS; numbers → FONT_NUMERAL).

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Store, Shield, MapPin } from "lucide-react";
import FlagGlyph from "./FlagGlyph";
import { FONT_NUMERAL } from "@/lib/tokens";
import { getSession, onAuthChange, detectUserRole, type UserRole } from "@/lib/auth";

// "login" was a valid value in sessions 107+108 when Profile occupied a
// nav slot. Session 109 retires the Profile tab in favor of the masthead
// left-slot affordance, but the type member is preserved so any external
// consumer that still passes active="login" type-checks; the tab itself
// no longer renders.
//
// "booth" added session 113 for the role-conditional Booth tab (vendors
// only as of session 114). active="booth" passed by /my-shelf.
// "admin" added session 114 for the role-conditional Admin tab (admins
// only). active="admin" should be passed by /admin consumers if BottomNav
// is ever rendered there; today /admin doesn't render BottomNav.
export type NavTab = "home" | "map" | "flagged" | "booth" | "admin" | "login" | null;

interface BottomNavProps {
  active?: NavTab;
  flaggedCount?: number;
}

const C = {
  bg:         "#f2ecd8", // session 132 — paperCream opaque (was rgba(242,236,216,0.96) translucent + backdrop-blur; frosted-glass primitive retired Shape C — content bleed-through during scroll was producing perceived flicker)
  border:     "rgba(42,26,10,0.18)",     // v1.1d — inkHairline for visible separation
  textMuted:  "#6b5538",                 // v1.inkMuted
  green:      "#1e4d2b",
  greenLight: "rgba(30,77,43,0.10)",
};

export default function BottomNav({ active = null, flaggedCount = 0 }: BottomNavProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("none");
  const [ready, setReady] = useState(false);

  // Role detection drives the role-conditional Booth tab. detectUserRole
  // queries shoppers + vendors in parallel after isAdmin check; reactive
  // via onAuthChange so sign-in / sign-out flips the tab live without
  // requiring a navigation. Hold a blank nav until ready to avoid a
  // 2-tab → 3-tab flash for vendors landing on Home.
  useEffect(() => {
    let cancelled = false;
    getSession().then(async s => {
      const r = await detectUserRole(s?.user ?? null);
      if (cancelled) return;
      setRole(r);
      setReady(true);
    });
    const unsub = onAuthChange(async user => {
      const r = await detectUserRole(user);
      if (cancelled) return;
      setRole(r);
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  // Admin precedence wins over vendor (Option A — admins who also have a
  // vendor row see Admin tab, not Booth). detectUserRole returns "admin"
  // before "vendor" already, so showAdminTab + showBoothTab are naturally
  // mutually exclusive; the conditionals are written that way for clarity.
  const showAdminTab = role === "admin";
  const showBoothTab = role === "vendor";

  const badgeLabel = (n: number) => n > 99 ? "99+" : n > 9 ? "9+" : String(n);

  type TabDef = {
    key: NavTab;
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: boolean;
  };

  // Tab order: Home → Saved → Map → [Booth | Admin, role-conditional].
  // Saved holds the stable 2nd position so muscle memory transfers across
  // role transitions. Map is universal in slot 3 (R18, session 121). The
  // role tab is the "specialty rightmost" when present — whichever
  // surface the role unlocks: vendor → Booth (manage their work), admin
  // → Admin (platform controls). Guest/shopper sees 3-tab; vendor + admin
  // see 4-tab with the role-tab rightmost.
  const tabs: TabDef[] = [
    {
      key: "home", label: "Home", href: "/",
      icon: <Home size={21} strokeWidth={2.0} />,
    },
    {
      key: "flagged", label: "Saved", href: "/flagged",
      icon: <FlagGlyph size={21} strokeWidth={2.0} />, badge: true,
    },
    {
      key: "map", label: "Map", href: "/map",
      icon: <MapPin size={21} strokeWidth={2.0} />,
    },
    ...(showBoothTab ? [{
      key: "booth" as NavTab, label: "Booth", href: "/my-shelf",
      icon: <Store size={21} strokeWidth={2.0} />,
    }] : []),
    ...(showAdminTab ? [{
      key: "admin" as NavTab, label: "Admin", href: "/admin",
      icon: <Shield size={21} strokeWidth={2.0} />,
    }] : []),
  ];

  const navStyle: React.CSSProperties = {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 430, zIndex: 100,
    background: C.bg,
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
