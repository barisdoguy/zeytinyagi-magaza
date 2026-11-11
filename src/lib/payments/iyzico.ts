import { PaymentError, type PaymentProvider } from "./types";

/**
 * iyzico Checkout Form adaptörü — İSKELET.
 *
 * Henüz yazılmadı; seçildiğinde site çevrimiçi ödemeyi "kapalı" gösterir.
 * Bağlamak için yapılacaklar README'nin "Sanal POS" bölümünde listelidir:
 *  1. Checkout Form oturumu açma (createCheckout → { kind: "redirect", url: paymentPageUrl })
 *  2. Geri çağrıda gelen token ile ödeme sonucunu iyzico'dan sorgulama
 *  3. Bildirim imzasının doğrulanması (parseNotification)
 */
export const iyzicoProvider: PaymentProvider = {
  id: "iyzico",
  label: "iyzico",
  ackBody: "OK",
  missingConfig: () => ["iyzico adaptörü henüz yazılmadı (src/lib/payments/iyzico.ts)"],
  async createCheckout() {
    throw new PaymentError("iyzico adaptörü henüz yazılmadı.", "not_configured");
  },
  parseNotification() {
    throw new PaymentError("iyzico adaptörü henüz yazılmadı.", "not_configured");
  },
};
