import type { Metadata } from "next";
import Link from "next/link";
import { TotalsList } from "@/components/site/OrderSummary";
import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { getCartView } from "@/lib/cart";
import { formatTl } from "@/lib/money";
import { applyCoupon, removeCoupon, updateCartLine } from "../actions";

export const metadata: Metadata = { title: "Sepet", robots: { index: false, follow: false } };

export default async function CartPage() {
  const cart = await getCartView();

  if (cart.lines.length === 0) {
    return (
      <div className="wrap py-20 text-center md:py-28">
        <h1 className="text-5xl">Sepetiniz boş</h1>
        <p className="mx-auto mt-4 max-w-md text-lg">
          {cart.removedCount > 0 ? "Sepetinizdeki ürünler artık satışta olmadığı için kaldırıldı." : "Henüz sepetinize ürün eklemediniz."}
        </p>
        <Link href="/urunler" className="btn btn-primary mt-8">Ürünlere göz at</Link>
      </div>
    );
  }

  return (
    <div className="wrap py-10 md:py-16">
      <h1 className="text-5xl md:text-6xl">Sepetiniz</h1>
      {(cart.removedCount > 0 || cart.quantityAdjusted) && (
        <p role="status" className="mt-6 rounded-xl bg-altin/25 px-4 py-3 font-semibold">
          Stok durumu değiştiği için sepetiniz güncellendi. Lütfen ürünleri ve adetleri kontrol edin.
        </p>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <ul className="divide-y divide-korfez/15 border-y border-korfez/15 lg:col-span-7">
          {cart.lines.map((line) => (
            <li key={line.variantId} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="min-w-0">
                <h2 className="font-display text-2xl">
                  <Link href={`/urunler/${line.productSlug}`} className="hover:underline">{line.productName}</Link>
                </h2>
                <p className="text-korfez/75">{line.variantLabel} · birim fiyat {formatTl(line.unitPriceKurus)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border-2 border-korfez/25" role="group" aria-label={`${line.productName} adet`}>
                  <form action={updateCartLine}>
                    <input type="hidden" name="variantId" value={line.variantId} />
                    <input type="hidden" name="quantity" value={line.quantity - 1} />
                    <button type="submit" className="h-11 w-11 rounded-full text-xl font-semibold" aria-label="Adedi azalt">−</button>
                  </form>
                  <span className="w-8 text-center font-semibold" aria-live="polite">{line.quantity}</span>
                  <form action={updateCartLine}>
                    <input type="hidden" name="variantId" value={line.variantId} />
                    <input type="hidden" name="quantity" value={line.quantity + 1} />
                    <button type="submit" className="h-11 w-11 rounded-full text-xl font-semibold disabled:opacity-40" aria-label="Adedi artır" disabled={line.quantity >= line.stock}>+</button>
                  </form>
                </div>
                <p className="w-28 text-right font-display text-xl">{formatTl(line.lineTotalKurus)}</p>
                <form action={updateCartLine}>
                  <input type="hidden" name="variantId" value={line.variantId} />
                  <input type="hidden" name="quantity" value="0" />
                  <button type="submit" className="text-sm font-semibold underline underline-offset-4" aria-label={`${line.productName} ürününü sepetten çıkar`}>Çıkar</button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:col-span-5" aria-labelledby="ozet-baslik">
          <div className="card p-6 md:p-8">
            <h2 id="ozet-baslik" className="text-3xl">Sipariş özeti</h2>
            <div className="mt-5">
              <TotalsList totals={cart.totals} couponCode={cart.coupon?.code} shippingConfigured={cart.shippingConfigured} />
            </div>

            <div className="mt-6 border-t border-korfez/15 pt-5">
              {cart.coupon ? (
                <form action={removeCoupon} className="flex items-center justify-between gap-3">
                  <p><strong>{cart.coupon.code}</strong> kuponu uygulandı.</p>
                  <button type="submit" className="text-sm font-semibold underline underline-offset-4">Kaldır</button>
                </form>
              ) : (
                <ActionForm action={applyCoupon} className="space-y-3">
                  <div className="flex items-end gap-2">
                    <Field name="code" label="Kupon kodu" className="flex-1" autoComplete="off" maxLength={40} />
                    <SubmitButton className="btn btn-outline" pendingLabel="…">Uygula</SubmitButton>
                  </div>
                </ActionForm>
              )}
              {!cart.coupon && cart.couponError && <p className="field-error">{cart.couponError}</p>}
            </div>

            <Link href="/odeme" className="btn btn-primary mt-6 w-full">Ödeme adımına geç</Link>
            <p className="mt-4 text-sm text-korfez/75">
              <Link href="/teslimat-ve-iade" className="underline underline-offset-4">Teslimat ve iade koşulları</Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
