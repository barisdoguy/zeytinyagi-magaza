import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/site/AddToCart";
import { priceSummary } from "@/components/site/ProductCard";
import { ProductVisual } from "@/components/site/ProductVisual";
import { Paragraphs } from "@/components/site/RichText";
import { getStorefrontProduct, hasPrice, isOnSale, isPurchasable } from "@/lib/catalog";
import { mediaUrl } from "@/lib/media";
import { formatTl } from "@/lib/money";
import { getSite } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getStorefrontProduct(slug);
  if (!product) return { title: "Ürün bulunamadı" };
  const price = priceSummary(product);
  return {
    title: product.name,
    description: [product.summary, price].filter(Boolean).join(" — ") || product.name,
    alternates: { canonical: `/urunler/${product.slug}` },
    // Fiyatı açıklanmamış taslak ürünler arama motorlarına ve reklama kapalıdır.
    robots: isOnSale(product) ? undefined : { index: false, follow: true },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getStorefrontProduct(slug);
  if (!product) notFound();
  const { content: c, siteUrl } = getSite();
  const onSale = isOnSale(product);
  const features = product.features.split("\n").map((f) => f.trim()).filter(Boolean);
  const options = product.variants.map((v) => ({
    id: v.id,
    label: v.label,
    price: onSale && hasPrice(v) ? formatTl(v.priceKurus as number) : null,
    stock: v.stock,
    purchasable: onSale && isPurchasable(v),
  }));

  // Yapılandırılmış veri yalnızca gerçek, fiyatı girilmiş ürünlerden üretilir.
  const jsonLd = onSale
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.summary || undefined,
        image: product.imageFile ? `${siteUrl}${mediaUrl(product.imageFile)}` : undefined,
        brand: { "@type": "Brand", name: c.brandName },
        offers: product.variants.filter(hasPrice).map((v) => ({
          "@type": "Offer",
          name: v.label,
          sku: v.sku || undefined,
          price: ((v.priceKurus as number) / 100).toFixed(2),
          priceCurrency: "TRY",
          availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${siteUrl}/urunler/${product.slug}`,
        })),
      }
    : null;

  return (
    <div className="wrap py-10 md:py-16">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <nav aria-label="Sayfa yolu" className="mb-6 text-[0.9375rem]">
        <Link href="/urunler" className="font-semibold underline underline-offset-4">Ürünler</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="md:sticky md:top-28 md:self-start">
          <ProductVisual product={product} priority />
        </div>

        <div>
          <p className="eyebrow text-altin-koyu">{c.region}</p>
          <h1 className="mt-3 text-5xl md:text-6xl">{product.name}</h1>
          {product.summary && <p className="mt-4 text-xl text-korfez/85">{product.summary}</p>}
          {!onSale && (
            <p className="mt-5 rounded-2xl border-2 border-dashed border-korfez/40 px-4 py-3 font-semibold">
              Bu ürün henüz satışa açılmadı. Fiyat ve stok bilgisi eklendiğinde buradan sipariş verebilirsiniz.
            </p>
          )}

          <div className="mt-8">
            <AddToCart variants={options} />
            {onSale && <p className="field-help mt-3">Fiyatlara KDV dahildir. Kargo ücreti sepette ayrıca gösterilir.</p>}
          </div>

          <section aria-labelledby="teslimat-baslik" className="card mt-8 p-6">
            <h2 id="teslimat-baslik" className="text-2xl">Teslimat ve iade</h2>
            <dl className="mt-4 space-y-3 text-[0.9375rem]">
              <div>
                <dt className="font-semibold">Teslimat</dt>
                <dd>{c.deliveryNote || <span className="pending">Teslimat süresi eklenecek</span>}{c.carrierName && ` Kargo firması: ${c.carrierName}.`}</dd>
              </div>
              <div>
                <dt className="font-semibold">Kargo ücreti</dt>
                <dd>
                  {c.shippingFeeTl ? `Sabit kargo ücreti: ${c.shippingFeeTl} TL.` : <span className="pending">Kargo ücreti eklenecek</span>}
                  {c.freeShippingThresholdTl && ` ${c.freeShippingThresholdTl} TL ve üzeri siparişlerde kargo ücretsiz.`}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">İade</dt>
                <dd>{c.returnNote || <span className="pending">İade koşulları özeti eklenecek</span>}</dd>
              </div>
            </dl>
            <Link href="/teslimat-ve-iade" className="mt-4 inline-block font-semibold underline underline-offset-4">Teslimat ve iade koşullarının tamamı</Link>
          </section>

          <section aria-labelledby="ozellik-baslik" className="mt-10">
            <h2 id="ozellik-baslik" className="text-3xl">Ürün özellikleri</h2>
            {features.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex gap-3"><span className="text-altin-koyu" aria-hidden="true">◆</span>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-4"><span className="pending">Ürün özellikleri eklenecek</span></p>
            )}
            {product.description && (
              <div className="mt-6 space-y-4 text-korfez/90"><Paragraphs text={product.description} /></div>
            )}
            <p className="mt-6">
              <Link href="/#kunye" className="font-semibold underline underline-offset-4">Yağın künyesi</Link> ve{" "}
              <Link href="/hikayemiz" className="font-semibold underline underline-offset-4">üretim hikâyemiz</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
