"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addItem, buildCart, setQuantity } from "@/lib/cart-core";
import { readCartItems, readCouponCode, writeCartItems, writeCouponCode } from "@/lib/cart";
import { normalizeCouponCode } from "@/lib/coupons";
import { getDb } from "@/lib/db/client";
import { contactMessages } from "@/lib/db/schema";
import { fail, ok, str, type FormState } from "@/lib/form";
import { findOrderForCustomer } from "@/lib/orders/access";
import { createOrder, customerSchema } from "@/lib/orders/service";
import { getPaymentState, processNotification } from "@/lib/payments";
import { signTestPayload } from "@/lib/payments/test-provider";
import { clientIp } from "@/lib/request";

const toInt = (value: string) => (/^\d{1,9}$/.test(value) ? Number(value) : NaN);

export async function addToCart(_prev: FormState, formData: FormData): Promise<FormState> {
  const variantId = toInt(str(formData, "variantId"));
  const quantity = toInt(str(formData, "quantity") || "1");
  if (!Number.isInteger(variantId) || !Number.isInteger(quantity) || quantity < 1)
    return fail("Lütfen bir seçenek ve adet belirleyin.", formData);

  const db = getDb();
  const items = addItem(await readCartItems(), variantId, quantity);
  const cart = buildCart(db, items, null);
  const line = cart.lines.find((l) => l.variantId === variantId);
  if (!line) return fail("Bu ürün şu anda satın alınamıyor.", formData);

  await writeCartItems(cart.items);
  revalidatePath("/", "layout");
  const wanted = items.find((i) => i.v === variantId)?.q ?? quantity;
  if (line.quantity < wanted) return ok(`Stokta ${line.stock} adet var; sepetinizde ${line.quantity} adet oldu.`);
  return ok("Sepetinize eklendi.");
}

export async function updateCartLine(formData: FormData) {
  const variantId = toInt(str(formData, "variantId"));
  const quantity = toInt(str(formData, "quantity"));
  if (!Number.isInteger(variantId) || !Number.isInteger(quantity)) return;
  const cart = buildCart(getDb(), setQuantity(await readCartItems(), variantId, quantity), null);
  await writeCartItems(cart.items);
  revalidatePath("/", "layout");
}

export async function applyCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = normalizeCouponCode(str(formData, "code"));
  if (!code) return fail("Kupon kodunu yazın.", formData);
  const cart = buildCart(getDb(), await readCartItems(), code);
  if (cart.lines.length === 0) return fail("Kupon uygulamak için sepetinize ürün ekleyin.", formData);
  if (!cart.coupon) return fail(cart.couponError ?? "Bu kupon kodu geçerli değil.", formData);
  await writeCouponCode(code);
  revalidatePath("/sepet");
  return ok("Kupon uygulandı.");
}

export async function removeCoupon() {
  await writeCouponCode(null);
  revalidatePath("/sepet");
}

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const payment = getPaymentState();
  if (!payment.available || !payment.provider)
    return fail("Çevrimiçi ödeme henüz açılmadığı için sipariş oluşturulamıyor.", formData);

  const parsed = customerSchema.safeParse({
    customerName: str(formData, "customerName"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    city: str(formData, "city"),
    district: str(formData, "district"),
    addressLine: str(formData, "addressLine"),
    postalCode: str(formData, "postalCode"),
    note: str(formData, "note"),
  });
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
  }
  if (formData.get("agreeContract") !== "on")
    fieldErrors.agreeContract = "Devam etmek için ön bilgilendirme formunu ve mesafeli satış sözleşmesini onaylamanız gerekir.";
  if (formData.get("agreePrivacy") !== "on")
    fieldErrors.agreePrivacy = "Devam etmek için aydınlatma metnini okuduğunuzu belirtmeniz gerekir.";
  if (!parsed.success || Object.keys(fieldErrors).length > 0)
    return fail("Lütfen işaretli alanları kontrol edin.", formData, fieldErrors);

  const couponCode = await readCouponCode();
  const result = createOrder(getDb(), {
    items: await readCartItems(),
    couponCode,
    customer: parsed.data,
    provider: payment.provider.id,
    ip: await clientIp(),
  });
  if (!result.ok) return fail(result.message, formData);
  redirect(`/odeme/${result.order.number}?t=${result.order.accessToken}`);
}

/**
 * Deneme sağlayıcısı: gerçek tahsilat yapmadan, imzalı bir bildirim üretip
 * gerçek sağlayıcılarla aynı işleme yolundan geçirir.
 */
export async function simulateTestPayment(formData: FormData) {
  const payment = getPaymentState();
  if (!payment.available || payment.provider?.id !== "test") redirect("/sepet");
  const number = str(formData, "number");
  const token = str(formData, "token");
  const outcome = str(formData, "outcome") === "paid" ? "paid" : "failed";
  const order = findOrderForCustomer(number, token);
  if (!order) redirect("/sepet");

  const body = JSON.stringify({ eventId: randomUUID(), orderNumber: order.number, outcome, amountKurus: order.totalKurus });
  processNotification("test", body, new Headers({ "x-test-signature": signTestPayload(body) }));
  if (outcome === "paid") redirect(`/siparis/${order.number}?t=${order.accessToken}`);
  redirect(`/odeme/${order.number}?t=${order.accessToken}&durum=basarisiz`);
}

/** Ödeme tamamlandıktan sonra sepeti ve kuponu temizler. */
export async function clearCartAfterPayment(number: string, token: string) {
  const order = findOrderForCustomer(number, token);
  if (!order || order.status === "pending_payment" || order.status === "payment_failed") return;
  await writeCartItems([]);
  await writeCouponCode(null);
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Adınızı yazın.").max(120),
  email: z.string().trim().email("Geçerli bir e-posta adresi girin.").max(200),
  message: z.string().trim().min(10, "Mesajınız en az 10 karakter olmalı.").max(3000),
});

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  // Botlar için görünmez alan: doluysa sessizce yok say.
  if (str(formData, "website")) return ok("Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.");
  const parsed = contactSchema.safeParse({ name: str(formData, "name"), email: str(formData, "email"), message: str(formData, "message") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return fail("Lütfen işaretli alanları kontrol edin.", formData, fieldErrors);
  }
  if (formData.get("privacy") !== "on")
    return fail("Lütfen işaretli alanları kontrol edin.", formData, { privacy: "Mesaj gönderebilmek için aydınlatma metnini okuduğunuzu belirtin." });

  const db = getDb();
  const since = Date.now() - 10 * 60 * 1000;
  const recent = db.select({ id: contactMessages.id, createdAt: contactMessages.createdAt }).from(contactMessages).where(eq(contactMessages.email, parsed.data.email)).all();
  if (recent.filter((m) => m.createdAt > since).length >= 3)
    return fail("Kısa sürede çok fazla mesaj gönderdiniz. Lütfen biraz sonra yeniden deneyin.", formData);
  db.insert(contactMessages).values({ ...parsed.data, createdAt: Date.now() }).run();
  return ok("Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.");
}

