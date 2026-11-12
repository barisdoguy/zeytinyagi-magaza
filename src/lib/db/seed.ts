import { eq } from "drizzle-orm";
import type { Db } from "./client";
import { pages, products, settings, users, variants } from "./schema";
import { hashPasswordSync, passwordProblem } from "../auth/password";

/**
 * Kabuk erişimi olmayan barındırmalar için: hiç kullanıcı yoksa ve ADMIN_EMAIL
 * ile ADMIN_PASSWORD ortam değişkenleri tanımlıysa ilk yönetici hesabını açar.
 * Varsayılan parola yoktur; değişkenler yoksa hiçbir şey yapılmaz. Hesap
 * oluştuktan sonra bu değişkenleri kaldırın ve parolayı panelden değiştirin.
 */
function bootstrapAdmin(db: Db, now: number) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || !/^\S+@\S+\.\S+$/.test(email) || passwordProblem(password)) return;
  if (db.select({ id: users.id }).from(users).limit(1).get()) return;
  db.insert(users)
    .values({ email, name: "Yönetici", role: "admin", passwordHash: hashPasswordSync(password), createdAt: now })
    .run();
}
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

  bootstrapAdmin(db, now);

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
