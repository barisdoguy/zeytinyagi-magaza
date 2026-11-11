import { describe, expect, it } from "vitest";
import { checkCoupon, normalizeCouponCode, type CouponRecord } from "@/lib/coupons";
import { formatTl, parseTlToKurus } from "@/lib/money";
import { canTransition, manualTransitions } from "@/lib/orders/status";
import { computeTotals } from "@/lib/pricing";
import { can } from "@/lib/auth/permissions";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { parseCartCookie } from "@/lib/cart-core";
import { paytrCallbackHash } from "@/lib/payments/paytr";
import { createHmac } from "node:crypto";

describe("para", () => {
  it("TL girişlerini kuruşa çevirir", () => {
    expect(parseTlToKurus("149,90")).toBe(14990);
    expect(parseTlToKurus("149.90")).toBe(14990);
    expect(parseTlToKurus("1.249,90")).toBe(124990);
    expect(parseTlToKurus("0")).toBe(0);
    expect(parseTlToKurus("")).toBeNull();
    expect(parseTlToKurus("-5")).toBeNull();
    expect(parseTlToKurus("abc")).toBeNull();
  });
  it("kuruşu TL olarak yazar", () => {
    expect(formatTl(124990)).toContain("1.249,90");
  });
});

describe("tutar hesabı", () => {
  const lines = [
    { unitPriceKurus: 40000, quantity: 2 },
    { unitPriceKurus: 15000, quantity: 1 },
  ];
  it("ara toplam, kargo ve genel toplamı hesaplar", () => {
    expect(computeTotals({ lines, shippingFeeKurus: 9000, freeShippingThresholdKurus: null })).toEqual({
      subtotalKurus: 95000,
      discountKurus: 0,
      shippingKurus: 9000,
      totalKurus: 104000,
    });
  });
  it("ücretsiz kargo sınırını indirimden sonraki tutara göre uygular", () => {
    const withCoupon = computeTotals({
      lines,
      shippingFeeKurus: 9000,
      freeShippingThresholdKurus: 90000,
      coupon: { type: "percent", value: 10 },
    });
    expect(withCoupon.discountKurus).toBe(9500);
    expect(withCoupon.shippingKurus).toBe(9000);
    expect(computeTotals({ lines, shippingFeeKurus: 9000, freeShippingThresholdKurus: 90000 }).shippingKurus).toBe(0);
  });
  it("indirim ara toplamı aşamaz", () => {
    const t = computeTotals({ lines, shippingFeeKurus: 0, freeShippingThresholdKurus: null, coupon: { type: "fixed", value: 999999 } });
    expect(t.discountKurus).toBe(95000);
    expect(t.totalKurus).toBe(0);
  });
});

describe("kupon geçerliliği", () => {
  const base: CouponRecord = {
    code: "HOSGELDIN",
    type: "percent",
    value: 10,
    minSubtotalKurus: 50000,
    startsAt: 1000,
    endsAt: 2000,
    maxUses: 2,
    usedCount: 0,
    active: true,
  };
  it("kodu büyük-küçük harf ve Türkçe harf farkına bakmadan eşleştirir", () => {
    for (const input of ["hosgeldin", "HOŞGELDİN", " Hosgeldın ", "hoş geldin"]) expect(normalizeCouponCode(input)).toBe("HOSGELDIN");
  });
  it("geçerli kuponu kabul eder", () => {
    const r = checkCoupon(base, 60000, 1500);
    expect(r.ok && r.discountKurus).toBe(6000);
  });
  it("pasif, süresi dışında, hakkı dolmuş ve alt sınırın altındaki kuponu reddeder", () => {
    expect(checkCoupon(null, 60000, 1500).ok).toBe(false);
    expect(checkCoupon({ ...base, active: false }, 60000, 1500).ok).toBe(false);
    expect(checkCoupon(base, 60000, 500).ok).toBe(false);
    expect(checkCoupon(base, 60000, 2500).ok).toBe(false);
    expect(checkCoupon({ ...base, usedCount: 2 }, 60000, 1500).ok).toBe(false);
    expect(checkCoupon(base, 40000, 1500).ok).toBe(false);
  });
});

describe("sipariş durumları", () => {
  it("yalnızca tanımlı geçişlere izin verir", () => {
    expect(canTransition("pending_payment", "paid")).toBe(true);
    expect(canTransition("pending_payment", "shipped")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
    expect(canTransition("delivered", "preparing")).toBe(false);
  });
  it("'ödendi' durumu panelden elle atanamaz", () => {
    expect(manualTransitions("pending_payment")).toEqual(["cancelled"]);
    expect(manualTransitions("paid")).toContain("preparing");
  });
});

describe("yetki ve parola", () => {
  it("personel ayar, kupon, kullanıcı ve kayıtlara erişemez", () => {
    for (const p of ["settings", "coupons", "users", "audit", "content"] as const) expect(can("staff", p)).toBe(false);
    for (const p of ["products", "orders"] as const) expect(can("staff", p)).toBe(true);
    expect(can("admin", "users")).toBe(true);
  });
  it("parolayı özetler ve doğrular", async () => {
    const hash = await hashPassword("dogru-parola-123");
    expect(hash).not.toContain("dogru-parola-123");
    expect(await verifyPassword("dogru-parola-123", hash)).toBe(true);
    expect(await verifyPassword("yanlis-parola-123", hash)).toBe(false);
  });
});

describe("sepet çerezi", () => {
  it("bozuk ya da kurcalanmış çerezi boş sepete çevirir", () => {
    expect(parseCartCookie("not-json")).toEqual([]);
    expect(parseCartCookie(JSON.stringify([{ v: 1, q: 9999 }]))).toEqual([]);
    expect(parseCartCookie(JSON.stringify([{ v: 1, q: 2, price: 1 }]))).toEqual([{ v: 1, q: 2 }]);
  });
});

describe("PayTR imzası", () => {
  it("bildirim özetini merchant_oid + salt + status + total_amount üzerinden üretir", () => {
    const expected = createHmac("sha256", "KEY").update("AO123" + "SALT" + "success" + "10400").digest("base64");
    expect(paytrCallbackHash({ merchantOid: "AO123", status: "success", totalAmount: "10400", salt: "SALT", key: "KEY" })).toBe(expected);
  });
});
