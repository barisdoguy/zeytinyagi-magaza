import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getEnv } from "../env";
import { PaymentError, type PaymentProvider } from "./types";

const payloadSchema = z.object({
  eventId: z.string().min(1).max(100),
  orderNumber: z.string().min(1).max(40),
  outcome: z.enum(["paid", "failed"]),
  amountKurus: z.number().int().nonnegative().optional(),
});

export function signTestPayload(rawBody: string): string {
  return createHmac("sha256", getEnv().APP_SECRET).update(rawBody).digest("hex");
}

/**
 * Deneme sağlayıcısı: gerçek tahsilat YAPMAZ. Gerçek sağlayıcılarla aynı
 * yolu (imzalı bildirim → doğrulama → sipariş güncelleme) izler ki akış
 * uçtan uca denenebilsin. PAYMENTS_MODE=live iken kullanılamaz.
 */
export const testProvider: PaymentProvider = {
  id: "test",
  label: "Deneme ödemesi (gerçek tahsilat yok)",
  ackBody: "OK",
  missingConfig: () => [],
  async createCheckout() {
    return { kind: "test" };
  },
  parseNotification(rawBody, headers) {
    const given = headers.get("x-test-signature") ?? "";
    const expected = signTestPayload(rawBody);
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new PaymentError("İmza doğrulanamadı.", "invalid_signature");
    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      throw new PaymentError("Bildirim okunamadı.", "invalid_payload");
    }
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) throw new PaymentError("Bildirim okunamadı.", "invalid_payload");
    return parsed.data;
  },
};
