import { getDb, type Db, type Tx } from "../db/client";
import { settings } from "../db/schema";
import { parseTlToKurus } from "../money";
import { CONTENT_KEYS, FIELDS, isContentKey, type Content, type ContentKey } from "./definitions";

/** Tüm içerik/ayar değerleri: veritabanındaki değer, yoksa koddaki varsayılan. */
export function loadContent(db: Db | Tx = getDb()): Content {
  const out = {} as Content;
  for (const key of CONTENT_KEYS) out[key] = FIELDS[key].default;
  for (const row of db.select().from(settings).all()) {
    if (isContentKey(row.key)) out[row.key] = row.value;
  }
  return out;
}

export function saveContent(values: Partial<Record<ContentKey, string>>, db: Db | Tx = getDb()) {
  const now = Date.now();
  for (const [key, raw] of Object.entries(values)) {
    if (!isContentKey(key) || typeof raw !== "string") continue;
    const value = raw.replace(/\r\n/g, "\n").trim().slice(0, 5000);
    db.insert(settings)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now } })
      .run();
  }
}

export type ShippingConfig = {
  /** Kargo ücreti tanımlı mı? Tanımlı değilse sipariş alınmaz. */
  configured: boolean;
  feeKurus: number;
  freeThresholdKurus: number | null;
};

export function shippingConfig(content: Content): ShippingConfig {
  const fee = parseTlToKurus(content.shippingFeeTl);
  const threshold = parseTlToKurus(content.freeShippingThresholdTl);
  return { configured: fee != null, feeKurus: fee ?? 0, freeThresholdKurus: threshold };
}
