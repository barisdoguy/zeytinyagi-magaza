import type { Metadata } from "next";
import Link from "next/link";
import { LandscapeArt } from "@/components/art/LandscapeArt";
import { TableArt } from "@/components/art/TableArt";
import { HeroVisual } from "@/components/hero/HeroVisual";
import { SellerInfo } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { Paragraphs } from "@/components/site/RichText";
import { VisualSlot } from "@/components/site/VisualSlot";
import { listStorefrontProducts } from "@/lib/catalog";
import { getSite } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

function SectionLabel({ no, children, className = "" }: { no: string; children: string; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      <span className="font-display text-base tracking-normal">{no}</span>
      <span className="h-px w-10 bg-current opacity-50" aria-hidden="true" />
      {children}
    </p>
  );
}

export default function HomePage() {
  const { content: c, images, payment } = getSite();
  const products = listStorefrontProducts();
  const [titleLead, titleRest] = c.heroTitle.includes(",") ? [c.heroTitle.slice(0, c.heroTitle.indexOf(",") + 1), c.heroTitle.slice(c.heroTitle.indexOf(",") + 1)] : [c.heroTitle, ""];

  const steps = [
    { title: "Hasat", text: "Her şey dalda başlar. Zeytinin ne zaman ve nasıl toplandığı, yağın tadını en çok belirleyen karardır.", note: c.hasatNote },
    { title: "Sıkım", text: "Toplanan zeytin sıkıma gider. Dalla sıkım arasındaki süre ve sıkımın yöntemi yağın karakterine doğrudan yansır.", note: c.sikimNote },
    { title: "Dinlenme", text: "Sıkımdan çıkan yağ dinlenmeye alınır; ışıktan, sıcaktan ve havadan uzak bekler.", note: c.dinlenmeNote },
    { title: "Dolum", text: "Son durak dolum: yağ şişeye ve tenekeye girer, siparişinizle birlikte yola çıkar.", note: c.dolumNote },
  ];
  const kunye: [string, string][] = [
    ["Yöre", c.region],
    ["Zeytin çeşidi", c.zeytinCesidi],
    ["Hasat dönemi", c.hasatDonemi],
    ["Sıkım yöntemi", c.sikimYontemi],
    ["Asitlik", c.asitlik],
    ["Tat profili", c.tatProfili],
    ["Belgeler", c.belgeler],
  ];
  const uses = [
    ["Kahvaltıda", "Ekmeğe, domatese, peynire; yanında bir tutam kekikle."],
    ["Salatada ve mezede", "Çiğ olarak; tadını en açık gösterdiği yer."],
    ["Tencerede", "Zeytinyağlılarda, kısık ateşte ve acele etmeden."],
    ["Son dokunuş", "Çorbanın, ızgaranın, fırından çıkan sebzenin üstüne."],
  ];

  return (
    <>
      {/* ── Giriş: markanın dünyası ── */}
      <section className="grain relative overflow-hidden bg-korfez text-kirec">
        <div className="wrap relative z-10 grid items-center gap-6 pt-12 pb-10 md:grid-cols-12 md:gap-4 md:pt-20 md:pb-16">
          <div className="md:col-span-6">
            <p className="eyebrow text-altin">{c.heroEyebrow}</p>
            <h1 className="mt-5 text-[clamp(2.75rem,7.2vw,5.75rem)]">
              {titleLead}
              {titleRest && <em className="text-altin"> {titleRest.trim()}</em>}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-kirec/85 md:text-xl">{c.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/urunler" className="btn btn-primary">Yağları gör</Link>
              <Link href="/hikayemiz" className="btn btn-outline">Hikâyemizi oku</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md md:col-span-6 md:max-w-none">
            <HeroVisual />
          </div>
        </div>
        <div className="relative z-10 border-t border-kirec/15">
          <ul className="wrap grid gap-x-8 gap-y-2 py-5 text-[0.9375rem] font-semibold sm:grid-cols-3">
            <li><span className="text-altin" aria-hidden="true">◆ </span>Üreticiden doğrudan gönderim</li>
            <li><Link href="/teslimat-ve-iade" className="underline-offset-4 hover:underline"><span className="text-altin" aria-hidden="true">◆ </span>Teslimat ve iade koşulları</Link></li>
            <li><Link href="/iletisim" className="underline-offset-4 hover:underline"><span className="text-altin" aria-hidden="true">◆ </span>Satıcı bilgileri ve iletişim</Link></li>
          </ul>
        </div>
      </section>

      {/* ── 01 Yöre ── */}
      <section className="py-20 md:py-28">
        <div className="wrap grid items-center gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-7" data-reveal>
            <VisualSlot image={images.yore} alt={`${c.region} — zeytinlik`} fallback={<LandscapeArt />} className="aspect-[5/4]" />
          </div>
          <div className="md:col-span-5" data-reveal>
            <SectionLabel no="01" className="text-altin-koyu">Yöre</SectionLabel>
            <h2 className="mt-5 text-4xl md:text-5xl">{c.yoreTitle}</h2>
            <div className="mt-6 space-y-4 text-lg text-korfez/85">
              <Paragraphs text={c.yoreText} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 Üretim yaklaşımı ── */}
      <section className="grain relative bg-cam py-20 text-kirec md:py-28">
        <div className="wrap relative z-10">
          <div className="max-w-2xl" data-reveal>
            <SectionLabel no="02" className="text-altin">Üretim</SectionLabel>
            <h2 className="mt-5 text-4xl md:text-5xl">{c.uretimTitle}</h2>
            <p className="mt-5 text-lg text-kirec/85">{c.uretimIntro}</p>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col rounded-[1.5rem] border border-kirec/20 bg-kirec/[0.06] p-6" data-reveal>
                <span className="font-display text-6xl leading-none text-altin" aria-hidden="true">{i + 1}</span>
                <h3 className="mt-4 text-2xl">{step.title}</h3>
                <p className="mt-2 text-kirec/85">{step.text}</p>
                <div className="mt-5 border-t border-kirec/20 pt-4">
                  <p className="eyebrow text-kirec/75">Bizde nasıl?</p>
                  {step.note ? <p className="mt-2">{step.note}</p> : <p className="mt-2"><span className="pending">Üretici notu eklenecek</span></p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 03 Ayırt edici özellikler: künye ── */}
      <section id="kunye" className="scroll-mt-24 bg-kirec-koyu py-20 md:py-28">
        <div className="wrap grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-5" data-reveal>
            <SectionLabel no="03" className="text-altin-koyu">Özellikler</SectionLabel>
            <h2 className="mt-5 text-4xl md:text-5xl">{c.kunyeTitle}</h2>
            <p className="mt-5 text-lg text-korfez/85">{c.kunyeIntro}</p>
          </div>
          <div className="md:col-span-7" data-reveal>
            <dl className="rounded-[1.5rem] border-2 border-korfez bg-kirec p-6 md:p-8">
              {kunye.map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-3 border-b border-dashed border-korfez/30 py-3.5 last:border-0">
                  <dt className="eyebrow shrink-0 text-korfez/75">{label}</dt>
                  <span className="min-w-4 flex-1" aria-hidden="true" />
                  <dd className="text-right font-display text-xl">{value || <span className="pending font-sans">eklenecek</span>}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── 04 Sofradaki yeri ── */}
      <section className="grain relative bg-kiremit py-20 text-white md:py-28">
        <div className="wrap relative z-10 grid items-center gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-6" data-reveal>
            <SectionLabel no="04">Sofra</SectionLabel>
            <h2 className="mt-5 text-4xl md:text-5xl">{c.sofraTitle}</h2>
            <p className="mt-5 text-lg">{c.sofraText}</p>
            <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {uses.map(([title, text]) => (
                <div key={title} className="border-t border-white/40 pt-3">
                  <dt className="font-display text-xl">{title}</dt>
                  <dd className="mt-1">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:col-span-6" data-reveal>
            <VisualSlot image={images.sofra} alt="Sofrada zeytinyağı" fallback={<TableArt />} className="aspect-[5/4]" />
          </div>
        </div>
      </section>

      {/* ── 05 Ürün seçkisi ── */}
      <section className="py-20 md:py-28">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div>
              <SectionLabel no="05" className="text-altin-koyu">Seçki</SectionLabel>
              <h2 className="mt-5 text-4xl md:text-5xl">Şişede, tenekede, kutuda</h2>
            </div>
            <Link href="/urunler" className="btn btn-dark">Tüm ürünler</Link>
          </div>
          {products.length > 0 ? (
            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((p) => (
                <div key={p.id} data-reveal>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <p className="card mt-12 p-8 text-center">Ürünler çok yakında burada olacak.</p>
          )}
        </div>
      </section>

      {/* ── Güven ── */}
      <section className="bg-korfez py-20 text-kirec" aria-labelledby="guven-baslik">
        <div className="wrap">
          <h2 id="guven-baslik" className="max-w-xl text-4xl md:text-5xl">Kimden, nasıl alıyorsunuz?</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.5rem] border border-kirec/20 p-6">
              <h3 className="text-2xl text-altin">Satıcı</h3>
              <div className="mt-3 text-[0.9375rem]"><SellerInfo compact /></div>
              <Link href="/iletisim" className="mt-4 inline-block font-semibold underline underline-offset-4">İletişim</Link>
            </div>
            <div className="rounded-[1.5rem] border border-kirec/20 p-6">
              <h3 className="text-2xl text-altin">Teslimat</h3>
              <p className="mt-3">{c.deliveryNote || <span className="pending">Teslimat süresi eklenecek</span>}</p>
              <p className="mt-2 text-kirec/80">Kargo ücreti sepette, siparişi onaylamadan önce gösterilir.</p>
              <Link href="/teslimat-ve-iade" className="mt-4 inline-block font-semibold underline underline-offset-4">Teslimat koşulları</Link>
            </div>
            <div className="rounded-[1.5rem] border border-kirec/20 p-6">
              <h3 className="text-2xl text-altin">İade</h3>
              <p className="mt-3">{c.returnNote || <span className="pending">İade koşulları özeti eklenecek</span>}</p>
              <Link href="/teslimat-ve-iade" className="mt-4 inline-block font-semibold underline underline-offset-4">İade koşulları</Link>
            </div>
            <div className="rounded-[1.5rem] border border-kirec/20 p-6">
              <h3 className="text-2xl text-altin">Ödeme</h3>
              <p className="mt-3">Kart bilgileriniz bu sitede işlenmez ve saklanmaz; ödeme, ödeme kuruluşunun kendi güvenli sayfasında alınır.</p>
              {(!payment.available || payment.isTest) && <p className="mt-3"><span className="pending">Çevrimiçi ödeme henüz açılmadı</span></p>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Satın alma çağrısı ── */}
      <section className="grain relative overflow-hidden bg-altin py-20 text-korfez md:py-28">
        <div className="wrap relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)]">{c.ctaTitle}</h2>
            <p className="mt-4 text-xl">{c.ctaText}</p>
          </div>
          <Link href="/urunler" className="btn btn-dark px-8 text-lg">Ürünleri incele</Link>
        </div>
      </section>
    </>
  );
}
