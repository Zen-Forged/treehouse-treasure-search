// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Dancing_Script, Inter, Lora } from "next/font/google";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";
import { FindSessionProvider } from "@/hooks/useSession";

// DevAuthPanel is dev-only — never rendered in production
const DevAuthPanel = process.env.NODE_ENV === "development"
  ? require("@/components/DevAuthPanel").default
  : () => null;

// Typography — loaded once at root so every screen can reference the CSS
// variables via `font-family: var(--font-lora)` etc. without per-page font
// requests. See docs/design-system.md §Typography.
//
// Session 82 — Lora replaces IM Fell project-wide. IM Fell's letterpress
// glyph variability hurt readability at body sizes (find-tile captions,
// form labels). Lora is screen-optimized, has a strong italic, and keeps
// editorial warmth.
const lora = Lora({
  weight: ["400", "500", "600"],
  style:  ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

// Session 120 — Dancing Script for the rich PostcardMallCard "select
// location" hand-drawn label. Used sparingly + intentionally for
// personal-touch labels only — do not let this font sprawl across the app.
// Replaced a vestigial Caveat preload that was never referenced anywhere.
const dancingScript = Dancing_Script({
  weight: ["500"],
  subsets: ["latin"],
  variable: "--font-dancing-script",
  display: "swap",
});

// Session 138 (v2 Arc 1.1) — Cormorant Garamond replaces Lora project-wide
// per Q1 (a) of the v2 visual migration. Single editorial serif family for
// upright + italic across all v2 surfaces. First consumer: Saved page
// (`/flagged`) primitives in v2 Arc 1.2. v1 Lora stays loaded alongside
// until v2 Arc 7 cleanup confirms zero consumers remain.
// See docs/v2-visual-migration.md + docs/saved-v2-redesign-design.md.
const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  style:  ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

// Session 138 (v2 Arc 1.1) — Inter replaces FONT_SYS as the canonical sans
// companion per Q1.1 (lock-by-inheritance from mockup spec). Used for
// metadata / prices / buttons / navigation across all v2 surfaces.
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    title: "Treehouse Finds",
    description: "Embrace the search. Treasure the find.",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Treehouse Finds",
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e4d2b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${dancingScript.variable} ${cormorant.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Treehouse Finds" />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: "100vh", background: "#f2ecd8" }}>
        <FindSessionProvider>
          {children}
          <DevAuthPanel />
        </FindSessionProvider>
      </body>
    </html>
  );
}
