import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray, sql } from "drizzle-orm";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireUser } from "@/lib/auth/guard";
import { can, ROLE_LABELS, type Permission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { contactMessages, orders } from "@/lib/db/schema";
import { getSite } from "@/lib/site";
import { logoutAction } from "../actions";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s · Yönetim" }, robots: { index: false, follow: false } };

const LINKS: { href: string; label: string; permission?: Permission }[] = [
  { href: "/yonetim", label: "Pano" },
  { href: "/yonetim/siparisler", label: "Siparişler", permission: "orders" },
  { href: "/yonetim/urunler", label: "Ürünler", permission: "products" },
  { href: "/yonetim/mesajlar", label: "Mesajlar", permission: "messages" },
  { href: "/yonetim/kuponlar", label: "Kuponlar", permission: "coupons" },
  { href: "/yonetim/icerik", label: "İçerik", permission: "content" },
  { href: "/yonetim/ayarlar", label: "Ayarlar", permission: "settings" },
  { href: "/yonetim/kullanicilar", label: "Kullanıcılar", permission: "users" },
  { href: "/yonetim/kayitlar", label: "İşlem kayıtları", permission: "audit" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { content } = getSite();
  const db = getDb();
  const toShip = db.select({ n: sql<number>`count(*)` }).from(orders).where(inArray(orders.status, ["paid", "preparing"])).get()?.n ?? 0;
  const unread = db.select({ n: sql<number>`count(*)` }).from(contactMessages).where(eq(contactMessages.handled, false)).get()?.n ?? 0;
  const links = LINKS.filter((l) => !l.permission || can(user.role, l.permission)).map((l) => ({
    href: l.href,
    label: l.label,
    badge: l.href.endsWith("siparisler") ? toShip : l.href.endsWith("mesajlar") ? unread : undefined,
  }));

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <aside className="bg-korfez text-kirec lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 lg:block lg:pt-6 lg:pb-5">
          <div>
            <p className="font-display text-xl leading-tight">{content.brandName}</p>
            <p className="text-sm text-kirec/70">Yönetim paneli</p>
          </div>
          <Link href="/" className="text-sm font-semibold underline underline-offset-4 lg:mt-3 lg:inline-block" target="_blank">Siteyi aç</Link>
        </div>
        <AdminNav links={links} />
        <div className="hidden px-5 py-5 lg:mt-auto lg:block">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-kirec/70">{ROLE_LABELS[user.role]} · {user.email}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="btn btn-sm btn-outline">Çıkış yap</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
        <div className="mx-auto mt-10 flex max-w-5xl items-center justify-between gap-3 border-t border-korfez/15 pt-5 lg:hidden">
          <p className="text-sm">{user.name} · {ROLE_LABELS[user.role]}</p>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-sm btn-outline">Çıkış yap</button>
          </form>
        </div>
      </main>
    </div>
  );
}
