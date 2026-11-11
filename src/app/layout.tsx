import type { Metadata, Viewport } from "next";
import { getSite } from "@/lib/site";
import "./globals.css";

// Tüm içerik veritabanından gelir ve sepet çerezine bağlıdır: her istek sunucuda işlenir.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const { content, siteUrl, indexable } = getSite();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${content.brandName} — ${content.tagline}`, template: `%s · ${content.brandName}` },
    description: content.heroText,
    applicationName: content.brandName,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { siteName: content.brandName, locale: "tr_TR", type: "website" },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: "#12263a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
