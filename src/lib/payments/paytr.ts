import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "../env";
import { PaymentError, type PaymentProvider } from "./types";

/**
 * PayTR iFrame API adaptörü.
 *
 * DİKKAT: Bu adaptör PayTR'nin iFrame API akışına göre yazıldı ancak gerçek bir
 * mağaza hesabıyla DENENMEDİ ve yazım sırasında resmî belgeye (dev.paytr.com)
 * erişilemedi. Canlıya almadan önce alan adlarını ve imza sırasını resmî
 * belgeyle karşılaştırın, PayTR test modunda uçtan uca deneyin (README).
 */
const TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";
const IFRAME_BASE = "https://www.paytr.com/odeme/guvenli/";

function creds() {
  const env = getEnv();
  return { id: env.PAYTR_MERCHANT_ID, key: env.PAYTR_MERCHANT_KEY, salt: env.PAYTR_MERCHANT_SALT };
}

const hmacBase64 = (key: string, data: string) => createHmac("sha256", key).update(data).digest("base64");

export function paytrToken(parts: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;
  userBasket: string;
  noInstallment: string;
  maxInstallment: string;
  currency: string;
  testMode: string;
  salt: string;
  key: string;
}): string {
  const hashStr =
    parts.merchantId +
    parts.userIp +
    parts.merchantOid +
    parts.email +
    parts.paymentAmount +
    parts.userBasket +
    parts.noInstallment +
    parts.maxInstallment +
    parts.currency +
    parts.testMode;
  return hmacBase64(parts.key, hashStr + parts.salt);
}

export function paytrCallbackHash(p: { merchantOid: string; status: string; totalAmount: string; salt: string; key: string }) {
  return hmacBase64(p.key, p.merchantOid + p.salt + p.status + p.totalAmount);
}

export const paytrProvider: PaymentProvider = {
  id: "paytr",
  label: "PayTR",
  ackBody: "OK",
  missingConfig() {
    const c = creds();
    const missing: string[] = [];
    if (!c.id) missing.push("PAYTR_MERCHANT_ID");
    if (!c.key) missing.push("PAYTR_MERCHANT_KEY");
    if (!c.salt) missing.push("PAYTR_MERCHANT_SALT");
    return missing;
  },
  async createCheckout(order, items, ctx) {
    const c = creds();
    if (!c.id || !c.key || !c.salt) throw new PaymentError("PayTR yapılandırılmadı.", "not_configured");

    const basket = items.map((i) => [`${i.productName} ${i.variantLabel}`, (i.unitPriceKurus / 100).toFixed(2), i.quantity]);
    if (order.shippingKurus > 0) basket.push(["Kargo", (order.shippingKurus / 100).toFixed(2), 1]);
    const userBasket = Buffer.from(JSON.stringify(basket)).toString("base64");
    const testMode = ctx.testMode ? "1" : "0";
    const noInstallment = "1";
    const maxInstallment = "0";
    const currency = "TL";

    const body = new URLSearchParams({
      merchant_id: c.id,
      user_ip: ctx.ip,
      merchant_oid: order.number,
      email: order.email,
      payment_amount: String(order.totalKurus),
      paytr_token: paytrToken({
        merchantId: c.id,
        userIp: ctx.ip,
        merchantOid: order.number,
        email: order.email,
        paymentAmount: order.totalKurus,
        userBasket,
        noInstallment,
        maxInstallment,
        currency,
        testMode,
        salt: c.salt,
        key: c.key,
      }),
      user_basket: userBasket,
      debug_on: ctx.testMode ? "1" : "0",
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: order.customerName,
      user_address: `${order.addressLine} ${order.district}/${order.city}`,
      user_phone: order.phone,
      merchant_ok_url: ctx.okUrl,
      merchant_fail_url: ctx.failUrl,
      timeout_limit: "30",
      currency,
      test_mode: testMode,
      lang: "tr",
    });

    let json: { status?: string; token?: string; reason?: string };
    try {
      const res = await fetch(TOKEN_URL, { method: "POST", body, signal: AbortSignal.timeout(20_000) });
      json = (await res.json()) as typeof json;
    } catch {
      throw new PaymentError("PayTR'ye ulaşılamadı.", "provider_error");
    }
    if (json.status !== "success" || !json.token)
      throw new PaymentError(`PayTR ödeme oturumu açılamadı: ${json.reason ?? "bilinmeyen hata"}`, "provider_error");
    return { kind: "iframe", url: IFRAME_BASE + encodeURIComponent(json.token) };
  },
  parseNotification(rawBody) {
    const c = creds();
    if (!c.key || !c.salt) throw new PaymentError("PayTR yapılandırılmadı.", "not_configured");
    const form = new URLSearchParams(rawBody);
    const merchantOid = form.get("merchant_oid") ?? "";
    const status = form.get("status") ?? "";
    const totalAmount = form.get("total_amount") ?? "";
    const hash = form.get("hash") ?? "";
    if (!merchantOid || !status || !hash) throw new PaymentError("Bildirim okunamadı.", "invalid_payload");

    const expected = Buffer.from(paytrCallbackHash({ merchantOid, status, totalAmount, salt: c.salt, key: c.key }));
    const given = Buffer.from(hash);
    if (expected.length !== given.length || !timingSafeEqual(expected, given))
      throw new PaymentError("İmza doğrulanamadı.", "invalid_signature");

    // Taksit kapalı olduğundan (no_installment=1) ödenen tutar sipariş tutarına eşit olmalıdır.
    const paymentAmount = form.get("payment_amount") ?? totalAmount;
    const amountKurus = /^\d+$/.test(paymentAmount) ? Number(paymentAmount) : undefined;
    const outcome = status === "success" ? "paid" : "failed";
    return { eventId: `${merchantOid}:${outcome}`, orderNumber: merchantOid, outcome, amountKurus };
  },
};
