import Link from "next/link";
import { hasPrice, isOnSale, isPurchasable, type ProductWithVariants } from "@/lib/catalog";
import { formatTl } from "@/lib/money";
import { ProductVisual } from "./ProductVisual";

export function priceSummary(product: ProductWithVariants): string | null {
  if (!isOnSale(product)) return null;
  const prices = product.variants.filter(hasPrice).map((v) => v.priceKurus as number);
  const min = Math.min(...prices);
  return prices.some((p) => p !== min) ? `${formatTl(min)}’den başlayan fiyatlarla` : formatTl(min);
}

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const price = priceSummary(product);
  const inStock = product.variants.some(isPurchasable);
  return (
    <article className="group flex flex-col">
      <Link href={`/urunler/${product.slug}`} className="block rounded-[1.5rem] transition-transform duration-300 ease-out-soft group-hover:-translate-y-1" tabIndex={-1} aria-hidden="true">
        <ProductVisual product={product} />
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-2xl">
          <Link href={`/urunler/${product.slug}`} className="underline-offset-4 hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.summary && <p className="mt-1 text-korfez/75">{product.summary}</p>}
        <p className="mt-3 font-semibold">
          {price ? (
            <>
              {price}
              {!inStock && <span className="ml-2 text-sm font-semibold text-kiremit-koyu">Stokta yok</span>}
            </>
          ) : (
            <span className="pending">Fiyat yakında</span>
          )}
        </p>
      </div>
    </article>
  );
}
