import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TotalsList } from "@/components/site/OrderSummary";
import { SubmitButton } from "@/components/ui/ActionForm";
import { getOrderItems } from "@/lib/orders/service";
import { PaymentError } from "@/lib/payments";
import type { CheckoutSession } from "@/lib/payments/types";
import { clientIp } from "@/lib/request";
import { getSite } from "@/lib/site";
import { findOrderForCustomer } from "@/lib/orders/access";
import { simulateTestPayment } from "../../actions";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false, follow: false } };

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; durum?: string }> };

export default async function PayPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t = "", durum } = await searchParams;
  const order = findOrderForCustomer(number, t);
  if (!order) notFound();
  const orderUrl = `/siparis/${order.number}?t=${order.accessToken}`;
  if (order.status !== "pending_payment" && order.status !== "payment_failed") redirect(orderUrl);

  const { payment, siteUrl } = getSite();
  let session: CheckoutSession | null = null;
  let error: string | null = null;
  if (!payment.available || !payment.provider || payment.provider.id !== order.paymentProvider) {
    error = "Çevrimiçi ödeme şu anda kullanılamıyor.";
  } else {
    try {
      session = await payment.provider.createCheckout(order, getOrderItems(order.id), {
        siteUrl,
        ip: await clientIp(),
        okUrl: `${siteUrl}${orderUrl}`,
        failUrl: `${siteUrl}/odeme/${order.number}?t=${order.accessToken}&durum=basarisiz`,
        testMode: payment.mode === "test",
      });
    } catch (e) {
      if (!(e instanceof PaymentError)) throw e;
      error = "Ödeme sayfası açılamadı. Lütfen biraz sonra yeniden deneyin.";
    }
  }

  return (
    <div className="wrap max-w-3xl py-10 md:py-16">
      <p className="eyebrow text-altin-koyu">Sipariş {order.number}</p>
      <h1 className="mt-3 text-5xl">Ödeme</h1>

      {(durum === "basarisiz" || order.status === "payment_failed") && (
        <p role="alert" className="mt-6 rounded-xl bg-kiremit/10 px-4 py-3 font-semibold text-kiremit-koyu">
          Ödeme tamamlanamadı. Tutar tahsil edilmedi; yeniden deneyebilirsiniz.
        </p>
      )}

      <div className="card mt-8 p-6 md:p-8">
        <TotalsList totals={order} couponCode={order.couponCode} />
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border-2 border-dashed border-korfez/40 px-4 py-3 font-semibold">
          {error} Siparişiniz kayıtlı; yardım için <Link href="/iletisim" className="underline">bize yazabilirsiniz</Link>.
        </p>
      )}

      {session?.kind === "test" && (
        <section className="mt-8 rounded-[1.5rem] border-2 border-dashed border-altin-koyu bg-altin/15 p-6 md:p-8" aria-labelledby="deneme-baslik">
          <h2 id="deneme-baslik" className="text-3xl">Deneme ödemesi</h2>
          <p className="mt-3">
            Bu ekran gerçek bir ödeme sayfası <strong>değildir</strong>. Sanal POS henüz bağlanmadığı için kart bilgisi istenmez ve tahsilat yapılmaz. Aşağıdaki
            düğmeler, ödeme kuruluşundan gelecek bildirimi taklit ederek sipariş akışını denemenizi sağlar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={simulateTestPayment}>
              <input type="hidden" name="number" value={order.number} />
              <input type="hidden" name="token" value={order.accessToken} />
              <SubmitButton className="btn btn-dark" pendingLabel="İşleniyor…" name="outcome" value="paid">Başarılı ödemeyi dene</SubmitButton>
            </form>
            <form action={simulateTestPayment}>
              <input type="hidden" name="number" value={order.number} />
              <input type="hidden" name="token" value={order.accessToken} />
              <SubmitButton className="btn btn-outline" pendingLabel="İşleniyor…" name="outcome" value="failed">Başarısız ödemeyi dene</SubmitButton>
            </form>
          </div>
        </section>
      )}

      {session?.kind === "iframe" && (
        <section className="mt-8" aria-label="Güvenli ödeme formu">
          {payment.isTest && <p className="mb-3 rounded-xl bg-altin/30 px-4 py-3 font-semibold">Sağlayıcı test modunda: gerçek tahsilat yapılmaz.</p>}
          <iframe src={session.url} title={`${payment.provider?.label} güvenli ödeme formu`} className="h-[760px] w-full rounded-2xl border border-korfez/20 bg-white" />
        </section>
      )}

      {session?.kind === "redirect" && (
        <a href={session.url} className="btn btn-primary mt-8">Güvenli ödeme sayfasına git</a>
      )}
    </div>
  );
}
