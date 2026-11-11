import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { checkCoupon, normalizeCouponCode } from "./coupons";
import { loadContent, shippingConfig } from "./content/store";
import type { Db, Tx } from "./db/client";
import { coupons, products, variants } from "./db/schema";
import { computeTotals, type CouponRule, type Totals } from "./pricing";

export const MAX_LINES = 20;
export const MAX_QTY = 24;

const itemsSchema = z
  .array(z.object({ v: z.number().int().positive(), q: z.number().int().min(1).max(MAX_QTY) }))
  .max(MAX_LINES);

export type CartItem = { v: number; q: number };

/** Çerezden gelen sepeti doğrular; bozuk veride boş sepet döner. */
export function parseCartCookie(raw: string | undefined): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = itemsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function addItem(items: CartItem[], variantId: number, quantity: number): CartItem[] {
  const next = items.map((i) => ({ ...i }));
  const existing = next.find((i) => i.v === variantId);
  if (existing) existing.q = Math.min(existing.q + quantity, MAX_QTY);
  else if (next.length < MAX_LINES) next.push({ v: variantId, q: Math.min(Math.max(quantity, 1), MAX_QTY) });
  return next;
}

export function setQuantity(items: CartItem[], variantId: number, quantity: number): CartItem[] {
  if (quantity <= 0) return items.filter((i) => i.v !== variantId);
  return items.map((i) => (i.v === variantId ? { ...i, q: Math.min(quantity, MAX_QTY) } : i));
}

export type CartLine = {
  variantId: number;
  productName: string;
  productSlug: string;
  variantLabel: string;
  imageFile: string | null;
  unitPriceKurus: number;
  quantity: number;
  lineTotalKurus: number;
  stock: number;
};

export type CartView = {
  lines: CartLine[];
  /** Satıştan kalktığı için sepetten düşen satır sayısı. */
  removedCount: number;
  /** Stok yetmediği için adedi azaltılan satır var mı. */
  quantityAdjusted: boolean;
  totals: Totals;
  shippingConfigured: boolean;
  freeShippingThresholdKurus: number | null;
  coupon: { code: string; discountKurus: number } | null;
  couponError: string | null;
  /** Güncel duruma göre düzeltilmiş çerez içeriği. */
  items: CartItem[];
};

/**
 * Sepeti güncel fiyat ve stokla yeniden kurar. Fiyatlar her zaman
 * veritabanından okunur; çerezde yalnızca varyant kimliği ve adet bulunur.
 */
export function buildCart(db: Db | Tx, items: CartItem[], couponCode: string | null | undefined): CartView {
  const ids = items.map((i) => i.v);
  const rows =
    ids.length === 0
      ? []
      : db
          .select({ variant: variants, product: products })
          .from(variants)
          .innerJoin(products, eq(products.id, variants.productId))
          .where(inArray(variants.id, ids))
          .all();

  const lines: CartLine[] = [];
  let removedCount = 0;
  let quantityAdjusted = false;
  for (const item of items) {
    const row = rows.find((r) => r.variant.id === item.v);
    const price = row?.variant.priceKurus;
    if (!row || row.product.status !== "active" || !row.variant.active || !price || row.variant.stock <= 0) {
      removedCount++;
      continue;
    }
    const quantity = Math.min(item.q, row.variant.stock, MAX_QTY);
    if (quantity !== item.q) quantityAdjusted = true;
    lines.push({
      variantId: row.variant.id,
      productName: row.product.name,
      productSlug: row.product.slug,
      variantLabel: row.variant.label,
      imageFile: row.product.imageFile,
      unitPriceKurus: price,
      quantity,
      lineTotalKurus: price * quantity,
      stock: row.variant.stock,
    });
  }

  const shipping = shippingConfig(loadContent(db));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalKurus, 0);

  let rule: CouponRule | null = null;
  let coupon: CartView["coupon"] = null;
  let couponError: string | null = null;
  if (couponCode && lines.length > 0) {
    const code = normalizeCouponCode(couponCode);
    const record = db.select().from(coupons).where(eq(coupons.code, code)).get();
    const check = checkCoupon(record, subtotal);
    if (check.ok) {
      rule = check.rule;
      coupon = { code, discountKurus: check.discountKurus };
    } else couponError = check.reason;
  }

  const totals = computeTotals({
    lines,
    shippingFeeKurus: shipping.feeKurus,
    freeShippingThresholdKurus: shipping.freeThresholdKurus,
    coupon: rule,
  });

  return {
    lines,
    removedCount,
    quantityAdjusted,
    totals,
    shippingConfigured: shipping.configured,
    freeShippingThresholdKurus: shipping.freeThresholdKurus,
    coupon,
    couponError,
    items: lines.map((l) => ({ v: l.variantId, q: l.quantity })),
  };
}
