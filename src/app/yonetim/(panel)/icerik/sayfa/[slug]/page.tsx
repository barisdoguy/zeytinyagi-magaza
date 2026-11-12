import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { requireUser } from "@/lib/auth/guard";
import { getPage } from "@/lib/pages";
import { savePage } from "../../../../actions";

export const metadata = { title: "Sayfayı düzenle" };

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser("content");
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader
        title={page.title}
        description="“## ” ile başlayan satırlar başlık, “- ” ile başlayan satırlar madde olur. Köşeli parantez içindeki bölümler sitede “tamamlanacak” olarak vurgulanır ve sayfanın yayımlanmasını engeller."
        action={
          <div className="flex gap-2">
            <Link href={`/${page.slug}`} target="_blank" className="btn btn-outline">Sitede gör</Link>
            <Link href="/yonetim/icerik" className="btn btn-outline">İçeriğe dön</Link>
          </div>
        }
      />
      <Panel>
        <p className="mb-5 rounded-xl bg-altin/25 px-4 py-3 text-[0.9375rem] font-semibold">
          Bu metinler hazır hukuki metin değildir. Yayımlamadan önce güncel mevzuata göre bir hukuk danışmanına inceletin.
        </p>
        <ActionForm action={savePage} className="space-y-4">
          <input type="hidden" name="slug" value={page.slug} />
          <Field name="title" label="Başlık" required defaultValue={page.title} />
          <Field name="body" label="Metin" multiline rows={26} defaultValue={page.body} />
          <div className="max-w-sm">
            <label htmlFor="status" className="field-label">Durum</label>
            <select key={page.status} id="status" name="status" defaultValue={page.status} className="field-input">
              <option value="draft">Taslak — sayfada “taslak” uyarısı görünür</option>
              <option value="published">Yayında</option>
            </select>
          </div>
          <SubmitButton className="btn btn-dark" pendingLabel="Kaydediliyor…">Sayfayı kaydet</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}
