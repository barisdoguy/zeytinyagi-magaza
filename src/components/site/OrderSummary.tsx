import { formatTl } from "@/lib/money";

export type SummaryTotals = { subtotalKurus: number; discountKurus: number; shippingKurus: number; totalKurus: number };

/** Ara toplam, indirim, kargo ve genel toplamı her adımda aynı biçimde gösterir. */
export function TotalsList({
  totals,
  couponCode,
  shippingConfigured = true,
}: {
  totals: SummaryTotals;
  couponCode?: string | null;
  shippingConfigured?: boolean;
}) {
  return (
    <dl className="space-y-2">
      <div className="flex justify-between gap-4">
        <dt>Ara toplam</dt>
        <dd className="font-semibold">{formatTl(totals.subtotalKurus)}</dd>
      </div>
      {totals.discountKurus > 0 && (
        <div className="flex justify-between gap-4 text-cam">
          <dt>İndirim{couponCode ? ` (${couponCode})` : ""}</dt>
          <dd className="font-semibold">−{formatTl(totals.discountKurus)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt>Kargo</dt>
        <dd className="font-semibold">
          {!shippingConfigured ? <span className="pending">tanımlanmadı</span> : totals.shippingKurus === 0 ? "Ücretsiz" : formatTl(totals.shippingKurus)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t-2 border-korfez pt-3">
        <dt className="font-semibold">Ödenecek toplam</dt>
        <dd className="font-display text-3xl">{formatTl(totals.totalKurus)}</dd>
      </div>
      <p className="text-sm text-korfez/70">Fiyatlara KDV dahildir. Bu tutarın dışında ek ücret alınmaz.</p>
    </dl>
  );
}
