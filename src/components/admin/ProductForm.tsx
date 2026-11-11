import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import type { Product } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/media";
import { saveProduct } from "@/app/yonetim/actions";

export function ProductForm({ product }: { product?: Product }) {
  return (
    <ActionForm action={saveProduct} className="space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="name" label="Ürün adı" required defaultValue={product?.name} maxLength={120} />
        <Field name="slug" label="Bağlantı adı" defaultValue={product?.slug} help="Adres çubuğunda görünür. Boş bırakırsanız addan üretilir." />
      </div>
      <Field name="summary" label="Kısa tanıtım" defaultValue={product?.summary} maxLength={300} help="Ürün kartında ve sayfa başında görünür." />
      <Field name="description" label="Açıklama" multiline rows={5} defaultValue={product?.description} help="Yalnızca doğrulayabildiğiniz bilgileri yazın; sağlık iddiası yazmayın." />
      <Field name="features" label="Ürün özellikleri" multiline rows={5} defaultValue={product?.features} help="Her satıra bir özellik." />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="status" className="field-label">Durum</label>
          <select id="status" name="status" defaultValue={product?.status ?? "draft"} className="field-input">
            <option value="draft">Taslak — sitede “yakında” olarak görünür, satın alınamaz</option>
            <option value="active">Yayında — fiyatlı seçenekler satın alınabilir</option>
            <option value="archived">Arşiv — sitede görünmez</option>
          </select>
        </div>
        <Field name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={String(product?.sortOrder ?? 0)} help="Küçük sayı önce gösterilir." />
      </div>
      <fieldset className="rounded-2xl border border-korfez/15 p-4">
        <legend className="px-2 font-semibold">Ürün fotoğrafı</legend>
        {product?.imageFile && (
          <div className="mb-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- yüklenen görselin önizlemesi */}
            <img src={mediaUrl(product.imageFile)} alt="" className="h-24 w-20 rounded-lg object-cover" />
            <label className="flex items-center gap-2"><input type="checkbox" name="removeImage" className="h-5 w-5" /> Fotoğrafı kaldır</label>
          </div>
        )}
        <label htmlFor="image" className="field-label">{product?.imageFile ? "Yeni fotoğraf yükle" : "Fotoğraf yükle"}</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field-input" />
        <p className="field-help">JPEG, PNG, WebP ya da AVIF; en fazla 5 MB. Dikey (4:5) kadraj en iyi sonucu verir. Görsel yüklenirken küçültülür.</p>
        <Field name="imageAlt" label="Fotoğraf açıklaması (alt metin)" defaultValue={product?.imageAlt} className="mt-4" help="Görseli göremeyenler için: fotoğrafta ne olduğunu kısaca yazın." />
      </fieldset>
      <SubmitButton className="btn btn-dark" pendingLabel="Kaydediliyor…">{product ? "Ürünü kaydet" : "Ürünü oluştur"}</SubmitButton>
    </ActionForm>
  );
}
