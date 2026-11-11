import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import type { Variant } from "@/lib/db/schema";
import { kurusToInput } from "@/lib/money";
import { deleteVariant, saveVariant } from "@/app/yonetim/actions";

export function VariantForm({ productId, variant }: { productId: number; variant?: Variant }) {
  const p = variant ? `v${variant.id}-` : "yeni-";
  return (
    <div className="rounded-2xl border border-korfez/15 p-4">
      <ActionForm action={saveVariant} className="space-y-4">
        <input type="hidden" name="productId" value={productId} />
        {variant && <input type="hidden" name="id" value={variant.id} />}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field idPrefix={p} name="label" label="Seçenek adı" required defaultValue={variant?.label} placeholder="500 ml cam şişe" className="sm:col-span-2" />
          <Field idPrefix={p} name="priceTl" label="Satış fiyatı (KDV dahil, TL)" inputMode="decimal" defaultValue={kurusToInput(variant?.priceKurus)} placeholder="Henüz girilmedi" help="Boşken satın alınamaz." />
          <Field idPrefix={p} name="stock" label="Stok (adet)" inputMode="numeric" required defaultValue={String(variant?.stock ?? 0)} />
          <Field idPrefix={p} name="volumeMl" label="Hacim (ml)" inputMode="numeric" defaultValue={variant?.volumeMl != null ? String(variant.volumeMl) : ""} />
          <Field idPrefix={p} name="packaging" label="Ambalaj" defaultValue={variant?.packaging} placeholder="Cam şişe" />
          <Field idPrefix={p} name="sku" label="Stok kodu" defaultValue={variant?.sku} />
          <Field idPrefix={p} name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={String(variant?.sortOrder ?? 0)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked={variant?.active ?? true} className="h-5 w-5" /> Sitede göster
          </label>
          <SubmitButton className="btn btn-sm btn-dark" pendingLabel="Kaydediliyor…">{variant ? "Seçeneği kaydet" : "Seçenek ekle"}</SubmitButton>
        </div>
      </ActionForm>
      {variant && (
        <form action={deleteVariant} className="mt-3 border-t border-korfez/10 pt-3 text-right">
          <input type="hidden" name="id" value={variant.id} />
          <button type="submit" className="text-sm font-semibold text-kiremit-koyu underline underline-offset-4">Bu seçeneği sil</button>
        </form>
      )}
    </div>
  );
}
