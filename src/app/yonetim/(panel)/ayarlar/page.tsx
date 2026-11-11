import { ContentGroupForm } from "@/components/admin/ContentGroupForm";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/guard";
import { getSite } from "@/lib/site";

export const metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  await requireUser("settings");
  const { content, payment, indexable, siteUrl, tracking } = getSite();
  return (
    <>
      <PageHeader title="Ayarlar" description="Marka, satıcı ve kargo bilgileri. Buradaki bilgiler sitede alt bilgide, iletişim sayfasında ve sipariş özetlerinde görünür." />
      <div className="space-y-6">
        <ContentGroupForm group="marka" content={content} />
        <ContentGroupForm group="satici" content={content} />
        <ContentGroupForm group="kargo" content={content} />

        <Panel title="Ödeme ve yayın durumu">
          <p className="mb-4 text-korfez/75">Bu değerler güvenlik nedeniyle panelden değiştirilemez; sunucudaki ortam değişkenleriyle belirlenir (README’ye bakın). Gizli anahtarlar burada gösterilmez.</p>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-korfez/70">Ödeme sağlayıcısı</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                {payment.provider?.label ?? "Seçilmedi"}
                {payment.available ? (payment.isTest ? <Badge tone="warn">Deneme — tahsilat yok</Badge> : <Badge tone="good">Canlı</Badge>) : <Badge tone="bad">Kapalı</Badge>}
              </dd>
              {payment.reason && <dd className="mt-1 text-sm">{payment.reason}</dd>}
            </div>
            <div>
              <dt className="text-sm font-semibold text-korfez/70">Ödeme modu</dt>
              <dd className="mt-1">{payment.mode === "live" ? "Canlı (PAYMENTS_MODE=live)" : "Deneme (PAYMENTS_MODE=test)"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-korfez/70">Bildirim (webhook) adresi</dt>
              <dd className="mt-1 text-sm break-all">{payment.provider ? `${siteUrl}/api/payments/webhook/${payment.provider.id}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-korfez/70">Arama motorları</dt>
              <dd className="mt-1">{indexable ? <Badge tone="good">Açık</Badge> : <Badge tone="warn">Kapalı (SITE_INDEXABLE=false)</Badge>}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-korfez/70">Google Analytics 4</dt>
              <dd className="mt-1">{tracking.ga4 ? <Badge tone="good">Tanımlı — yalnızca izin verilirse çalışır</Badge> : <Badge>Tanımlı değil</Badge>}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-korfez/70">Meta Pixel</dt>
              <dd className="mt-1">{tracking.metaPixel ? <Badge tone="good">Tanımlı — yalnızca izin verilirse çalışır</Badge> : <Badge>Tanımlı değil</Badge>}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>
  );
}
