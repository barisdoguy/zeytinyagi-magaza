import Link from "next/link";
import { cartCount } from "@/lib/cart";
import { getSite } from "@/lib/site";
import { SiteNav } from "./SiteNav";

export function Wordmark({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden="true">
        <path d="M32 6c11 14 18 25 18 34a18 18 0 1 1-36 0c0-9 7-20 18-34z" fill="#e0a526" />
        <path d="M24 41a9 9 0 0 0 7 8" fill="none" stroke="#12263a" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.1rem] leading-none sm:text-[1.35rem] font-semibold tracking-tight">{name}</span>
    </span>
  );
}

export async function Header() {
  const { content, payment } = getSite();
  const count = await cartCount();
  return (
    <header className="sticky top-0 z-40 bg-korfez text-kirec">
      {payment.available && payment.isTest && (
        <p className="bg-altin px-4 py-1.5 text-center text-sm font-semibold text-korfez">
          Deneme modu: bu sitede şu anda gerçek ödeme alınmıyor.
        </p>
      )}
      <div className="wrap relative flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" aria-label={`${content.brandName} — ana sayfa`}>
          <Wordmark name={content.brandName} />
        </Link>
        <SiteNav cartCount={count} />
      </div>
    </header>
  );
}
