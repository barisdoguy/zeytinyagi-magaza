import type { Metadata } from "next";
import Link from "next/link";
import { LandscapeArt } from "@/components/art/LandscapeArt";
import { Paragraphs } from "@/components/site/RichText";
import { VisualSlot } from "@/components/site/VisualSlot";
import { getSite } from "@/lib/site";

export function generateMetadata(): Metadata {
  const { content } = getSite();
  return { title: "Hikâyemiz", description: content.storyLead, alternates: { canonical: "/hikayemiz" } };
}

export default function StoryPage() {
  const { content: c, images } = getSite();
  const notes: [string, string][] = [
    ["Hasat", c.hasatNote],
    ["Sıkım", c.sikimNote],
    ["Dinlenme ve saklama", c.dinlenmeNote],
    ["Dolum", c.dolumNote],
  ];
  return (
    <>
      <section className="grain relative bg-korfez py-16 text-kirec md:py-24">
        <div className="wrap relative z-10 max-w-4xl">
          <p className="eyebrow text-altin">Hikâyemiz · {c.region}</p>
          <h1 className="mt-5 text-[clamp(2.5rem,6vw,4.75rem)]">{c.storyTitle}</h1>
          <p className="mt-6 max-w-2xl text-xl text-kirec/85">{c.storyLead}</p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="wrap grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-6" data-reveal>
            <VisualSlot image={images.hikaye} alt="Üretici ve üretim" fallback={<LandscapeArt />} className="aspect-[4/5] md:sticky md:top-28" />
          </div>
          <div className="space-y-12 md:col-span-6">
            <div data-reveal>
              <h2 className="text-4xl">Yer</h2>
              <div className="mt-4 space-y-4 text-lg text-korfez/85"><Paragraphs text={c.storyPlace} /></div>
            </div>
            <div data-reveal>
              <h2 className="text-4xl">Üretici</h2>
              <div className="mt-4 space-y-4 text-lg text-korfez/85">
                {c.storyPersonal ? <Paragraphs text={c.storyPersonal} /> : <p><span className="pending">Üreticinin kendi hikâyesi eklenecek</span></p>}
              </div>
            </div>
            <div data-reveal>
              <h2 className="text-4xl">Yaklaşım</h2>
              <div className="mt-4 space-y-4 text-lg text-korfez/85"><Paragraphs text={c.storyPromise} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cam py-16 text-kirec md:py-24">
        <div className="wrap">
          <h2 className="text-4xl md:text-5xl">{c.uretimTitle}</h2>
          <dl className="mt-10 grid gap-5 sm:grid-cols-2">
            {notes.map(([title, note], i) => (
              <div key={title} className="rounded-[1.5rem] border border-kirec/20 p-6">
                <dt className="flex items-baseline gap-3 font-display text-2xl"><span className="text-altin">{i + 1}</span>{title}</dt>
                <dd className="mt-3">{note || <span className="pending">Üretici notu eklenecek</span>}</dd>
              </div>
            ))}
          </dl>
          <Link href="/urunler" className="btn btn-gold mt-10">Ürünleri incele</Link>
        </div>
      </section>
    </>
  );
}
