"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ links }: { links: { href: string; label: string; badge?: number }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Yönetim menüsü">
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible lg:px-4 lg:py-0">
        {links.map((link) => {
          const current = link.href === "/yonetim" ? pathname === "/yonetim" : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 font-semibold whitespace-nowrap hover:bg-kirec/10 aria-[current=page]:bg-altin aria-[current=page]:text-korfez"
              >
                {link.label}
                {link.badge ? <span className="rounded-full bg-kiremit px-2 text-sm text-white">{link.badge}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
