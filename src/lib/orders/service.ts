import { randomBytes, randomInt } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { recordAudit, type AuditActor } from "../audit";
import { buildCart, type CartItem } from "../cart-core";
import { getDb, type Db, type Tx } from "../db/client";
import { coupons, orderItems, orders, paymentEvents, variants, type Order, type OrderItem } from "../db/schema";
import { canTransition, isOrderStatus, manualTransitions, type OrderStatus } from "./status";

export const customerSchema = z.object({
  customerName: z.string().trim().min(3, "Ad soyad en az 3 karakter olmalı.").max(120),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi girin.").max(200),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^(\+90|0)?5\d{9}$/, "Cep telefonu numaranızı 05XX XXX XX XX biçiminde girin.")),
  city: z.string().trim().min(2, "İl girin.").max(60),
  district: z.string().trim().min(2, "İlçe girin.").max(60),
  addressLine: z.string().trim().min(10, "Açık adresinizi mahalle, sokak ve kapı numarasıyla yazın.").max(400),
  postalCode: z.string().trim().max(10).default(""),
  note: z.string().trim().max(500).default(""),
});
export type CustomerInput = z.infer<typeof customerSchema>;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Yalnızca harf ve rakamdan oluşur (ödeme sağlayıcılarının sipariş kimliği kuralına uygun). */
export function generateOrderNumber(): string {
  let out = "AO";
  for (let i = 0; i < 10; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export type CreateOrderResult = { ok: true; order: Order } | { ok: false; message: string };

export function createOrder(
  db: Db,
  input: {
    items: CartItem[];
    couponCode: string | null;
    customer: CustomerInput;
    provider: string;
    ip: string;
  },
): CreateOrderResult {
  return db.transaction((tx): CreateOrderResult => {
    const cart = buildCart(tx, input.items, input.couponCode);
    if (cart.lines.length === 0) return { ok: false, message: "Sepetiniz boş." };
    if (cart.removedCount > 0 || cart.quantityAdjusted)
      return {
        ok: false,
        message: "Sepetinizdeki bazı ürünlerin stok durumu değişti. Lütfen sepetinizi kontrol edip yeniden deneyin.",
      };
    if (!cart.shippingConfigured)
      return { ok: false, message: "Kargo ücreti henüz tanımlanmadığı için sipariş alınamıyor." };
    if (input.couponCode && cart.couponError) return { ok: false, message: cart.couponError };

    const now = Date.now();
    const order = tx
      .insert(orders)
      .values({
        number: generateOrderNumber(),
        accessToken: randomBytes(24).toString("base64url"),
        status: "pending_payment",
        ...input.customer,
        subtotalKurus: cart.totals.subtotalKurus,
        discountKurus: cart.totals.discountKurus,
        shippingKurus: cart.totals.shippingKurus,
        totalKurus: cart.totals.totalKurus,
        couponCode: cart.coupon?.code ?? null,
        paymentProvider: input.provider,
        customerIp: input.ip,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    for (const line of cart.lines) {
      tx.insert(orderItems)
        .values({
          orderId: order.id,
          variantId: line.variantId,
          productName: line.productName,
          variantLabel: line.variantLabel,
          unitPriceKurus: line.unitPriceKurus,
          quantity: line.quantity,
          lineTotalKurus: line.lineTotalKurus,
        })
        .run();
    }
    return { ok: true, order };
  });
}

export function getOrderByNumber(number: string, db: Db | Tx = getDb()): Order | null {
  return db.select().from(orders).where(eq(orders.number, number)).get() ?? null;
}

export function getOrderItems(orderId: number, db: Db | Tx = getDb()): OrderItem[] {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();
}

export function listOrders(limit = 200, db: Db | Tx = getDb()): Order[] {
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).all();
}

function setStatus(tx: Tx, order: Order, to: OrderStatus, extra: Partial<Order> = {}) {
  tx.update(orders)
    .set({ status: to, updatedAt: Date.now(), ...extra })
    .where(eq(orders.id, order.id))
    .run();
}

function adjustStock(tx: Tx, orderId: number, direction: 1 | -1) {
  for (const item of getOrderItems(orderId, tx)) {
    if (item.variantId == null) continue;
    tx.update(variants)
      .set({ stock: sql`max(${variants.stock} + ${direction * item.quantity}, 0)` })
      .where(eq(variants.id, item.variantId))
      .run();
  }
}

export type PaymentNotification = {
  provider: string;
  /** Sağlayıcının olay kimliği; aynı kimlik ikinci kez işlenmez. */
  eventId: string;
  orderNumber: string;
  outcome: "paid" | "failed";
  amountKurus?: number;
  reference?: string;
};

export type PaymentEventResult = "applied" | "duplicate" | "ignored" | "amount_mismatch" | "unknown_order";

/**
 * Ödeme bildirimini tek bir transaction içinde işler:
 * olay kaydı (tekil), sipariş durumu, stok ve kupon sayacı birlikte güncellenir.
 */
export function applyPaymentEvent(db: Db, event: PaymentNotification): PaymentEventResult {
  return db.transaction((tx): PaymentEventResult => {
    const now = Date.now();
    const inserted = tx
      .insert(paymentEvents)
      .values({
        provider: event.provider,
        eventId: event.eventId,
        orderNumber: event.orderNumber,
        outcome: event.outcome,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: paymentEvents.id })
      .get();
    if (!inserted) return "duplicate";

    const finish = (result: PaymentEventResult) => {
      tx.update(paymentEvents).set({ result }).where(eq(paymentEvents.id, inserted.id)).run();
      return result;
    };

    const order = getOrderByNumber(event.orderNumber, tx);
    if (!order || order.paymentProvider !== event.provider || !isOrderStatus(order.status)) {
      recordAudit(null, "payment.unknown_order", "order", event.orderNumber, event.provider, tx);
      return finish("unknown_order");
    }

    if (event.outcome === "failed") {
      if (order.status !== "pending_payment") return finish("ignored");
      setStatus(tx, order, "payment_failed");
      return finish("applied");
    }

    if (event.amountKurus != null && event.amountKurus !== order.totalKurus) {
      recordAudit(
        null,
        "payment.amount_mismatch",
        "order",
        order.number,
        `beklenen ${order.totalKurus}, bildirilen ${event.amountKurus}`,
        tx,
      );
      return finish("amount_mismatch");
    }
    if (!canTransition(order.status, "paid")) return finish("ignored");

    setStatus(tx, order, "paid", {
      paidAt: now,
      paymentRef: event.reference ?? null,
      stockCommitted: true,
    });
    adjustStock(tx, order.id, -1);
    if (order.couponCode) {
      tx.update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.code, order.couponCode))
        .run();
    }
    recordAudit(null, "payment.paid", "order", order.number, event.provider, tx);
    return finish("applied");
  });
}

export type AdminStatusResult = { ok: true } | { ok: false; message: string };

/** Panelden durum değişikliği: yalnızca izin verilen geçişler; iptal/iadede stok geri eklenir. */
export function adminSetStatus(
  db: Db,
  orderId: number,
  to: string,
  actor: AuditActor,
  shipment?: { carrier: string; trackingNumber: string },
): AdminStatusResult {
  return db.transaction((tx): AdminStatusResult => {
    const order = tx.select().from(orders).where(eq(orders.id, orderId)).get();
    if (!order || !isOrderStatus(order.status)) return { ok: false, message: "Sipariş bulunamadı." };
    if (!isOrderStatus(to) || !manualTransitions(order.status).includes(to))
      return { ok: false, message: "Bu durum değişikliğine izin verilmiyor." };

    const extra: Partial<Order> = {};
    if (to === "shipped" && shipment) {
      extra.carrier = shipment.carrier.trim().slice(0, 80);
      extra.trackingNumber = shipment.trackingNumber.trim().slice(0, 80);
    }
    if ((to === "cancelled" || to === "refunded") && order.stockCommitted) {
      adjustStock(tx, order.id, 1);
      extra.stockCommitted = false;
    }
    setStatus(tx, order, to, extra);
    recordAudit(actor, "order.status", "order", order.number, `${order.status} → ${to}`, tx);
    return { ok: true };
  });
}
