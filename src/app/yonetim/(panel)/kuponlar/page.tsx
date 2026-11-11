import { desc } from "drizzle-orm";
import { Badge, Empty, PageHeader, Panel, TableWrap } from "@/components/admin/ui";
import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { requireUser } from "@/lib/auth/guard";
import { checkCoupon } from "@/lib/coupons";
import { formatDate } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { formatTl } from "@/lib/money";
import { deleteCoupon, saveCoupon, toggleCoupon } from "../../actions";

export const metadata = { title: "Kuponlar" };

export default async function CouponsPage() {
  await requireUser("coupons");
  const rows = getDb().select().from(coupons).orderBy(desc(coupons.createdAt)).all();
  return (
    <>
      <PageHeader title="Kuponlar" description="İndirim kodları tanımlayın. Kod; tarih aralığı, alt sepet tutarı ve kullanım sınırı sağlandığında sepette uygulanır." />
      <Panel title="Yeni kupon" className="mb-6">
        <ActionForm action={saveCoupon} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field name="code" label="Kod" required placeholder="HOSGELDIN" maxLength={30} />
            <div>
              <label htmlFor="type" className="field-label">İndirim türü</label>
              <select id="type" name="type" className="field-input" defaultValue="percent">
                <option value="percent">Yüzde (%)</option>
                <option value="fixed">Sabit tutar (TL)</option>
              </select>
            </div>
            <Field name="value" label="İndirim değeri" required inputMode="decimal" help="Yüzde için 1–100; sabit tutar için TL." />
            <Field name="minSubtotalTl" label="Alt sepet tutarı (TL)" inputMode="decimal" help="Boş bırakılırsa alt sınır yoktur." />
            <Field name="startsAt" label="Başlangıç tarihi" type="date" />
            <Field name="endsAt" label="Bitiş tarihi" type="date" help="Bitiş günü dahildir." />
            <Field name="maxUses" label="Kullanım sınırı" inputMode="numeric" help="Toplam kaç siparişte kullanılabileceği. Boşsa sınırsız." />
          </div>
          <SubmitButton className="btn btn-dark" pendingLabel="Oluşturuluyor…">Kuponu oluştur</SubmitButton>
        </ActionForm>
      </Panel>

      {rows.length === 0 ? (
        <Empty title="Tanımlı kupon yok">Oluşturduğunuz kuponlar burada listelenir.</Empty>
      ) : (
        <TableWrap>
          <thead><tr><th>Kod</th><th>İndirim</th><th>Koşullar</th><th>Kullanım</th><th>Durum</th><th><span className="sr-only">İşlemler</span></th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const valid = checkCoupon(c, Number.MAX_SAFE_INTEGER).ok;
              return (
                <tr key={c.id}>
                  <td className="font-semibold">{c.code}</td>
                  <td>{c.type === "percent" ? `%${c.value}` : formatTl(c.value)}</td>
                  <td className="text-sm">
                    {c.minSubtotalKurus > 0 && <span className="block">Alt sınır: {formatTl(c.minSubtotalKurus)}</span>}
                    <span className="block">{c.startsAt ? formatDate(c.startsAt) : "—"} → {c.endsAt ? formatDate(c.endsAt) : "süresiz"}</span>
                  </td>
                  <td>{c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : ""}</td>
                  <td>{!c.active ? <Badge>Pasif</Badge> : valid ? <Badge tone="good">Geçerli</Badge> : <Badge tone="warn">Şu an geçersiz</Badge>}</td>
                  <td>
                    <div className="flex justify-end gap-3 text-sm font-semibold">
                      <form action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><button type="submit" className="underline underline-offset-4">{c.active ? "Pasifleştir" : "Etkinleştir"}</button></form>
                      <form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><button type="submit" className="text-kiremit-koyu underline underline-offset-4" aria-label={`${c.code} kuponunu sil`}>Sil</button></form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
