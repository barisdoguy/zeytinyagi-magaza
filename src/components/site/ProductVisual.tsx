import { formatVolume, type ProductWithVariants } from "@/lib/catalog";
import { mediaUrl } from "@/lib/media";

/**
 * Ürün görseli. Fotoğraf yoksa uydurma bir ambalaj çizmek yerine hacimleri
 * gösteren tipografik bir yer tutucu kullanılır.
 */
export function ProductVisual({ product, priority = false }: { product: ProductWithVariants; priority?: boolean }) {
  if (product.imageFile) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- panelden yüklenen, önceden WebP'ye çevrilmiş görsel
      <img
        src={mediaUrl(product.imageFile)}
        alt={product.imageAlt || product.name}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="aspect-[4/5] w-full rounded-[1.5rem] object-cover"
      />
    );
  }
  const volumes = [...new Set(product.variants.map((v) => formatVolume(v.volumeMl)).filter(Boolean))];
  return (
    <div className="grain relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-[1.5rem] bg-korfez p-6 text-kirec">
      <svg viewBox="0 0 200 260" className="absolute -right-6 -bottom-10 h-[78%] opacity-90" aria-hidden="true">
        <path d="M100 8c44 62 74 104 74 148a74 74 0 1 1-148 0C26 112 56 70 100 8z" fill="#e0a526" />
        <path d="M62 160a40 40 0 0 0 28 36" fill="none" stroke="#f3ede0" strokeOpacity="0.7" strokeWidth="9" strokeLinecap="round" />
      </svg>
      <p className="eyebrow relative text-altin">{volumes.length > 0 ? volumes.join(" · ") : product.variants[0]?.packaging || "Set"}</p>
      <p className="relative max-w-[11rem] text-sm font-semibold text-kirec/90">
        <span className="pending">Ürün fotoğrafı eklenecek</span>
      </p>
    </div>
  );
}
