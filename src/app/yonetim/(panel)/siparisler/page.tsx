import Link from "next/link";
import { Empty, PageHeader, StatusBadge, TableWrap } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/dates";
import { formatTl } from "@/lib/money";
import { listOrders } from "@/lib/orders/service";
import { isOrderStatus, ORDER_STATUSES, STATUS_LABELS } from "@/lib/orders/status";

export const metadata = { title: "Siparişler" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  await requireUser("orders");
  const { durum } = await searchParams;
  const filter = durum && isOrderStatus(durum) ? durum : null;
  const all = listOrders(500);
  const orders = filter ? all.filter((o) => o.status === filter) : all;

  return (
    <>
      <PageHeader title="Siparişler" description="Sipariş durumunu güncelleyin. “Ödendi” durumu yalnızca ödeme kuruluşunun bildirimiyle atanır." />
      <nav aria-label="Duruma göre süz" className="mb-5 flex flex-wrap gap-2">
        <Link href="/yonetim/siparisler" aria-current={!filter ? "page" : undefined} className="btn btn-sm btn-outline aria-[current=page]:bg-korfez aria-[current=page]:text-kirec">Tümü ({all.length})</Link>
        {ORDER_STATUSES.map((s) => {
          const n = all.filter((o) => o.status === s).length;
          return n > 0 ? (
            <Link key={s} href={`/yonetim/siparisler?durum=${s}`} aria-current={filter === s ? "page" : undefined} className="btn btn-sm btn-outline aria-[current=page]:bg-korfez aria-[current=page]:text-kirec">{STATUS_LABELS[s]} ({n})</Link>
          ) : null;
        })}
      </nav>
      {orders.length === 0 ? (
        <Empty title="Sipariş yok">{filter ? "Bu durumda sipariş bulunmuyor." : "Henüz sipariş alınmadı. İlk sipariş geldiğinde burada görünecek."}</Empty>
      ) : (
        <TableWrap>
          <thead><tr><th>Sipariş</th><th>Tarih</th><th>Müşteri</th><th>Tutar</th><th>Durum</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/yonetim/siparisler/${o.id}`} className="font-semibold underline underline-offset-4">{o.number}</Link>
                  {o.paymentProvider === "test" && <span className="ml-2 text-xs font-semibold text-altin-koyu">DENEME</span>}
                </td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>{o.customerName}<span className="block text-sm text-korfez/70">{o.district} / {o.city}</span></td>
                <td>{formatTl(o.totalKurus)}</td>
                <td>{isOrderStatus(o.status) && <StatusBadge status={o.status} />}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
