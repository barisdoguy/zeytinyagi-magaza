import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grain relative flex flex-1 items-center bg-korfez py-24 text-kirec">
      <div className="wrap relative z-10">
        <p className="eyebrow text-altin">404</p>
        <h1 className="mt-4 text-6xl">Bu sayfayı bulamadık</h1>
        <p className="mt-4 max-w-md text-lg text-kirec/85">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-gold">Ana sayfa</Link>
          <Link href="/urunler" className="btn btn-outline">Ürünler</Link>
        </div>
      </div>
    </main>
  );
}
