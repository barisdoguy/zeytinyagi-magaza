import Link from "next/link";
import { getSite, LEGAL_LINKS } from "@/lib/site";
import { ConsentLink } from "./Consent";
import { Wordmark } from "./Header";

export function SellerInfo({ compact = false }: { compact?: boolean }) {
  const { content: c } = getSite();
  const rows: [string, string][] = [
    ["Satıcı", c.sellerLegalName],
    ["Adres", c.sellerAddress],
    ["Telefon", c.sellerPhone],
    ["E-posta", c.sellerEmail],
    ["MERSİS", c.sellerMersis],
    ["Vergi dairesi / no", [c.sellerTaxOffice, c.sellerTaxNumber].filter(Boolean).join(" / ")],
    ["KEP", c.sellerKep],
    ["İşletme kayıt no", c.sellerFoodRegNo],
  ];
  const filled = rows.filter(([, value]) => value);
  if (filled.length === 0)
    return (
      <p>
        <span className="pending">Satıcı bilgileri eklenecek</span>
      </p>
    );
  return (
    <dl className={compact ? "space-y-1 text-[0.9375rem]" : "space-y-2"}>
      {filled.map(([label, value]) => (
        <div key={label} className="flex gap-2">
          <dt className="shrink-0 font-semibold">{label}:</dt>
          <dd className="whitespace-pre-line">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Footer() {
  const { content } = getSite();
  return (
    <footer className="bg-korfez text-kirec">
      <div className="wrap grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark name={content.brandName} />
          <p className="mt-4 max-w-xs text-kirec/80">{content.tagline}</p>
          <p className="mt-2 text-kirec/80">{content.region}</p>
        </div>
        <nav aria-label="Alışveriş" className="md:col-span-2">
          <h2 className="eyebrow mb-4 text-altin">Alışveriş</h2>
          <ul className="space-y-2">
            <li><Link href="/urunler" className="hover:underline">Ürünler</Link></li>
            <li><Link href="/sepet" className="hover:underline">Sepet</Link></li>
            <li><Link href="/hikayemiz" className="hover:underline">Hikâyemiz</Link></li>
            <li><Link href="/sss" className="hover:underline">Sık Sorulanlar</Link></li>
            <li><Link href="/iletisim" className="hover:underline">İletişim</Link></li>
          </ul>
        </nav>
        <nav aria-label="Bilgi ve koşullar" className="md:col-span-3">
          <h2 className="eyebrow mb-4 text-altin">Bilgi ve koşullar</h2>
          <ul className="space-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:underline">{link.label}</Link>
              </li>
            ))}
            <li><ConsentLink /></li>
          </ul>
        </nav>
        <div className="md:col-span-3">
          <h2 className="eyebrow mb-4 text-altin">Satıcı bilgileri</h2>
          <SellerInfo compact />
        </div>
      </div>
      <div className="border-t border-kirec/15">
        <p className="wrap py-5 text-sm text-kirec/70">
          © {new Date().getFullYear()} {content.sellerLegalName || content.brandName}
        </p>
      </div>
    </footer>
  );
}
