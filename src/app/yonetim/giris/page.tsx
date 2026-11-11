import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { currentUser } from "@/lib/auth/guard";
import { getSite } from "@/lib/site";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Yönetim girişi", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await currentUser()) redirect("/yonetim");
  const { content } = getSite();
  return (
    <main className="grain relative flex flex-1 items-center justify-center bg-korfez px-5 py-16">
      <div className="card relative z-10 w-full max-w-md p-8">
        <p className="eyebrow text-altin-koyu">{content.brandName}</p>
        <h1 className="mt-2 text-4xl">Yönetim paneli</h1>
        <ActionForm action={loginAction} className="mt-6 space-y-4">
          <Field name="email" label="E-posta" type="email" required autoComplete="username" inputMode="email" />
          <Field name="parola" label="Parola" type="password" required autoComplete="current-password" />
          <SubmitButton className="btn btn-dark w-full" pendingLabel="Giriş yapılıyor…">Giriş yap</SubmitButton>
        </ActionForm>
      </div>
    </main>
  );
}
