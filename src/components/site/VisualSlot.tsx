import type { ReactNode } from "react";
import { mediaUrl } from "@/lib/media";

/**
 * Fotoğraf yuvası: panelden gerçek fotoğraf yüklendiyse onu, yoksa açıkça
 * etiketlenmiş illüstrasyonu gösterir.
 */
export function VisualSlot({
  image,
  alt,
  fallback,
  className = "",
}: {
  image: string | null;
  alt: string;
  fallback: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`relative overflow-hidden rounded-[1.75rem] ${className}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- panelden yüklenen, önceden WebP'ye çevrilmiş görsel
        <img src={mediaUrl(image)} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <>
          <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full">{fallback}</div>
          <figcaption className="absolute bottom-3 left-3 rounded-full bg-korfez/85 px-3 py-1 text-xs font-semibold text-kirec">
            İllüstrasyon · gerçek fotoğraf eklenecek
          </figcaption>
        </>
      )}
    </figure>
  );
}
