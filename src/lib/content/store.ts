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

/** Fotoğraf yuvaları: gerçek fotoğraf yüklenene kadar sitede illüstrasyon gösterilir. */
export const IMAGE_SLOTS = {
  yore: { label: "Yöre / zeytinlik fotoğrafı", hint: "Ana sayfadaki yöre bölümü" },
  sofra: { label: "Sofra fotoğrafı", hint: "Ana sayfadaki sofra bölümü" },
  hikaye: { label: "Üretici / üretim fotoğrafı", hint: "Hikâyemiz sayfası" },
} as const;
export type ImageSlot = keyof typeof IMAGE_SLOTS;

const slotKey = (slot: ImageSlot) => `__img_${slot}`;

export function getSlotImages(db: Db | Tx = getDb()): Record<ImageSlot, string | null> {
  const out: Record<ImageSlot, string | null> = { yore: null, sofra: null, hikaye: null };
  for (const row of db.select().from(settings).all()) {
    for (const slot of Object.keys(out) as ImageSlot[]) {
      if (row.key === slotKey(slot) && row.value) out[slot] = row.value;
    }
  }
  return out;
}

export function setSlotImage(slot: ImageSlot, file: string, db: Db | Tx = getDb()) {
  const now = Date.now();
  db.insert(settings)
    .values({ key: slotKey(slot), value: file, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: file, updatedAt: now } })
    .run();
}
