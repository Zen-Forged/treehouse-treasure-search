import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ScanProvider } from "@/hooks/useScanSession";

export const metadata: Metadata = {
  title: "Treehouse Treasure Search",
  description: "Know if it's worth buying before you check out.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Treehouse",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#061406",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-forest-950 text-bark-100 font-body antialiased min-h-screen">
        <ScanProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col">
            {children}
          </div>
        </ScanProvider>
      </body>
    </html>
  );
}
