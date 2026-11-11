import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, type Db, type Tx } from "./db/client";
import { products, variants, type Product, type Variant } from "./db/schema";

export type ProductWithVariants = Product & { variants: Variant[] };

/** Varyant satın alınabilir mi: etkin, fiyatı girilmiş ve stokta. */
export function isPurchasable(variant: Variant): boolean {
  return variant.active && variant.priceKurus != null && variant.priceKurus > 0 && variant.stock > 0;
}

export function hasPrice(variant: Variant): boolean {
  return variant.active && variant.priceKurus != null && variant.priceKurus > 0;
}

function attach(db: Db | Tx, rows: Product[], onlyActiveVariants: boolean): ProductWithVariants[] {
  if (rows.length === 0) return [];
  const all = db
    .select()
    .from(variants)
    .where(inArray(variants.productId, rows.map((r) => r.id)))
    .orderBy(asc(variants.sortOrder), asc(variants.id))
    .all();
  return rows.map((p) => ({
    ...p,
    variants: all.filter((v) => v.productId === p.id && (!onlyActiveVariants || v.active)),
  }));
}

/**
 * Vitrinde görünen ürünler: yayında olanlar. Fiyatı henüz girilmemiş taslak
 * ürünler de "yakında" olarak listelenir ama satın alınamaz.
 */
export function listStorefrontProducts(db: Db | Tx = getDb()): ProductWithVariants[] {
  const rows = db
    .select()
    .from(products)
    .where(inArray(products.status, ["active", "draft"]))
    .orderBy(asc(products.sortOrder), asc(products.id))
    .all();
  return attach(db, rows, true);
}

export function getStorefrontProduct(slug: string, db: Db | Tx = getDb()): ProductWithVariants | null {
  const row = db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), inArray(products.status, ["active", "draft"])))
    .get();
  return row ? attach(db, [row], true)[0] : null;
}

export function listAllProducts(db: Db | Tx = getDb()): ProductWithVariants[] {
  const rows = db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id)).all();
  return attach(db, rows, false);
}

export function getProductById(id: number, db: Db | Tx = getDb()): ProductWithVariants | null {
  const row = db.select().from(products).where(eq(products.id, id)).get();
  return row ? attach(db, [row], false)[0] : null;
}

/** Bir ürün yalnızca "active" durumdayken ve fiyatlı varyantı varken satışa açıktır. */
export function isOnSale(product: ProductWithVariants): boolean {
  return product.status === "active" && product.variants.some(hasPrice);
}

export function slugify(input: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (ch) => map[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatVolume(ml: number | null): string {
  if (ml == null) return "";
  if (ml >= 1000) return `${(ml / 1000).toLocaleString("tr-TR")} L`;
  return `${ml} ml`;
}
