import { eq } from "drizzle-orm";
import type { Db } from "./client";
import { pages, products, settings, variants } from "./schema";
import { SEED_PAGES } from "../content/seed-pages";

const SEEDED_FLAG = "__catalogSeeded";

/**
 * İlk çalıştırmada taslak içerik oluşturur. Fiyat, stok, analiz değeri gibi
 * gerçek bilgi gerektiren alanlar boş bırakılır; örnek sipariş oluşturulmaz.
 */
export function seed(db: Db) {
  const now = Date.now();
  for (const page of SEED_PAGES) {
    db.insert(pages)
      .values({ ...page, status: "draft", updatedAt: now })
      .onConflictDoNothing()
      .run();
  }

  const flagged = db.select().from(settings).where(eq(settings.key, SEEDED_FLAG)).get();
  if (flagged) return;

  db.transaction((tx) => {
    const add = (
      product: { slug: string; name: string; summary: string; sortOrder: number },
      items: { label: string; volumeMl: number | null; packaging: string }[],
    ) => {
      const row = tx
        .insert(products)
        .values({ ...product, status: "draft", createdAt: now, updatedAt: now })
        .returning({ id: products.id })
        .get();
      items.forEach((item, index) =>
        tx.insert(variants).values({ ...item, productId: row.id, sortOrder: index }).run(),
      );
    };

    add(
      { slug: "erken-hasat-zeytinyagi", name: "Erken Hasat Zeytinyağı", summary: "Sezonun ilk hasadından; küçük partiler hâlinde.", sortOrder: 1 },
      [{ label: "500 ml cam şişe", volumeMl: 500, packaging: "Cam şişe" }],
    );
    add(
      { slug: "zeytinyagi", name: "Zeytinyağı", summary: "Mutfağın her günkü yağı; cam şişe ve teneke seçenekleriyle.", sortOrder: 2 },
      [
        { label: "500 ml cam şişe", volumeMl: 500, packaging: "Cam şişe" },
        { label: "750 ml cam şişe", volumeMl: 750, packaging: "Cam şişe" },
        { label: "2 L teneke", volumeMl: 2000, packaging: "Teneke" },
        { label: "5 L teneke", volumeMl: 5000, packaging: "Teneke" },
      ],
    );
    add(
      { slug: "tadim-seti", name: "Tadım Seti", summary: "Yağlarımızı küçük şişelerde denemek ya da hediye etmek için.", sortOrder: 3 },
      [{ label: "Set", volumeMl: null, packaging: "Hediye kutusu" }],
    );
    tx.insert(settings).values({ key: SEEDED_FLAG, value: "1", updatedAt: now }).run();
  });
}
