import { desc } from "drizzle-orm";
import { Empty, PageHeader, TableWrap } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export const metadata = { title: "İşlem kayıtları" };

const ACTIONS: Record<string, string> = {
  "auth.login": "Giriş yapıldı",
  "auth.login_failed": "Hatalı giriş denemesi",
  "user.create": "Kullanıcı eklendi",
  "user.cli_create": "Kullanıcı eklendi (komut satırı)",
  "user.cli_update": "Kullanıcı güncellendi (komut satırı)",
  "user.activate": "Hesap açıldı",
  "user.deactivate": "Hesap kapatıldı",
  "user.password_changed": "Parola değiştirildi",
  "user.password_reset": "Parola sıfırlandı",
  "product.create": "Ürün eklendi",
  "product.update": "Ürün güncellendi",
  "product.delete": "Ürün silindi",
  "variant.create": "Seçenek eklendi",
  "variant.update": "Fiyat / stok güncellendi",
  "variant.delete": "Seçenek silindi",
  "order.status": "Sipariş durumu değişti",
  "payment.paid": "Ödeme onaylandı",
  "payment.amount_mismatch": "Ödeme tutarı uyuşmadı",
  "payment.unknown_order": "Bilinmeyen sipariş için ödeme bildirimi",
  "coupon.create": "Kupon oluşturuldu",
  "coupon.activate": "Kupon etkinleştirildi",
  "coupon.deactivate": "Kupon pasifleştirildi",
  "coupon.delete": "Kupon silindi",
  "content.update": "İçerik / ayar güncellendi",
  "page.update": "Sayfa güncellendi",
  "image.upload": "Görsel yüklendi",
  "image.remove": "Görsel kaldırıldı",
};

export default async function AuditPage() {
  await requireUser("audit");
  const rows = getDb().select().from(auditLog).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(300).all();
  return (
    <>
      <PageHeader title="İşlem kayıtları" description="Giriş, fiyat–stok, sipariş durumu, kupon, içerik ve kullanıcı değişikliklerinin son 300 kaydı. Kayıtlar panelden silinemez." />
      {rows.length === 0 ? (
        <Empty title="Henüz kayıt yok" />
      ) : (
        <TableWrap>
          <thead><tr><th>Tarih</th><th>Kim</th><th>İşlem</th><th>Kayıt</th><th>Ayrıntı</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                <td>{row.userEmail}</td>
                <td className="font-semibold">{ACTIONS[row.action] ?? row.action}</td>
                <td>{row.entityId}</td>
                <td className="text-sm">{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
