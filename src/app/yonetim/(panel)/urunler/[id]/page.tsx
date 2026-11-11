import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantForm } from "@/components/admin/VariantForm";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { getProductById } from "@/lib/catalog";
import { deleteProduct } from "../../../actions";

export const metadata = { title: "Ürünü düzenle" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ yeni?: string }> }) {
  const user = await requireUser("products");
  const { id } = await params;
  const { yeni } = await searchParams;
  const product = /^\d+$/.test(id) ? getProductById(Number(id)) : null;
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        action={
          <div className="flex gap-2">
            {product.status !== "archived" && <Link href={`/urunler/${product.slug}`} target="_blank" className="btn btn-outline">Sitede gör</Link>}
            <Link href="/yonetim/urunler" className="btn btn-outline">Ürünlere dön</Link>
          </div>
        }
      />
      {yeni && <p role="status" className="mb-6 rounded-xl bg-cam/10 px-4 py-3 font-semibold text-cam">Ürün oluşturuldu. Şimdi hacim, fiyat ve stok seçeneklerini ekleyin.</p>}
      <div className="space-y-6">
        <Panel title="Seçenekler: hacim, fiyat, stok">
          <div className="space-y-4">
            {product.variants.map((v) => <VariantForm key={v.id} productId={product.id} variant={v} />)}
            <details className="rounded-2xl bg-korfez/[0.04] p-4" open={product.variants.length === 0}>
              <summary className="cursor-pointer font-semibold">Yeni seçenek ekle</summary>
              <div className="mt-4"><VariantForm productId={product.id} /></div>
            </details>
          </div>
        </Panel>
        <Panel title="Ürün bilgileri"><ProductForm product={product} /></Panel>
        {can(user.role, "settings") && (
          <Panel title="Ürünü sil">
            <p className="mb-4 text-korfez/75">Silinen ürün geri getirilemez. Geçmiş siparişlerdeki ürün adı ve fiyat bilgisi korunur. Ürünü yalnızca satıştan kaldırmak istiyorsanız durumunu “Arşiv” yapın.</p>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <button type="submit" className="btn btn-sm btn-outline text-kiremit-koyu">Ürünü kalıcı olarak sil</button>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
