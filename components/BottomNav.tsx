// components/BottomNav.tsx
// Fixed bottom navigation — Home, Your Finds, My Shelf.

"use client";

import { useRouter } from "next/navigation";
import { Home, Store } from "lucide-react";
import PiLeafIcon from "@/components/PiLeafIcon";

type Tab = "home" | "flagged" | "my-shelf" | null;

interface BottomNavProps {
  active?: Tab;
  flaggedCount?: number;
}

const C = {
  bg:          "rgba(245,242,235,0.97)",
  border:      "rgba(26,24,16,0.09)",
  textMuted:   "#8a8476",
  textPrimary: "#1c1a14",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.10)",
};

export default function BottomNav({ active = null, flaggedCount = 0 }: BottomNavProps) {
  const router = useRouter();

  const tabs: { key: Tab; label: string; icon: React.ReactNode; href: string }[] = [
    { key: "home",     label: "Home",       href: "/",        icon: <Home size={21} strokeWidth={1.7} /> },
    { key: "flagged",  label: "Your Finds", href: "/flagged", icon: <PiLeafIcon size={21} strokeWidth={1.7} /> },
    { key: "my-shelf", label: "My Shelf",   href: "/my-shelf",icon: <Store size={21} strokeWidth={1.7} /> },
  ];

  // Badge label — single digit raw, 10+: "9+", cap at 99
  const badgeLabel = (n: number) =>
    n > 99 ? "99+" : n > 9 ? "9+" : String(n);

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, zIndex: 100,
      background: C.bg,
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      borderTop: `1px solid ${C.border}`,
      display: "flex", alignItems: "stretch",
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
    }}>
      {tabs.map((tab) => {
        const isActive  = active === tab.key;
        const showBadge = tab.key === "flagged" && flaggedCount > 0;

        return (
          <button key={tab.key} onClick={() => router.push(tab.href)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "12px 0 10px",
              background: "none", border: "none", cursor: "pointer",
              color: isActive ? C.green : C.textMuted,
              position: "relative", transition: "color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}>
            <div style={{
              position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 28, borderRadius: 14,
              background: isActive ? C.greenLight : "transparent",
              transition: "background 0.18s",
            }}>
              {tab.icon}
              {showBadge && (
                <div style={{
                  position: "absolute", top: -4, right: -4,
                  minWidth: 16, height: 16,
                  paddingLeft: 4, paddingRight: 4,
                  borderRadius: 8,
                  background: C.green,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff",
                  border: "1.5px solid rgba(245,242,235,0.97)",
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
