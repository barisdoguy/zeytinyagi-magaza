import { cache } from "react";
import { getSlotImages, loadContent } from "./content/store";
import { getEnv } from "./env";
import { getPaymentState } from "./payments";

/** Bir istek boyunca tek kez okunan site verisi. */
export const getSite = cache(() => {
  const env = getEnv();
  return {
    content: loadContent(),
    images: getSlotImages(),
    siteUrl: env.SITE_URL,
    indexable: env.SITE_INDEXABLE === "true",
    payment: getPaymentState(),
    tracking: { ga4: env.GA4_MEASUREMENT_ID ?? null, metaPixel: env.META_PIXEL_ID ?? null },
  };
});

export const LEGAL_LINKS = [
  { href: "/teslimat-ve-iade", label: "Teslimat ve İade" },
  { href: "/on-bilgilendirme-formu", label: "Ön Bilgilendirme Formu" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/gizlilik-ve-kvkk", label: "Gizlilik ve KVKK" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
] as const;
