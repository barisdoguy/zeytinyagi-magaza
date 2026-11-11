import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice } from "@/components/site/DraftNotice";
import { parseSections, RichBlock } from "@/components/site/RichText";
import { getPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular",
  description: "Sipariş, kargo, ödeme, iade ve zeytinyağının saklanmasıyla ilgili sık sorulan sorular.",
  alternates: { canonical: "/sss" },
};

export default function FaqPage() {
  const page = getPage("sss");
  const { sections } = parseSections(page?.body ?? "");
  return (
    <div className="wrap max-w-3xl py-12 md:py-20">
      <p className="eyebrow text-altin-koyu">Yardım</p>
      <h1 className="mt-3 mb-8 text-5xl md:text-6xl">{page?.title ?? "Sık Sorulan Sorular"}</h1>
      {page?.status !== "published" && <DraftNotice />}
      {sections.length === 0 ? (
        <p className="card p-8">Henüz soru eklenmedi.</p>
      ) : (
        <div className="divide-y divide-korfez/20 border-y border-korfez/20">
          {sections.map((s) => (
            <details key={s.heading} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl md:text-2xl [&::-webkit-details-marker]:hidden">
                {s.heading}
                <span className="text-2xl text-altin-koyu transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <div className="prose-page pb-5 text-korfez/90"><RichBlock text={s.body} /></div>
            </details>
          ))}
        </div>
      )}
      <p className="mt-10 text-lg">
        Aradığınızı bulamadınız mı? <Link href="/iletisim" className="font-semibold underline underline-offset-4">Bize yazın.</Link>
      </p>
    </div>
  );
}
