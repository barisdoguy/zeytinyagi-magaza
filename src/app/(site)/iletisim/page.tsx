import type { Metadata } from "next";
import Link from "next/link";
import { SellerInfo } from "@/components/site/Footer";
import { ActionForm, Checkbox, Field, SubmitButton } from "@/components/ui/ActionForm";
import { getSite } from "@/lib/site";
import { sendContactMessage } from "../actions";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Satıcı bilgileri ve iletişim formu. Siparişiniz ya da ürünlerimizle ilgili sorularınızı bize yazın.",
  alternates: { canonical: "/iletisim" },
};

export default function ContactPage() {
  const { content: c } = getSite();
  return (
    <div className="wrap py-12 md:py-20">
      <p className="eyebrow text-altin-koyu">İletişim</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Bize yazın</h1>
      <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-14">
        <section className="md:col-span-5" aria-labelledby="satici-baslik">
          <h2 id="satici-baslik" className="text-3xl">Satıcı bilgileri</h2>
          <div className="mt-4"><SellerInfo /></div>
          <p className="mt-6 text-korfez/80">{c.region}</p>
          <p className="mt-6">
            <Link href="/teslimat-ve-iade" className="font-semibold underline underline-offset-4">Teslimat ve iade koşulları</Link>
          </p>
        </section>
        <section className="card p-6 md:col-span-7 md:p-8" aria-labelledby="form-baslik">
          <h2 id="form-baslik" className="text-3xl">Mesaj gönderin</h2>
          <ActionForm action={sendContactMessage} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Adınız" required autoComplete="name" />
              <Field name="email" label="E-posta" type="email" required autoComplete="email" inputMode="email" />
            </div>
            <Field name="message" label="Mesajınız" required multiline rows={6} help="Siparişinizle ilgiliyse sipariş numaranızı da yazın." />
            <div className="hidden" aria-hidden="true">
              <label>Web sitesi<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <Checkbox name="privacy">
              Kişisel verilerime ilişkin <Link href="/gizlilik-ve-kvkk" target="_blank" className="font-semibold underline">aydınlatma metnini</Link> okudum.
            </Checkbox>
            <SubmitButton pendingLabel="Gönderiliyor…">Mesajı gönder</SubmitButton>
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
