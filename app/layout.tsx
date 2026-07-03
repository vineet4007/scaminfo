import type { Metadata } from "next";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://scaminfo.local"),
  title: {
    default: "ScamInfo - Scam Awareness and Visitor Analytics",
    template: "%s | ScamInfo",
  },
  description:
    "ScamInfo teaches people how to spot online scams and provides privacy-conscious visitor analytics for awareness campaigns.",
  keywords: [
    "scam awareness",
    "crypto scams",
    "romance scams",
    "fake websites",
    "visitor analytics",
    "URL verification",
  ],
  openGraph: {
    title: "ScamInfo",
    description: "Scam education, URL verification, and first-party visitor analytics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-slate-900">
        <AnalyticsTracker />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
