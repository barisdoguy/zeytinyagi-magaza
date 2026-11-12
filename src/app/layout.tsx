import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
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

const FONTS = ["fraunces-latin-opsz-normal", "fraunces-latin-ext-opsz-normal", "instrument-sans-latin-wght-normal", "instrument-sans-latin-ext-wght-normal"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Yazı tipi geç gelirse başlıklar yeniden sarılıp sayfayı kaydırır; önden yükleme bunu önler.
  for (const font of FONTS) preload(`/fonts/${font}.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="tr">
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
