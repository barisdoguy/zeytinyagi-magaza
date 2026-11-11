import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TotalsList } from "@/components/site/OrderSummary";
import { ActionForm, Checkbox, Field, SubmitButton } from "@/components/ui/ActionForm";
import { FormError } from "@/components/ui/FormError";
import { getCartView } from "@/lib/cart";
import { formatTl } from "@/lib/money";
import { getSite } from "@/lib/site";
import { placeOrder } from "../actions";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false, follow: false } };

function Step({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-6 md:p-8">
      <legend className="float-left mb-5 flex w-full items-center gap-3 font-display text-2xl">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-korfez font-sans text-base font-semibold text-kirec" aria-hidden="true">{no}</span>
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export default async function CheckoutPage() {
  const cart = await getCartView();
  if (cart.lines.length === 0) redirect("/sepet");
  const { payment } = getSite();
  const blocked = !payment.available ? "Çevrimiçi ödeme henüz açılmadı; şu anda sipariş oluşturulamıyor." : !cart.shippingConfigured ? "Kargo ücreti henüz tanımlanmadığı için sipariş alınamıyor." : null;

  return (
    <div className="wrap py-10 md:py-16">
      <h1 className="text-5xl md:text-6xl">Ödeme</h1>
      <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem] font-semibold text-korfez/75" aria-label="Sipariş adımları">
        <li>1. İletişim</li>
        <li>2. Teslimat adresi</li>
        <li>3. Özet ve onay</li>
        <li>4. Ödeme</li>
      </ol>

      {blocked && (
        <p role="alert" className="mt-6 rounded-xl border-2 border-dashed border-korfez/40 px-4 py-3 font-semibold">
          {blocked} Sorularınız için <Link href="/iletisim" className="underline">bize yazabilirsiniz</Link>.
        </p>
      )}
      {payment.available && payment.isTest && (
        <p role="status" className="mt-6 rounded-xl bg-altin/30 px-4 py-3 font-semibold">
          Deneme modu: bu sipariş için gerçek tahsilat yapılmayacak ve ürün gönderilmeyecektir.
        </p>
      )}

      <ActionForm action={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-12" messagePosition="none">
        <div className="space-y-6 lg:col-span-7">
          <Step no={1} title="İletişim bilgileri">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="customerName" label="Ad soyad" required autoComplete="name" className="sm:col-span-2" />
              <Field name="email" label="E-posta" type="email" required autoComplete="email" inputMode="email" />
              <Field name="phone" label="Cep telefonu" type="tel" required autoComplete="tel" inputMode="tel" placeholder="05XX XXX XX XX" />
            </div>
          </Step>
          <Step no={2} title="Teslimat adresi">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="city" label="İl" required autoComplete="address-level1" />
              <Field name="district" label="İlçe" required autoComplete="address-level2" />
              <Field name="addressLine" label="Açık adres" required multiline rows={3} autoComplete="street-address" className="sm:col-span-2" help="Mahalle, cadde/sokak, bina ve daire numarası." />
              <Field name="postalCode" label="Posta kodu" autoComplete="postal-code" inputMode="numeric" />
              <Field name="note" label="Sipariş notu" className="sm:col-span-2" help="İsteğe bağlı." maxLength={500} />
            </div>
          </Step>
        </div>

        <div className="lg:col-span-5">
          <Step no={3} title="Özet ve onay">
            <ul className="divide-y divide-korfez/15">
              {cart.lines.map((line) => (
                <li key={line.variantId} className="flex justify-between gap-4 py-3">
                  <span>
                    <strong>{line.productName}</strong>
                    <span className="block text-sm text-korfez/75">{line.variantLabel} × {line.quantity}</span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">{formatTl(line.lineTotalKurus)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-korfez/15 pt-4">
              <TotalsList totals={cart.totals} couponCode={cart.coupon?.code} shippingConfigured={cart.shippingConfigured} />
            </div>
            <p className="mt-3 text-sm"><Link href="/sepet" className="font-semibold underline underline-offset-4">Sepeti düzenle</Link></p>

            <div className="mt-6 space-y-4 border-t border-korfez/15 pt-5">
              <Checkbox name="agreeContract">
                <Link href="/on-bilgilendirme-formu" target="_blank" className="font-semibold underline">Ön Bilgilendirme Formu</Link>’nu ve{" "}
                <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="font-semibold underline">Mesafeli Satış Sözleşmesi</Link>’ni okudum, onaylıyorum.
              </Checkbox>
              <Checkbox name="agreePrivacy">
                Kişisel verilerime ilişkin <Link href="/gizlilik-ve-kvkk" target="_blank" className="font-semibold underline">aydınlatma metnini</Link> okudum.
              </Checkbox>
            </div>

            <FormError />
            <SubmitButton className="btn btn-primary mt-6 w-full" pendingLabel="Sipariş oluşturuluyor…" disabled={Boolean(blocked)}>
              Siparişi onayla ve ödemeye geç
            </SubmitButton>
            <p className="mt-3 text-sm text-korfez/75">Ödeme bir sonraki adımda, ödeme kuruluşunun güvenli sayfasında alınır. Kart bilgileriniz bu sitede saklanmaz.</p>
          </Step>
        </div>
      </ActionForm>
    </div>
  );
}
