import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/guard";

export const metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  await requireUser("products");
  return (
    <>
      <PageHeader title="Yeni ürün" description="Önce ürünü oluşturun; hacim, fiyat ve stok seçeneklerini bir sonraki ekranda eklersiniz." action={<Link href="/yonetim/urunler" className="btn btn-outline">Ürünlere dön</Link>} />
      <Panel><ProductForm /></Panel>
    </>
  );
}
