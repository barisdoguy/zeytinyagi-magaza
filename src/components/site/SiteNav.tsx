"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/urunler", label: "Ürünler" },
  { href: "/hikayemiz", label: "Hikâyemiz" },
  { href: "/sss", label: "Sık Sorulanlar" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteNav({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="Ana menü" className="hidden md:block">
        <ul className="flex items-center gap-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className="py-2 font-semibold underline-offset-8 decoration-altin decoration-2 hover:underline aria-[current=page]:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/sepet" className="btn btn-sm btn-gold" aria-label={`Sepet, ${cartCount} ürün`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 8h14l-1.2 11H6.2L5 8zM9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span>Sepet</span>
          {cartCount > 0 && <span className="rounded-full bg-korfez px-2 text-sm text-kirec">{cartCount}</span>}
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-kirec/40 md:hidden"
          aria-expanded={open}
          aria-controls="mobil-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Menüyü kapat" : "Menüyü aç"}</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobil-menu" aria-label="Mobil menü" className="absolute inset-x-0 top-full border-t border-kirec/15 bg-korfez px-5 pb-6 md:hidden">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href} className="border-b border-kirec/15">
                <Link href={link.href} aria-current={isCurrent(link.href) ? "page" : undefined} className="block py-4 font-display text-2xl">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
