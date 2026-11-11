import type { MetadataRoute } from "next";
import { isOnSale, listStorefrontProducts } from "@/lib/catalog";
import { LEGAL_SLUGS } from "@/lib/content/seed-pages";
import { listPages } from "@/lib/pages";
import { getSite } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const { siteUrl, indexable } = getSite();
  if (!indexable) return [];
  const published = listPages().filter((p) => p.status === "published");
  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/urunler`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/hikayemiz`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/sss`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/iletisim`, changeFrequency: "yearly", priority: 0.4 },
    // Yalnızca satışa açık (fiyatı girilmiş) ürünler
    ...listStorefrontProducts()
      .filter(isOnSale)
      .map((p) => ({ url: `${siteUrl}/urunler/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...published
      .filter((p) => (LEGAL_SLUGS as readonly string[]).includes(p.slug))
      .map((p) => ({ url: `${siteUrl}/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
