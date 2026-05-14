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
//   Session 134:               "Home" → "Explore" + Lucide Home → MdOutlineExplore.
//                              The leftmost tab's job is the same (entry point
//                              to the find feed) but the verb sharpens the
//                              digital-to-physical thesis: shoppers don't go
//                              "home" in this app, they "explore" — the
//                              landscape of finds across the active mall
//                              network. /shelf/[slug]'s in-tile "Enter Booth"
//                              link in the same session reuses the same
//                              vocabulary. Icon shifts from a literal house
//                              glyph to a compass (MdOutlineExplore) for the
//                              same reason. Tab key remains "home" + href "/"
//                              (NavTab type unchanged) — the rename is
//                              user-facing only, no callsite churn.
//   Session 157:               Home · Saved · [Booth | Admin] · Profile
//                              (3-4 tabs, role-conditional middle slot).
//                              Profile relocates from masthead-left (session
//                              109 + 120) to BottomNav far-right per David's
//                              "we've been refining and I think this makes
//                              sense now" ask. Auth chrome relocation #4
//                              across project history (≤87 right slot → 90
//                              Profile tab → 109 masthead-left → 120 masthead-
//                              left Home-only → 157 BottomNav far-right).
//                              The reason this time is different from session
//                              90's: Map is no longer a tab (drawer chrome +
//                              strip toggle replaced it session 155); Variant
//                              Z floating pill exists (session 155 D6);
//                              Profile makes sense as a peer of Home / Saved /
//                              role-tab. Saved still holds the stable 2nd
//                              position; role-specialty slot (Booth/Admin)
//                              moves to second-from-rightmost when present,
//                              Profile takes far-right. Profile uses Lucide
//                              CircleUser (same icon previously in masthead-
//                              left bubble) so the visual identity carries.
//                              Routes to /me when authed (role !== "none"),
//                              /login when guest — same routing logic as the
//                              retired MastheadProfileButton.
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
//
// Session 154 — pill bumped 20→24 minWidth + 20→22 height + 10→11 radius +
// font 12→13 per David's "increase size + allow full number to show" ask.
// 9+ cap retired (Interpretation 1 — Shape A): "47" / "85" now read
// literally; 99+ ceiling preserved as defensive cap for theoretical
// 3-digit save counts. Power users crossing 99 dials cap to 999+ if needed.

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MdOutlineExplore } from "react-icons/md";
import { PiLeaf, PiStorefront } from "react-icons/pi";
import { FONT_NUMERAL, v2 } from "@/lib/tokens";
import { useUserRole } from "@/lib/useUserRole";

// Session 159 — Profile tab + role-conditional Booth/Admin tabs all retire.
// David Q3 (session-159 opener): "Relocate the profile icon to where the
// Share icon use to reside in the masthead. Propogates on all pages.
// Retire admin as you mentioned via profile link when logged in."
// BottomNav collapses to fixed 2 tabs (Explore + Saved) for all viewers.
//
// Session 160 — David iPhone QA Finding 2 partial reversal of session 159:
// vendor sees Booth tab in rightmost slot (3-tab variant). Admin still gets
// no nav tab addition; admin reaches /admin via the masthead-right Profile
// button directly (Commit 4 in session 160 added that routing branch).
// Shopper + guest stay 2-tab universal.
//
// 7th iteration of R10 D1 history (Profile is OUT, vendor Booth IS BACK):
//   Guest / shopper:  Explore · Saved                          (2-tab)
//   Vendor:           Explore · Saved · Booth                  (3-tab,
//                                            Booth rightmost per session-114
//                                            "rightmost = role-specialty
//                                            when present" rule)
//   Admin:            Explore · Saved                          (2-tab;
//                                            admin role-specialty demotes
//                                            from nav-tab to Profile-button
//                                            destination per Commit 4)
//
// History note: "login" / "admin" / "profile" members still preserved in
// NavTab type (no consumer renders them; type stays for callsite compat).
export type NavTab = "home" | "map" | "flagged" | "booth" | "admin" | "login" | "profile" | null;

interface BottomNavProps {
  active?: NavTab;
  flaggedCount?: number;
}

const C = {
  // Session 140 — bg migrates to v2.bg.main (#F7F3EB) alongside tab chrome
  // unification (StickyMasthead + tabs layout also migrate). Was hardcoded
  // #f2ecd8 since session 132 frosted-glass retire (Shape C — content
  // bleed-through during scroll was producing perceived flicker).
  bg:         v2.bg.main,
  border:     "rgba(42,26,10,0.18)",     // v1.1d — inkHairline for visible separation
  textMuted:  "#6b5538",                 // v1.inkMuted
  green:      "#1e4d2b",
  greenLight: "rgba(30,77,43,0.10)",
};

export default function BottomNav({ active = null, flaggedCount = 0 }: BottomNavProps) {
  const router    = useRouter();
  const roleState = useUserRole();

  const badgeLabel = (n: number) => n > 99 ? "99+" : String(n);

  type TabDef = {
    key: NavTab;
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: boolean;
  };

  // Session 160 — vendor Booth tab restored at rightmost slot (3-tab
  // variant for role==="vendor"). Admin + shopper + guest stay 2-tab.
  // Partial revival of the session-159-retired role-detection state
  // machine — scope-bounded to vendor only (admin role detection lives
  // in useUserRole at the hook layer and feeds MastheadProfileButton
  // routing in Commit 4, not BottomNav).
  //
  // Loading window — useUserRole returns role="none" + isLoading=true
  // on first mount; vendors briefly see 2-tab before role hydrates to
  // 3-tab. The transition fires once per session (BottomNav is mounted
  // in the persistent (tabs)/layout.tsx so doesn't remount on tab nav).
  // Pulse bounded; if iPhone QA flags it, gate render via isLoading.
  const showBoothTab = roleState.role === "vendor";

  const tabs: TabDef[] = [
    {
      key: "home", label: "Explore", href: "/",
      icon: <MdOutlineExplore size={22} />,
    },
    {
      key: "flagged", label: "Saved", href: "/flagged",
      icon: <PiLeaf size={21} />, badge: true,
    },
    // Session 160 — Booth at rightmost slot per session-114 "rightmost =
    // role-specialty when present" rule. /my-shelf already passes
    // active="booth" (carryover from session 113); active highlight
    // works without changes to consumer surfaces.
    ...(showBoothTab ? [{
      key: "booth" as NavTab,
      label: "Booth",
      href:  "/my-shelf",
      icon:  <PiStorefront size={22} />,
    }] : []),
  ];

  // Session 155 — Variant Z: compact center-floating pill (D6 lock).
  //
  // Session 157 Review Board Saved #1 — bg color migrates from
  // rgba(247,243,235,0.92) (translucent v2.bg.main) to the v2.surface.input
  // variable (#FFFCF5 as of Review Board #2 token swap). David —
  // "change bg color of nav bar to match the field input variable #FFFCF5."
  // Effect: nav bar now reads as the same surface tier as input fields +
  // card surfaces — visual unity across discoverable surfaces. Solid value
  // retires the prior translucent + backdrop-blur "floating glass" effect;
  // floating identity now carried by the pill's elevated shadow + radius
  // + bottom offset alone, not surface translucence.
  const navStyle: React.CSSProperties = {
    position: "fixed",
    // Session 156 — David iPhone QA: "add more padding under the nav bar so
    // it's not so close to the bottom of the screen." Bumped 14 -> 22 so the
    // floating pill breathes above the bottom edge instead of crowding it.
    bottom: "max(22px, calc(env(safe-area-inset-bottom, 0px) + 22px))",
    left: "50%", transform: "translateX(-50%)",
    zIndex: 100,
    background: v2.surface.input,
    // Session 159 — David verbatim: "3px padding (top, right, left, bottom)
    // with the outermost container radius matching at 18 ... thin stroke
    // around the navbar component and increase the intensity of the drop
    // shadow, more like what we have on the thumbnails on the explore page."
    // Pre-session-159: padding "9px 22px" / radius 24 / border alpha 0.10 /
    // boxShadow "0 6px 18px rgba(0,0,0,0.08)" — the floating-pill weight
    // sat too quiet against v2.bg.main page bg + the rich polaroid shadow
    // on Home tiles dominated visual hierarchy.
    // Now: padding 3 hugs the inner pills tight; radius 18 matches the
    // outer-container geometry David sketched; border alpha 0.18 (same as
    // legacy C.border value already in this file) reads as a deliberate
    // stroke instead of a tonal blur; boxShadow inlines the same value as
    // v1.shadow.polaroid (`--th-v1-shadow-polaroid` in globals.css) — the
    // explore-tile shadow vocabulary David referenced. Inlined rather than
    // imported because the polaroid token currently lives in v1 namespace +
    // this is the second consumer; primitive extraction trigger if a 3rd
    // consumer surfaces.
    border: "1px solid rgba(42,26,10,0.18)",
    borderRadius: 18,
    boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
    padding: 3,
    display: "flex", alignItems: "center", gap: 24,
  };

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
              // flex: 1 retires — pill is intrinsic width; each tab sizes to
              // its icon + label. gap on parent nav handles spacing.
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 0, padding: 0,
              background: "none", border: "none", cursor: "pointer",
              color: labelColor,
              position: "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Session 159 — David verbatim: "No scaling of selected items
                or animations needed other than the highlight box sliding
                left or right." Pre-session-159 the active inner pill bg +
                padding crossfaded with `transition: "background 0.18s ease,
                padding 0.18s ease"` — two pills appeared/disappeared at
                their tab positions, not a single highlight box sliding
                between them. New shape: padding is CONSTANT 5px/12px on
                every tab (geometry unified so the highlight doesn't change
                shape mid-slide), and the green-tinted bg is rendered via a
                single `<motion.div layoutId="bottomnav-active-pill">` that
                framer-motion morphs from the old active tab's wrapper into
                the new active tab's wrapper on tab change. Spring transition
                (stiffness 500 / damping 40) gives a crisp snap without
                under-damped overshoot.

                Tradeoff: inactive tabs now reserve 5/12 of padding each, so
                each tab's intrinsic width grows by ~34px vs the pre-159
                inactive shape. The compact-padding-3 outer container from
                Commit 2 absorbs this; the overall pill still reads
                "compact" because the outer container hugs the inner pills
                at 3px breathing room.

                Layout note — `<motion.div layoutId>` requires both possible
                positions to be mounted in the same React tree on each
                render. They are: every tab button always renders, only
                one carries the motion.div at any given time. Framer-motion
                handles the cross-button morph automatically. */}
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                // Session 157 Review Board #1 — gap 4 → 5 per David's
                // dial after the height: 22 anchor (commit 7a691bd) closed
                // the icon-baseline mismatch.
                gap: 5,
                // Session 159 — padding CONSTANT (was conditional on isActive).
                // See Commit 3 commentary above for layoutId-slide rationale.
                padding: "5px 12px",
                borderRadius: 14,
                position: "relative",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: C.greenLight,
                    borderRadius: 14,
                    zIndex: 0,
                  }}
                />
              )}
              <div style={{
                position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                // Session 157 Review Board #1 — anchor row height at 22 (max
                // icon size in the row).
                height: 22,
                color: iconColor,
                zIndex: 1,
              }}>
                {tab.icon}
                {showBadge && (
                  // R10 session 107 — TNR numeral on the green pill per D4.
                  // Pill geometry: session 89 baseline (20×20+, 10px radius);
                  // session 154 bumped to 24×22+, 11px radius + font 12 → 13 so
                  // 2-digit save counts ("47", "85") read literally instead of
                  // clipping to "9+" (David's session-154 chrome ask, item 3).
                  // Green bg, paper-cream stroke retired.
                  <div style={{
                    // Session 157 Review Board Profile #1 — David supplied
                    // exact style spec verbatim: "position: absolute;
                    // top: -0px; right: -2px; ... border-radius: 20px;".
                    // Shipped as-given per feedback_user_provided_verbatim_values_ship_as_is.
                    // Visual effect: badge centers more over the leaf icon
                    // instead of floating off the top-right corner. Note —
                    // borderRadius 20 caps at height/2 = 11 since the badge
                    // height is 22, so the rendered curve is identical to
                    // borderRadius 11; David's 20 captured verbatim
                    // anyway for spec-fidelity.
                    position: "absolute", top: 0, right: -2,
                    minWidth: 24, height: 22, paddingLeft: 5, paddingRight: 5,
                    borderRadius: 20, background: C.green,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_NUMERAL,
                    fontSize: 13, fontWeight: 600, color: "#fff",
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
                position: "relative", zIndex: 1,
              }}>
                {tab.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
