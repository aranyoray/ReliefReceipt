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
  themeColor: "#1f3d30",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Light only. The design system's dark rules are all guarded behind
  // :root:not([data-theme="light"]), so declaring the theme here turns them
  // off for good, including for a reader whose system is set to dark.
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
