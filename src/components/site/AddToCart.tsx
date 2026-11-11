"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/app/(site)/actions";
import { ActionForm, SubmitButton, useFormState } from "@/components/ui/ActionForm";

export type VariantOption = {
  id: number;
  label: string;
  price: string | null;
  stock: number;
  purchasable: boolean;
};

function stockText(v: VariantOption) {
  if (!v.price) return "Fiyat yakında";
  if (v.stock <= 0) return "Stokta yok";
  if (v.stock <= 5) return `Son ${v.stock} adet`;
  return "Stokta";
}

function AfterAdd() {
  const state = useFormState();
  if (!state?.ok) return null;
  return (
    <Link href="/sepet" className="btn btn-dark w-full">
      Sepete git
    </Link>
  );
}

export function AddToCart({ variants }: { variants: VariantOption[] }) {
  const firstAvailable = variants.find((v) => v.purchasable) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const selected = variants.find((v) => v.id === selectedId) ?? firstAvailable;
  if (!selected) return <p><span className="pending">Seçenekler eklenecek</span></p>;
  const maxQty = Math.max(1, Math.min(selected.stock, 12));

  return (
    <ActionForm action={addToCart} className="space-y-5">
      <fieldset>
        <legend className="field-label">Hacim ve ambalaj</legend>
        <div className="grid gap-2">
          {variants.map((v) => (
            <label
              key={v.id}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-altin ${
                v.id === selected.id ? "border-korfez bg-[#fffdf8]" : "border-korfez/20 hover:border-korfez/50"
              } ${v.purchasable ? "" : "opacity-70"}`}
            >
              <span className="flex items-center gap-3">
                <input type="radio" name="variantId" value={v.id} checked={v.id === selected.id} onChange={() => setSelectedId(v.id)} className="h-5 w-5 accent-[var(--color-korfez)]" />
                <span>
                  <span className="block font-semibold">{v.label}</span>
                  <span className={`block text-sm ${v.purchasable ? "text-cam" : "text-kiremit-koyu"}`}>{stockText(v)}</span>
                </span>
              </span>
              <span className="font-display text-xl whitespace-nowrap">{v.price ?? "—"}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {selected.purchasable ? (
        <div className="flex items-end gap-3">
          <div>
            <label htmlFor="quantity" className="field-label">Adet</label>
            <select id="quantity" name="quantity" defaultValue="1" key={selected.id} className="field-input w-24">
              {Array.from({ length: maxQty }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <SubmitButton className="btn btn-primary flex-1" pendingLabel="Ekleniyor…">Sepete ekle</SubmitButton>
        </div>
      ) : (
        <p className="rounded-2xl bg-korfez/[0.06] px-4 py-3 font-semibold">
          {selected.price ? "Bu seçenek şu anda stokta yok." : "Bu ürünün fiyatı henüz açıklanmadı; satışa açıldığında buradan sipariş verebilirsiniz."}
        </p>
      )}
      <AfterAdd />
    </ActionForm>
  );
}
