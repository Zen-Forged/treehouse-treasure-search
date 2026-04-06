// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FindSessionProvider } from "@/hooks/useSession";

export const metadata: Metadata = {
  title: "Treehouse",
  description: "Embrace the search. Treasure the find.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Treehouse Search",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050f05",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-forest-950 text-bark-100 font-body antialiased min-h-screen">
        <FindSessionProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col">
            {children}
          </div>
        </FindSessionProvider>
      </body>
    </html>
  );
}
