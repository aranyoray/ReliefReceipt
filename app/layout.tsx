import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReliefReceipt — get a hospital bill waived",
  description:
    "Work out what charity care you qualify for under your state's rules, see the thresholds your household sits against, and send the application letter.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ReliefReceipt" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#124045" },
    { media: "(prefers-color-scheme: dark)", color: "#0a2e33" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
