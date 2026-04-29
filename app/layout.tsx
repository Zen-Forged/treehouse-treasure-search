// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Caveat, Lora } from "next/font/google";
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

const caveat = Caveat({
  weight: ["500"],
  subsets: ["latin"],
  variable: "--font-caveat",
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
    <html lang="en" className={`${lora.variable} ${caveat.variable}`}>
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
      <body style={{ margin: 0, padding: 0, minHeight: "100vh", background: "#e8ddc7" }}>
        <FindSessionProvider>
          {children}
          <DevAuthPanel />
        </FindSessionProvider>
      </body>
    </html>
  );
}
