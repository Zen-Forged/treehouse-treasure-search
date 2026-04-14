// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FindSessionProvider } from "@/hooks/useSession";

// DevAuthPanel is dev-only — never rendered in production
const DevAuthPanel = process.env.NODE_ENV === "development"
  ? require("@/components/DevAuthPanel").default
  : () => null;

export const metadata: Metadata = {
  title: "Treehouse",
  description: "Embrace the search. Treasure the find.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Treehouse",
  },
};

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
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Treehouse" />
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: "100vh", background: "#f0ede6" }}>
        <FindSessionProvider>
          {children}
          <DevAuthPanel />
        </FindSessionProvider>
      </body>
    </html>
  );
}
