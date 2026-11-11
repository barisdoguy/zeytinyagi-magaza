import Link from "next/link";
import { desc, lte, sql } from "drizzle-orm";
import { Badge, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { requireUser } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { isOnSale, listAllProducts } from "@/lib/catalog";
import { FIELDS } from "@/lib/content/definitions";
import { formatDateTime } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { orders, variants } from "@/lib/db/schema";
import { formatTl } from "@/lib/money";
import { isOrderStatus, ORDER_STATUSES, STATUS_LABELS } from "@/lib/orders/status";
import { listPages } from "@/lib/pages";
import { getSite } from "@/lib/site";
import { changeOwnPassword } from "../actions";

type Check = { done: boolean; label: string; href: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ yetki?: string }> }) {
  const user = await requireUser();
  const { yetki } = await searchParams;
  const { content: c, payment, indexable, images } = getSite();
  const db = getDb();
  const counts = db.select({ status: orders.status, n: sql<number>`count(*)` }).from(orders).groupBy(orders.status).all();
  const recent = db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6).all();
  const products = listAllProducts();
  const lowStock = db.select().from(variants).where(lte(variants.stock, 5)).all().filter((v) => v.active && v.priceKurus != null);
  const pages = listPages();

  const checks: Check[] = [
    { done: c.brandName !== FIELDS.brandName.default, label: "Geçici marka adını gerçek adla değiştirin", href: "/yonetim/ayarlar" },
    { done: Boolean(c.sellerLegalName && c.sellerAddress && c.sellerPhone && c.sellerEmail), label: "Satıcı bilgilerini girin (unvan, adres, telefon, e-posta)", href: "/yonetim/ayarlar" },
    { done: c.shippingFeeTl !== "", label: "Kargo ücretini tanımlayın", href: "/yonetim/ayarlar" },
    { done: Boolean(c.deliveryNote && c.returnNote), label: "Teslimat süresi ve iade özeti notlarını yazın", href: "/yonetim/ayarlar" },
    { done: products.some(isOnSale), label: "En az bir ürünü fiyat ve stokla satışa açın", href: "/yonetim/urunler" },
    { done: products.filter((p) => p.status !== "archived").every((p) => p.imageFile), label: "Ürün fotoğraflarını yükleyin", href: "/yonetim/urunler" },
    { done: Boolean(c.zeytinCesidi && c.hasatDonemi && c.sikimYontemi), label: "Yağın künyesini doldurun (çeşit, hasat dönemi, sıkım)", href: "/yonetim/icerik" },
    { done: Boolean(c.storyPersonal), label: "Üretici hikâyesini yazın", href: "/yonetim/icerik" },
    { done: Boolean(images.yore && images.sofra), label: "Yöre ve sofra fotoğraflarını yükleyin", href: "/yonetim/icerik" },
    { done: pages.every((p) => p.status === "published"), label: "Yasal metinleri ve SSS'yi tamamlayıp yayımlayın (hukuki inceleme gerekir)", href: "/yonetim/icerik" },
    { done: payment.available && !payment.isTest, label: "Gerçek sanal POS'u bağlayın ve canlı moda alın", href: "/yonetim/ayarlar" },
    { done: indexable, label: "Hazır olduğunuzda siteyi arama motorlarına açın (SITE_INDEXABLE=true)", href: "/yonetim/ayarlar" },
  ];
  const open = checks.filter((item) => !item.done);

  return (
    <>
      <PageHeader title={`Merhaba, ${user.name}`} description="Siparişlerin durumu ve yayına çıkmadan önce tamamlanması gerekenler." />
      {yetki === "yok" && <p role="alert" className="mb-6 rounded-xl bg-kiremit/10 px-4 py-3 font-semibold text-kiremit-koyu">Bu sayfayı görüntüleme yetkiniz yok.</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Siparişler">
          {counts.length === 0 ? (
            <p className="text-korfez/75">Henüz sipariş yok.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {ORDER_STATUSES.map((status) => {
                const n = counts.find((row) => row.status === status)?.n ?? 0;
                return n > 0 ? (
                  <li key={status}>
                    <Link href={`/yonetim/siparisler?durum=${status}`} className="block rounded-xl bg-korfez/[0.06] p-3 hover:bg-korfez/10">
                      <span className="font-display text-3xl">{n}</span>
                      <span className="block text-sm">{STATUS_LABELS[status]}</span>
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          )}
          {recent.length > 0 && (
            <ul className="mt-5 divide-y divide-korfez/10 border-t border-korfez/10">
              {recent.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-2.5 text-[0.9375rem]">
                  <Link href={`/yonetim/siparisler/${order.id}`} className="font-semibold underline underline-offset-4">{order.number}</Link>
                  <span className="hidden text-korfez/70 sm:inline">{formatDateTime(order.createdAt)}</span>
                  <span>{formatTl(order.totalKurus)}</span>
                  {isOrderStatus(order.status) && <StatusBadge status={order.status} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Azalan stok">
          {lowStock.length === 0 ? (
            <p className="text-korfez/75">Satıştaki seçeneklerde azalan stok yok.</p>
          ) : (
            <ul className="divide-y divide-korfez/10">
              {lowStock.map((v) => {
                const product = products.find((p) => p.id === v.productId);
                return (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/yonetim/urunler/${v.productId}`} className="font-semibold underline underline-offset-4">{product?.name} — {v.label}</Link>
                    <Badge tone={v.stock === 0 ? "bad" : "warn"}>{v.stock} adet</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {can(user.role, "settings") && (
          <Panel title="Yayın öncesi kontrol listesi" className="lg:col-span-2">
            <p className="mb-4 text-korfez/75">
              {open.length === 0 ? "Tüm maddeler tamamlandı." : `${checks.length} maddeden ${open.length} tanesi açık. Site bu maddeler tamamlanmadan yayına hazır sayılmaz.`}
            </p>
            <ul className="grid gap-2 md:grid-cols-2">
              {checks.map((item) => (
                <li key={item.label} className="flex items-start gap-3 rounded-xl bg-korfez/[0.05] px-3 py-2.5">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.done ? "bg-cam text-kirec" : "border-2 border-dashed border-korfez/50"}`} aria-hidden="true">
                    {item.done ? "✓" : ""}
                  </span>
                  <span>
                    <span className="sr-only">{item.done ? "Tamamlandı: " : "Açık: "}</span>
                    {item.done ? item.label : <Link href={item.href} className="font-semibold underline underline-offset-4">{item.label}</Link>}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel title="Parolanızı değiştirin" className="lg:col-span-2">
          <ActionForm action={changeOwnPassword} className="grid items-end gap-4 md:grid-cols-3">
            <Field name="mevcutParola" label="Mevcut parola" type="password" required autoComplete="current-password" />
            <Field name="yeniParola" label="Yeni parola" type="password" required autoComplete="new-password" help="En az 10 karakter." />
            <SubmitButton className="btn btn-dark" pendingLabel="Kaydediliyor…">Parolayı güncelle</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
