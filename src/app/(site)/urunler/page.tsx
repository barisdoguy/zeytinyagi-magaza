import type { Metadata } from "next";
import { ProductCard } from "@/components/site/ProductCard";
import { listStorefrontProducts } from "@/lib/catalog";
import { getSite } from "@/lib/site";

export function generateMetadata(): Metadata {
  const { content } = getSite();
  return {
    title: "Ürünler",
    description: `${content.brandName} ürünleri: cam şişe, teneke ve set seçenekleri. Fiyat, hacim ve stok bilgisi her ürün sayfasında.`,
    alternates: { canonical: "/urunler" },
  };
}

export default function ProductsPage() {
  const products = listStorefrontProducts();
  return (
    <>
      <section className="grain relative bg-korfez py-14 text-kirec md:py-20">
        <div className="wrap relative z-10">
          <p className="eyebrow text-altin">Ürünler</p>
          <h1 className="mt-4 max-w-3xl text-5xl md:text-6xl">Şişede, tenekede, kutuda</h1>
          <p className="mt-5 max-w-2xl text-lg text-kirec/85">
            Her ürün sayfasında hacim, fiyat, stok durumu ve teslimat bilgisi yer alır. Fiyatı henüz açıklanmamış ürünler “yakında” olarak görünür.
          </p>
        </div>
      </section>
      <section className="py-14 md:py-20">
        <div className="wrap">
          {products.length > 0 ? (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <h2 className="text-3xl">Henüz ürün eklenmedi</h2>
              <p className="mt-3">Ürünlerimiz çok yakında burada olacak.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
