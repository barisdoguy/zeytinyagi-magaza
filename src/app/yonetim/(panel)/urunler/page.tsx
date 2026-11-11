import Link from "next/link";
import { Badge, Empty, PageHeader, TableWrap } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/guard";
import { hasPrice, listAllProducts } from "@/lib/catalog";
import { formatTl } from "@/lib/money";

export const metadata = { title: "Ürünler" };

const STATUS = { draft: ["Taslak", "warn"], active: ["Yayında", "good"], archived: ["Arşiv", "neutral"] } as const;

export default async function AdminProductsPage() {
  await requireUser("products");
  const products = listAllProducts();
  return (
    <>
      <PageHeader title="Ürünler" description="Fiyat, stok ve görselleri buradan yönetin. Fiyatı girilmemiş seçenekler sitede satın alınamaz." action={<Link href="/yonetim/urunler/yeni" className="btn btn-dark">Yeni ürün</Link>} />
      {products.length === 0 ? (
        <Empty title="Henüz ürün yok">İlk ürününüzü eklemek için “Yeni ürün” düğmesini kullanın.</Empty>
      ) : (
        <TableWrap>
          <thead><tr><th>Ürün</th><th>Durum</th><th>Seçenekler</th><th>Fiyat</th><th>Toplam stok</th></tr></thead>
          <tbody>
            {products.map((p) => {
              const priced = p.variants.filter(hasPrice).map((v) => v.priceKurus as number);
              const [label, tone] = STATUS[p.status];
              return (
                <tr key={p.id}>
                  <td><Link href={`/yonetim/urunler/${p.id}`} className="font-semibold underline underline-offset-4">{p.name}</Link></td>
                  <td><Badge tone={tone}>{label}</Badge></td>
                  <td>{p.variants.length}</td>
                  <td>{priced.length === 0 ? <Badge tone="warn">Fiyat girilmedi</Badge> : priced.length < p.variants.length ? `${formatTl(Math.min(...priced))}+ (eksik var)` : `${formatTl(Math.min(...priced))}${Math.min(...priced) !== Math.max(...priced) ? ` – ${formatTl(Math.max(...priced))}` : ""}`}</td>
                  <td>{p.variants.reduce((sum, v) => sum + v.stock, 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
