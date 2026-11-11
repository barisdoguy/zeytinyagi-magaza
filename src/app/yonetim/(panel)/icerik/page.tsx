import Link from "next/link";
import { ContentGroupForm } from "@/components/admin/ContentGroupForm";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { requireUser } from "@/lib/auth/guard";
import { IMAGE_SLOTS, type ImageSlot } from "@/lib/content/store";
import { formatDate } from "@/lib/dates";
import { mediaUrl } from "@/lib/media";
import { listPages } from "@/lib/pages";
import { getSite } from "@/lib/site";
import { uploadSlotImage } from "../../actions";

export const metadata = { title: "İçerik" };

export default async function ContentPage() {
  await requireUser("content");
  const { content, images } = getSite();
  const pages = listPages();
  return (
    <>
      <PageHeader title="İçerik" description="Sitedeki metinler, fotoğraflar ve sayfalar. Boş bıraktığınız gerçek bilgi alanları sitede “eklenecek” olarak görünür; uydurma bilgi gösterilmez." />
      <div className="space-y-6">
        <Panel title="Sayfalar">
          <ul className="divide-y divide-korfez/10">
            {pages.map((page) => (
              <li key={page.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={`/yonetim/icerik/sayfa/${page.slug}`} className="font-semibold underline underline-offset-4">{page.title}</Link>
                <span className="flex items-center gap-3 text-sm text-korfez/70">
                  {formatDate(page.updatedAt)}
                  {page.status === "published" ? <Badge tone="good">Yayında</Badge> : <Badge tone="warn">Taslak</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Fotoğraflar">
          <p className="mb-5 text-korfez/75">Gerçek fotoğraf yüklenene kadar bu alanlarda “illüstrasyon” etiketiyle çizim gösterilir.</p>
          <div className="grid gap-5 md:grid-cols-3">
            {(Object.keys(IMAGE_SLOTS) as ImageSlot[]).map((slot) => (
              <div key={slot} className="rounded-2xl border border-korfez/15 p-4">
                <h3 className="text-xl">{IMAGE_SLOTS[slot].label}</h3>
                <p className="text-sm text-korfez/70">{IMAGE_SLOTS[slot].hint}</p>
                {images[slot] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- yüklenen görselin önizlemesi
                  <img src={mediaUrl(images[slot] as string)} alt="" className="mt-3 aspect-[5/4] w-full rounded-xl object-cover" />
                ) : (
                  <p className="mt-3"><Badge tone="warn">Fotoğraf yüklenmedi</Badge></p>
                )}
                <ActionForm action={uploadSlotImage} className="mt-4 space-y-3">
                  <input type="hidden" name="slot" value={slot} />
                  <label htmlFor={`image-${slot}`} className="sr-only">{IMAGE_SLOTS[slot].label} dosyası</label>
                  <input id={`image-${slot}`} name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field-input" />
                  {images[slot] && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="remove" className="h-5 w-5" /> Fotoğrafı kaldır</label>}
                  <SubmitButton className="btn btn-sm btn-dark" pendingLabel="Yükleniyor…">Kaydet</SubmitButton>
                </ActionForm>
              </div>
            ))}
          </div>
        </Panel>

        <ContentGroupForm group="kunye" content={content} />
        <ContentGroupForm group="uretim" content={content} />
        <ContentGroupForm group="hikaye" content={content} />
        <ContentGroupForm group="anasayfa" content={content} />
      </div>
    </>
  );
}
