import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { TotalsList } from "@/components/site/OrderSummary";
import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { requireUser } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { formatTl } from "@/lib/money";
import { getOrderItems } from "@/lib/orders/service";
import { isOrderStatus, manualTransitions, STATUS_LABELS } from "@/lib/orders/status";
import { updateOrderStatus } from "../../../actions";

export const metadata = { title: "Sipariş" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("orders");
  const { id } = await params;
  const order = /^\d+$/.test(id) ? getDb().select().from(orders).where(eq(orders.id, Number(id))).get() : null;
  if (!order || !isOrderStatus(order.status)) notFound();
  const items = getOrderItems(order.id);
  const next = manualTransitions(order.status);

  return (
    <>
      <PageHeader title={`Sipariş ${order.number}`} description={formatDateTime(order.createdAt)} action={<Link href="/yonetim/siparisler" className="btn btn-outline">Siparişlere dön</Link>} />
      {order.paymentProvider === "test" && (
        <p className="mb-6 rounded-xl bg-altin/30 px-4 py-3 font-semibold">Deneme siparişi: deneme sağlayıcısıyla oluşturuldu, gerçek tahsilat yapılmadı.</p>
      )}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Panel title="Ürünler">
            <ul className="divide-y divide-korfez/10">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3">
                  <span><strong>{item.productName}</strong><span className="block text-sm text-korfez/70">{item.variantLabel} · {item.quantity} × {formatTl(item.unitPriceKurus)}</span></span>
                  <span className="font-semibold">{formatTl(item.lineTotalKurus)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-korfez/10 pt-4"><TotalsList totals={order} couponCode={order.couponCode} /></div>
          </Panel>
          <Panel title="Müşteri ve teslimat">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-sm font-semibold text-korfez/70">Ad soyad</dt><dd>{order.customerName}</dd></div>
              <div><dt className="text-sm font-semibold text-korfez/70">Telefon</dt><dd>{order.phone}</dd></div>
              <div><dt className="text-sm font-semibold text-korfez/70">E-posta</dt><dd className="break-all">{order.email}</dd></div>
              <div><dt className="text-sm font-semibold text-korfez/70">Adres</dt><dd>{order.addressLine}<br />{order.postalCode} {order.district} / {order.city}</dd></div>
              {order.note && <div className="sm:col-span-2"><dt className="text-sm font-semibold text-korfez/70">Sipariş notu</dt><dd>{order.note}</dd></div>}
            </dl>
          </Panel>
        </div>
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Durum">
            <p><StatusBadge status={order.status} /></p>
            <dl className="mt-4 space-y-1 text-[0.9375rem]">
              <div><dt className="inline font-semibold">Ödeme: </dt><dd className="inline">{order.paymentProvider}{order.paidAt ? ` · ${formatDateTime(order.paidAt)}` : " · ödenmedi"}</dd></div>
              {order.trackingNumber && <div><dt className="inline font-semibold">Kargo: </dt><dd className="inline">{order.carrier} {order.trackingNumber}</dd></div>}
            </dl>
            {next.length === 0 ? (
              <p className="mt-5 text-korfez/75">
                {order.status === "pending_payment" || order.status === "payment_failed" ? "Ödeme bildirimi bekleniyor." : "Bu sipariş için yapılabilecek başka durum değişikliği yok."}
              </p>
            ) : (
              <ActionForm action={updateOrderStatus} className="mt-5 space-y-4">
                <input type="hidden" name="orderId" value={order.id} />
                <div>
                  <label htmlFor="to" className="field-label">Yeni durum</label>
                  <select id="to" name="to" className="field-input" defaultValue={next[0]}>
                    {next.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                {next.includes("shipped") && (
                  <>
                    <Field name="carrier" label="Kargo firması" help="“Kargoya verildi” seçerseniz müşteri sayfasında görünür." />
                    <Field name="trackingNumber" label="Takip numarası" />
                  </>
                )}
                {(next.includes("cancelled") || next.includes("refunded")) && (
                  <p className="field-help">İptal ya da iade seçildiğinde bu siparişte düşülen stok geri eklenir. Ücret iadesi buradan yapılmaz; ödeme kuruluşunun panelinden ayrıca yapılmalıdır.</p>
                )}
                <SubmitButton className="btn btn-dark w-full" pendingLabel="Güncelleniyor…">Durumu güncelle</SubmitButton>
              </ActionForm>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
