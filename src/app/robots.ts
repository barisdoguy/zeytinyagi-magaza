import type { MetadataRoute } from "next";
import { getSite } from "@/lib/site";

// Derleme anında değil, her istekte güncel ayar ve veriyle üretilir.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const { siteUrl, indexable } = getSite();
  // SITE_INDEXABLE=true olana dek site arama motorlarına tümüyle kapalıdır.
  if (!indexable) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/yonetim", "/api/", "/sepet", "/odeme", "/siparis"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
