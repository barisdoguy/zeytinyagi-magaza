import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SellerInfo } from "@/components/site/Footer";
import { OrderEffects } from "@/components/site/OrderEffects";
import { TotalsList } from "@/components/site/OrderSummary";
import { formatTl } from "@/lib/money";
import { getOrderItems } from "@/lib/orders/service";
import { isOrderStatus, STATUS_LABELS } from "@/lib/orders/status";
import { getSite } from "@/lib/site";
import { findOrderForCustomer } from "@/lib/orders/access";

export const metadata: Metadata = { title: "Siparişiniz", robots: { index: false, follow: false } };

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t = "" } = await searchParams;
  const order = findOrderForCustomer(number, t);
  if (!order || !isOrderStatus(order.status)) notFound();
  const items = getOrderItems(order.id);
  const { payment } = getSite();
  const awaiting = order.status === "pending_payment";
  const failed = order.status === "payment_failed";
  const isTestOrder = order.paymentProvider === "test" || payment.isTest;

  return (
    <div className="wrap max-w-3xl py-10 md:py-16">
      <OrderEffects number={order.number} token={order.accessToken} paid={!awaiting && !failed} totalKurus={order.totalKurus} />
      <p className="eyebrow text-altin-koyu">Sipariş {order.number}</p>
      <h1 className="mt-3 text-5xl">
        {awaiting ? "Ödemeniz doğrulanıyor" : failed ? "Ödeme tamamlanamadı" : order.status === "paid" ? "Siparişiniz alındı" : STATUS_LABELS[order.status]}
      </h1>
      <p className="mt-4 text-lg" role="status">
        {awaiting && "Ödeme kuruluşundan onay bekleniyor. Bu sayfa kendiliğinden güncellenir."}
        {failed && "Tutar tahsil edilmedi."}
        {order.status === "paid" && `Teşekkür ederiz, ${order.customerName}. Siparişinizi hazırlamaya başlıyoruz.`}
        {order.status === "preparing" && "Siparişiniz hazırlanıyor."}
        {order.status === "shipped" && "Siparişiniz kargoya verildi."}
      </p>
      {(awaiting || failed) && (
        <Link href={`/odeme/${order.number}?t=${order.accessToken}`} className="btn btn-primary mt-6">Ödeme adımına dön</Link>
      )}
      {isTestOrder && !awaiting && !failed && (
        <p className="mt-6 rounded-xl bg-altin/30 px-4 py-3 font-semibold">Bu bir deneme siparişidir: gerçek tahsilat yapılmadı ve ürün gönderilmeyecek.</p>
      )}
      <p className="mt-6 text-[0.9375rem] text-korfez/80">
        Sipariş numaranızı not alın ve bu sayfanın bağlantısını saklayın; siparişinizin durumunu buradan izleyebilirsiniz.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <dt className="eyebrow text-korfez/70">Durum</dt>
          <dd className="mt-1 font-display text-2xl">{STATUS_LABELS[order.status]}</dd>
          {order.trackingNumber && <dd className="mt-2 text-[0.9375rem]">{order.carrier} takip no: <strong>{order.trackingNumber}</strong></dd>}
        </div>
        <div className="card p-5">
          <dt className="eyebrow text-korfez/70">Teslimat adresi</dt>
          <dd className="mt-1">{order.customerName}<br />{order.addressLine}<br />{order.district} / {order.city}</dd>
        </div>
      </dl>

      <section className="card mt-4 p-6 md:p-8" aria-labelledby="urunler-baslik">
        <h2 id="urunler-baslik" className="text-2xl">Ürünler</h2>
        <ul className="mt-3 divide-y divide-korfez/15">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <span><strong>{item.productName}</strong><span className="block text-sm text-korfez/75">{item.variantLabel} × {item.quantity}</span></span>
              <span className="font-semibold whitespace-nowrap">{formatTl(item.lineTotalKurus)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-korfez/15 pt-4"><TotalsList totals={order} couponCode={order.couponCode} /></div>
      </section>

      <section className="mt-8" aria-labelledby="satici-baslik">
        <h2 id="satici-baslik" className="text-2xl">Satıcı ve destek</h2>
        <div className="mt-3"><SellerInfo /></div>
        <p className="mt-4">
          <Link href="/teslimat-ve-iade" className="font-semibold underline underline-offset-4">Teslimat ve iade koşulları</Link> ·{" "}
          <Link href="/iletisim" className="font-semibold underline underline-offset-4">İletişim</Link>
        </p>
      </section>
    </div>
  );
}
