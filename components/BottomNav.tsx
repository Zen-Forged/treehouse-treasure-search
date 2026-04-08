// components/BottomNav.tsx
// Fixed bottom navigation bar — Home and Flagged only.

"use client";

import { useRouter } from "next/navigation";
import { Home, Flag } from "lucide-react";

type Tab = "home" | "flagged" | null;

interface BottomNavProps {
  active?: Tab;
  flaggedCount?: number;
}

const C = {
  bg:          "rgba(240,237,230,0.97)",
  border:      "rgba(26,26,24,0.10)",
  textMuted:   "#8a8478",
  textPrimary: "#1a1a18",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.10)",
};

export default function BottomNav({ active = null, flaggedCount = 0 }: BottomNavProps) {
  const router = useRouter();

  const tabs: { key: Tab; label: string; icon: React.ReactNode; href: string }[] = [
    {
      key: "home",
      label: "Home",
      href: "/",
      icon: <Home size={20} strokeWidth={1.8} />,
    },
    {
      key: "flagged",
      label: "Flagged",
      href: "/flagged",
      icon: <Flag size={20} strokeWidth={1.8} />,
    },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        zIndex: 100,
        background: C.bg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "stretch",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const showBadge = tab.key === "flagged" && flaggedCount > 0;

        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.href)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "10px 0 8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isActive ? C.green : C.textMuted,
              position: "relative",
              transition: "color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Icon wrapper — active gets a light green pill behind it */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 26,
                borderRadius: 13,
                background: isActive ? C.greenLight : "transparent",
                transition: "background 0.18s",
              }}
            >
              {tab.icon}

              {/* Badge */}
              {showBadge && (
                <div
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: C.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#fff",
                    border: "1.5px solid rgba(240,237,230,0.97)",
                    lineHeight: 1,
                  }}
                >
                  {flaggedCount > 9 ? "9+" : flaggedCount}
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.2px",
                lineHeight: 1,
                color: "inherit",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
