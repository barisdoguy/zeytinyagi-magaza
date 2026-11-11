import { Consent } from "@/components/site/Consent";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSite } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { tracking } = getSite();
  return (
    <>
      <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-altin focus:px-4 focus:py-2 focus:font-semibold focus:text-korfez">
        İçeriğe geç
      </a>
      <Header />
      <main id="icerik" className="flex-1">
        {children}
      </main>
      <Footer />
      <Consent tracking={tracking} />
    </>
  );
}
