import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { coupons, orders, products, variants, auditLog } from "@/lib/db/schema";
import { saveContent } from "@/lib/content/store";
import { adminSetStatus, applyPaymentEvent, createOrder, getOrderByNumber } from "@/lib/orders/service";
import { processNotification } from "@/lib/payments";
import { signTestPayload } from "@/lib/payments/test-provider";
import { buildCart } from "@/lib/cart-core";
import { createSession, getSessionUser, login } from "@/lib/auth/sessions";
import { hashPassword } from "@/lib/auth/password";
import { users } from "@/lib/db/schema";

const customer = {
  customerName: "Deneme Kişi",
  email: "deneme@example.com",
  phone: "05550000000",
  city: "Balıkesir",
  district: "Edremit",
  addressLine: "Deneme Mahallesi Deneme Sokak No 1",
  postalCode: "",
  note: "",
};

let variantId = 0;
const stockOf = () => getDb().select().from(variants).where(eq(variants.id, variantId)).get()!.stock;

beforeAll(() => {
  const db = getDb();
  const p = db.select().from(products).where(eq(products.slug, "zeytinyagi")).get()!;
  db.update(products).set({ status: "active" }).where(eq(products.id, p.id)).run();
  const v = db.select().from(variants).where(eq(variants.productId, p.id)).all()[0];
  variantId = v.id;
  db.update(variants).set({ priceKurus: 40000, stock: 10 }).where(eq(variants.id, v.id)).run();
  saveContent({ shippingFeeTl: "90", freeShippingThresholdTl: "" });
  db.insert(coupons).values({ code: "ON", type: "percent", value: 10, createdAt: Date.now() }).run();
});

function newOrder(couponCode: string | null = null, qty = 2) {
  const r = createOrder(getDb(), { items: [{ v: variantId, q: qty }], couponCode, customer, provider: "test", ip: "127.0.0.1" });
  if (!r.ok) throw new Error(r.message);
  return r.order;
}

describe("taslak ürünler", () => {
  it("fiyatı girilmemiş ya da yayında olmayan ürün sepete girmez", () => {
    const db = getDb();
    const draft = db.select().from(products).where(eq(products.slug, "tadim-seti")).get()!;
    const v = db.select().from(variants).where(eq(variants.productId, draft.id)).get()!;
    const cart = buildCart(db, [{ v: v.id, q: 1 }], null);
    expect(cart.lines).toHaveLength(0);
    expect(cart.removedCount).toBe(1);
  });
});

describe("sipariş oluşturma", () => {
  it("tutarları sunucuda hesaplar", () => {
    const order = newOrder("on");
    expect(order.subtotalKurus).toBe(80000);
    expect(order.discountKurus).toBe(8000);
    expect(order.shippingKurus).toBe(9000);
    expect(order.totalKurus).toBe(81000);
    expect(order.status).toBe("pending_payment");
  });
  it("stoktan fazla adet istenirse siparişi reddeder", () => {
    const r = createOrder(getDb(), { items: [{ v: variantId, q: 11 }], couponCode: null, customer, provider: "test", ip: "" });
    expect(r.ok).toBe(false);
  });
});

describe("ödeme bildirimi", () => {
  it("ödemeyi bir kez işler, yinelenen bildirimi yok sayar", () => {
    const db = getDb();
    const order = newOrder("ON");
    const before = stockOf();
    const event = { provider: "test", eventId: "evt-1", orderNumber: order.number, outcome: "paid" as const, amountKurus: order.totalKurus };
    expect(applyPaymentEvent(db, event)).toBe("applied");
    expect(applyPaymentEvent(db, event)).toBe("duplicate");
    expect(applyPaymentEvent(db, { ...event, eventId: "evt-1b" })).toBe("ignored");
    expect(stockOf()).toBe(before - 2);
    expect(getOrderByNumber(order.number)!.status).toBe("paid");
    expect(db.select().from(coupons).where(eq(coupons.code, "ON")).get()!.usedCount).toBe(1);
  });
  it("tutar uyuşmazsa siparişi ödenmiş saymaz ve kayıt düşer", () => {
    const db = getDb();
    const order = newOrder();
    expect(applyPaymentEvent(db, { provider: "test", eventId: "evt-2", orderNumber: order.number, outcome: "paid", amountKurus: 1 })).toBe("amount_mismatch");
    expect(getOrderByNumber(order.number)!.status).toBe("pending_payment");
    expect(db.select().from(auditLog).where(eq(auditLog.action, "payment.amount_mismatch")).all().length).toBe(1);
  });
  it("başarısız ödemeden sonra gelen başarılı bildirimi kabul eder", () => {
    const db = getDb();
    const order = newOrder();
    expect(applyPaymentEvent(db, { provider: "test", eventId: "evt-3", orderNumber: order.number, outcome: "failed" })).toBe("applied");
    expect(getOrderByNumber(order.number)!.status).toBe("payment_failed");
    expect(applyPaymentEvent(db, { provider: "test", eventId: "evt-4", orderNumber: order.number, outcome: "paid", amountKurus: order.totalKurus })).toBe("applied");
  });
  it("imzasız ya da yanlış imzalı bildirimi reddeder", () => {
    const order = newOrder();
    const body = JSON.stringify({ eventId: "evt-5", orderNumber: order.number, outcome: "paid", amountKurus: order.totalKurus });
    expect(processNotification("test", body, new Headers()).status).toBe(401);
    expect(processNotification("test", body, new Headers({ "x-test-signature": "0".repeat(64) })).status).toBe(401);
    expect(getOrderByNumber(order.number)!.status).toBe("pending_payment");
    const ok = processNotification("test", body, new Headers({ "x-test-signature": signTestPayload(body) }));
    expect(ok.status).toBe(200);
    expect(ok.result).toBe("applied");
    expect(processNotification("paytr", body, new Headers()).status).toBe(404);
  });
});

describe("panelden durum güncelleme", () => {
  it("izinli geçişleri uygular, iptalde stoğu geri ekler", () => {
    const db = getDb();
    const order = newOrder(null, 1);
    const actor = { id: 1, email: "yonetici@example.com" };
    expect(adminSetStatus(db, order.id, "paid", actor).ok).toBe(false);
    expect(adminSetStatus(db, order.id, "shipped", actor).ok).toBe(false);
    applyPaymentEvent(db, { provider: "test", eventId: "evt-6", orderNumber: order.number, outcome: "paid", amountKurus: order.totalKurus });
    const afterPaid = stockOf();
    expect(adminSetStatus(db, order.id, "preparing", actor).ok).toBe(true);
    expect(adminSetStatus(db, order.id, "cancelled", actor).ok).toBe(true);
    expect(stockOf()).toBe(afterPaid + 1);
    expect(adminSetStatus(db, order.id, "preparing", actor).ok).toBe(false);
    expect(db.select().from(orders).where(eq(orders.id, order.id)).get()!.stockCommitted).toBe(false);
  });
});

describe("oturum", () => {
  it("giriş yapar, yanlış parolayı reddeder ve deneme sınırını uygular", async () => {
    const db = getDb();
    db.insert(users).values({ email: "a@example.com", name: "A", passwordHash: await hashPassword("cok-gizli-parola"), role: "staff", createdAt: Date.now() }).run();
    const ok = await login("A@example.com", "cok-gizli-parola", "1.1.1.1");
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(getSessionUser(ok.token)?.role).toBe("staff");
    for (let i = 0; i < 5; i++) expect((await login("a@example.com", "yanlis", "2.2.2.2")).ok).toBe(false);
    const locked = await login("a@example.com", "cok-gizli-parola", "2.2.2.2");
    expect(locked.ok === false && locked.reason).toBe("locked");
  });
  it("süresi dolmuş ya da bilinmeyen belirteci kabul etmez", () => {
    const u = getDb().select().from(users).get()!;
    const token = createSession(u.id, Date.now() - 13 * 60 * 60 * 1000);
    expect(getSessionUser(token)).toBeNull();
    expect(getSessionUser("uydurma")).toBeNull();
    expect(getSessionUser(undefined)).toBeNull();
  });
});
