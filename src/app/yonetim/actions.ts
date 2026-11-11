"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAudit } from "@/lib/audit";
import { authorize, clearSessionCookie, NOT_ALLOWED, sessionToken, setSessionCookie } from "@/lib/auth/guard";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { destroySession, destroyUserSessions, login } from "@/lib/auth/sessions";
import { slugify } from "@/lib/catalog";
import { fieldsInGroup, GROUP_LABELS, type ContentKey, type FieldGroup } from "@/lib/content/definitions";
import { IMAGE_SLOTS, getSlotImages, saveContent, setSlotImage, type ImageSlot } from "@/lib/content/store";
import { normalizeCouponCode } from "@/lib/coupons";
import { parseDateInput } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { contactMessages, coupons, pages, products, users, variants } from "@/lib/db/schema";
import { fail, ok, str, type FormState } from "@/lib/form";
import { deleteImage, saveImage } from "@/lib/media";
import { parseTlToKurus } from "@/lib/money";
import { adminSetStatus } from "@/lib/orders/service";
import { clientIp } from "@/lib/request";

const int = (value: string) => (/^\d{1,9}$/.test(value) ? Number(value) : NaN);
const refreshSite = () => revalidatePath("/", "layout");

// ── Oturum ──────────────────────────────────────────────────────────────

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email");
  const password = String(formData.get("parola") ?? "");
  if (!email || !password) return fail("E-posta ve parolanızı girin.", formData);
  const result = await login(email, password, await clientIp());
  if (!result.ok) {
    recordAudit(null, "auth.login_failed", "user", "", email.slice(0, 120));
    return fail(
      result.reason === "locked"
        ? "Çok fazla hatalı deneme yapıldı. Lütfen 15 dakika sonra yeniden deneyin."
        : "E-posta ya da parola hatalı.",
      formData,
    );
  }
  await setSessionCookie(result.token);
  recordAudit(result.user, "auth.login", "user", result.user.id);
  redirect("/yonetim");
}

export async function logoutAction() {
  destroySession(await sessionToken());
  await clearSessionCookie();
  redirect("/yonetim/giris");
}

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("orders");
  if (!user) return fail(NOT_ALLOWED);
  const current = String(formData.get("mevcutParola") ?? "");
  const next = String(formData.get("yeniParola") ?? "");
  const db = getDb();
  const row = db.select().from(users).where(eq(users.id, user.id)).get();
  if (!row || !(await verifyPassword(current, row.passwordHash))) return fail("Mevcut parolanız hatalı.");
  const problem = passwordProblem(next);
  if (problem) return fail(problem);
  db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id)).run();
  recordAudit(user, "user.password_changed", "user", user.id);
  return ok("Parolanız güncellendi.");
}

// ── Ürünler ─────────────────────────────────────────────────────────────

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("products");
  if (!user) return fail(NOT_ALLOWED, formData);
  const db = getDb();
  const idRaw = str(formData, "id");
  const id = idRaw ? int(idRaw) : null;
  const name = str(formData, "name");
  const slug = slugify(str(formData, "slug") || name);
  const status = str(formData, "status");
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Ürün adını yazın.";
  if (!slug) errors.slug = "Bağlantı adı yalnızca harf, rakam ve tire içerebilir.";
  if (!["draft", "active", "archived"].includes(status)) errors.status = "Durum seçin.";
  if (id !== null && Number.isNaN(id)) return fail("Ürün bulunamadı.", formData);
  if (slug && db.select({ id: products.id }).from(products).where(id ? and(eq(products.slug, slug), ne(products.id, id)) : eq(products.slug, slug)).get())
    errors.slug = "Bu bağlantı adı başka bir üründe kullanılıyor.";
  if (Object.keys(errors).length) return fail("Lütfen işaretli alanları kontrol edin.", formData, errors);

  const existing = id ? db.select().from(products).where(eq(products.id, id)).get() : null;
  if (id && !existing) return fail("Ürün bulunamadı.", formData);

  let imageFile = existing?.imageFile ?? null;
  const upload = formData.get("image");
  if (upload instanceof File && upload.size > 0) {
    const saved = await saveImage(upload, `urun-${slug}`);
    if (!saved.ok) return fail(saved.message, formData, { image: saved.message });
    await deleteImage(imageFile);
    imageFile = saved.file;
  } else if (formData.get("removeImage") === "on") {
    await deleteImage(imageFile);
    imageFile = null;
  }

  const now = Date.now();
  const values = {
    name: name.slice(0, 120),
    slug,
    summary: str(formData, "summary").slice(0, 300),
    description: str(formData, "description").slice(0, 5000),
    features: str(formData, "features").slice(0, 3000),
    imageAlt: str(formData, "imageAlt").slice(0, 200),
    imageFile,
    status: status as "draft" | "active" | "archived",
    sortOrder: int(str(formData, "sortOrder") || "0") || 0,
    updatedAt: now,
  };
  refreshSite();
  if (existing) {
    db.update(products).set(values).where(eq(products.id, existing.id)).run();
    recordAudit(user, "product.update", "product", existing.id, `${values.name} · ${existing.status} → ${values.status}`);
    return ok("Ürün kaydedildi.");
  }
  const created = db.insert(products).values({ ...values, createdAt: now }).returning({ id: products.id }).get();
  recordAudit(user, "product.create", "product", created.id, values.name);
  redirect(`/yonetim/urunler/${created.id}?yeni=1`);
}

export async function deleteProduct(formData: FormData) {
  // Silme yalnızca yöneticiye açıktır; personel ürünü arşivleyebilir.
  const user = await authorize("settings");
  if (!user) return;
  const id = int(str(formData, "id"));
  const db = getDb();
  const row = Number.isNaN(id) ? null : db.select().from(products).where(eq(products.id, id)).get();
  if (!row) return;
  await deleteImage(row.imageFile);
  db.delete(products).where(eq(products.id, row.id)).run();
  recordAudit(user, "product.delete", "product", row.id, row.name);
  refreshSite();
  redirect("/yonetim/urunler");
}

export async function saveVariant(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("products");
  if (!user) return fail(NOT_ALLOWED, formData);
  const db = getDb();
  const productId = int(str(formData, "productId"));
  const idRaw = str(formData, "id");
  const id = idRaw ? int(idRaw) : null;
  const label = str(formData, "label");
  const priceRaw = str(formData, "priceTl");
  const price = priceRaw === "" ? null : parseTlToKurus(priceRaw);
  const stock = int(str(formData, "stock") || "0");
  const volumeRaw = str(formData, "volumeMl");
  const volume = volumeRaw === "" ? null : int(volumeRaw);

  const errors: Record<string, string> = {};
  if (label.length < 1) errors.label = "Seçenek adını yazın (ör. 500 ml cam şişe).";
  if (priceRaw !== "" && (price == null || price <= 0)) errors.priceTl = "Fiyatı 149,90 biçiminde yazın.";
  if (Number.isNaN(stock)) errors.stock = "Stok sıfır ya da pozitif bir tam sayı olmalı.";
  if (volume !== null && Number.isNaN(volume)) errors.volumeMl = "Hacmi mililitre cinsinden tam sayı olarak yazın.";
  if (Number.isNaN(productId) || !db.select({ id: products.id }).from(products).where(eq(products.id, productId)).get())
    return fail("Ürün bulunamadı.", formData);
  if (Object.keys(errors).length) return fail("Lütfen işaretli alanları kontrol edin.", formData, errors);

  const values = {
    label: label.slice(0, 80),
    volumeMl: volume,
    packaging: str(formData, "packaging").slice(0, 60),
    sku: str(formData, "sku").slice(0, 60),
    priceKurus: price,
    stock,
    active: formData.get("active") === "on",
    sortOrder: int(str(formData, "sortOrder") || "0") || 0,
  };
  if (id) {
    const before = db.select().from(variants).where(and(eq(variants.id, id), eq(variants.productId, productId))).get();
    if (!before) return fail("Seçenek bulunamadı.", formData);
    db.update(variants).set(values).where(eq(variants.id, id)).run();
    recordAudit(user, "variant.update", "variant", id, `${values.label} · fiyat ${before.priceKurus ?? "-"} → ${values.priceKurus ?? "-"} kuruş · stok ${before.stock} → ${values.stock}`);
  } else {
    const created = db.insert(variants).values({ ...values, productId }).returning({ id: variants.id }).get();
    recordAudit(user, "variant.create", "variant", created.id, values.label);
  }
  refreshSite();
  return ok("Seçenek kaydedildi.");
}

export async function deleteVariant(formData: FormData) {
  const user = await authorize("products");
  if (!user) return;
  const id = int(str(formData, "id"));
  if (Number.isNaN(id)) return;
  const db = getDb();
  const row = db.select().from(variants).where(eq(variants.id, id)).get();
  if (!row) return;
  db.delete(variants).where(eq(variants.id, id)).run();
  recordAudit(user, "variant.delete", "variant", id, row.label);
  refreshSite();
}

// ── Siparişler ──────────────────────────────────────────────────────────

export async function updateOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("orders");
  if (!user) return fail(NOT_ALLOWED, formData);
  const id = int(str(formData, "orderId"));
  if (Number.isNaN(id)) return fail("Sipariş bulunamadı.", formData);
  const result = adminSetStatus(getDb(), id, str(formData, "to"), user, {
    carrier: str(formData, "carrier"),
    trackingNumber: str(formData, "trackingNumber"),
  });
  if (!result.ok) return fail(result.message, formData);
  revalidatePath("/yonetim", "layout");
  return ok("Sipariş durumu güncellendi.");
}

// ── Kuponlar ────────────────────────────────────────────────────────────

export async function saveCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("coupons");
  if (!user) return fail(NOT_ALLOWED, formData);
  const code = normalizeCouponCode(str(formData, "code"));
  const type = str(formData, "type");
  const valueRaw = str(formData, "value");
  const minRaw = str(formData, "minSubtotalTl");
  const maxUsesRaw = str(formData, "maxUses");
  const startsAt = parseDateInput(str(formData, "startsAt"), "start");
  const endsAt = parseDateInput(str(formData, "endsAt"), "end");

  const errors: Record<string, string> = {};
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) errors.code = "Kod 3–30 karakter olmalı; harf, rakam, tire kullanın.";
  let value = NaN;
  if (type === "percent") {
    value = int(valueRaw);
    if (!(value >= 1 && value <= 100)) errors.value = "Yüzde 1 ile 100 arasında bir tam sayı olmalı.";
  } else if (type === "fixed") {
    value = parseTlToKurus(valueRaw) ?? NaN;
    if (!(value > 0)) errors.value = "İndirim tutarını 50,00 biçiminde yazın.";
  } else errors.type = "İndirim türünü seçin.";
  const min = minRaw === "" ? 0 : parseTlToKurus(minRaw);
  if (min == null) errors.minSubtotalTl = "Tutarı 500,00 biçiminde yazın.";
  const maxUses = maxUsesRaw === "" ? null : int(maxUsesRaw);
  if (maxUses !== null && !(maxUses >= 1)) errors.maxUses = "Kullanım sınırı pozitif bir tam sayı olmalı.";
  if (startsAt === undefined) errors.startsAt = "Geçerli bir tarih seçin.";
  if (endsAt === undefined) errors.endsAt = "Geçerli bir tarih seçin.";
  if (startsAt != null && endsAt != null && endsAt < startsAt) errors.endsAt = "Bitiş tarihi başlangıçtan önce olamaz.";
  const db = getDb();
  if (!errors.code && db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).get()) errors.code = "Bu kod zaten tanımlı.";
  if (Object.keys(errors).length) return fail("Lütfen işaretli alanları kontrol edin.", formData, errors);

  db.insert(coupons)
    .values({ code, type: type as "percent" | "fixed", value, minSubtotalKurus: min ?? 0, startsAt: startsAt ?? null, endsAt: endsAt ?? null, maxUses, createdAt: Date.now() })
    .run();
  recordAudit(user, "coupon.create", "coupon", code, `${type} ${value}`);
  revalidatePath("/yonetim/kuponlar");
  return ok(`${code} kuponu oluşturuldu.`);
}

export async function toggleCoupon(formData: FormData) {
  const user = await authorize("coupons");
  if (!user) return;
  const id = int(str(formData, "id"));
  const db = getDb();
  const row = Number.isNaN(id) ? null : db.select().from(coupons).where(eq(coupons.id, id)).get();
  if (!row) return;
  db.update(coupons).set({ active: !row.active }).where(eq(coupons.id, id)).run();
  recordAudit(user, row.active ? "coupon.deactivate" : "coupon.activate", "coupon", row.code);
  revalidatePath("/yonetim/kuponlar");
}

export async function deleteCoupon(formData: FormData) {
  const user = await authorize("coupons");
  if (!user) return;
  const id = int(str(formData, "id"));
  const db = getDb();
  const row = Number.isNaN(id) ? null : db.select().from(coupons).where(eq(coupons.id, id)).get();
  if (!row) return;
  db.delete(coupons).where(eq(coupons.id, id)).run();
  recordAudit(user, "coupon.delete", "coupon", row.code);
  revalidatePath("/yonetim/kuponlar");
}

// ── İçerik ve ayarlar ───────────────────────────────────────────────────

export async function saveContentGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  const group = str(formData, "group") as FieldGroup;
  const meta = GROUP_LABELS[group];
  if (!meta) return fail("Bölüm bulunamadı.", formData);
  const user = await authorize(meta.area === "settings" ? "settings" : "content");
  if (!user) return fail(NOT_ALLOWED, formData);

  const values: Partial<Record<ContentKey, string>> = {};
  const errors: Record<string, string> = {};
  for (const { key, def } of fieldsInGroup(group)) {
    const raw = formData.get(key);
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if ((key === "shippingFeeTl" || key === "freeShippingThresholdTl") && value !== "" && parseTlToKurus(value) == null)
      errors[key] = "Tutarı 89,90 biçiminde yazın.";
    if (key === "brandName" && value.length < 2) errors[key] = "Marka adı boş olamaz.";
    if (key === "sellerEmail" && value && !/^\S+@\S+\.\S+$/.test(value)) errors[key] = "Geçerli bir e-posta adresi girin.";
    if (value.length > (def.multiline ? 5000 : 300)) errors[key] = "Metin çok uzun.";
    values[key] = value;
  }
  if (Object.keys(errors).length) return fail("Lütfen işaretli alanları kontrol edin.", formData, errors);
  saveContent(values);
  recordAudit(user, "content.update", "settings", group, Object.keys(values).join(", "));
  refreshSite();
  return ok(`“${meta.title}” kaydedildi.`);
}

export async function uploadSlotImage(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("content");
  if (!user) return fail(NOT_ALLOWED);
  const slot = str(formData, "slot") as ImageSlot;
  if (!(slot in IMAGE_SLOTS)) return fail("Görsel alanı bulunamadı.");
  const previous = getSlotImages()[slot];
  if (formData.get("remove") === "on") {
    await deleteImage(previous);
    setSlotImage(slot, "");
    recordAudit(user, "image.remove", "slot", slot);
    refreshSite();
    return ok("Görsel kaldırıldı; sitede yeniden illüstrasyon görünecek.");
  }
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return fail("Yüklemek için bir görsel seçin.");
  const saved = await saveImage(file, `alan-${slot}`);
  if (!saved.ok) return fail(saved.message);
  await deleteImage(previous);
  setSlotImage(slot, saved.file);
  recordAudit(user, "image.upload", "slot", slot);
  refreshSite();
  return ok("Görsel yüklendi.");
}

export async function savePage(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("content");
  if (!user) return fail(NOT_ALLOWED, formData);
  const slug = str(formData, "slug");
  const title = str(formData, "title");
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const status = str(formData, "status");
  const db = getDb();
  const page = db.select().from(pages).where(eq(pages.slug, slug)).get();
  if (!page) return fail("Sayfa bulunamadı.", formData);
  const errors: Record<string, string> = {};
  if (title.length < 2) errors.title = "Başlık yazın.";
  if (body.length > 60000) errors.body = "Metin çok uzun.";
  if (status !== "draft" && status !== "published") errors.status = "Durum seçin.";
  if (status === "published" && /\[[^\]]+\]/.test(body))
    errors.body = "Metinde köşeli parantez içinde tamamlanmamış bölümler var. Yayımlamadan önce bunları doldurun.";
  if (Object.keys(errors).length) return fail("Lütfen işaretli alanları kontrol edin.", formData, errors);
  db.update(pages).set({ title: title.slice(0, 160), body, status: status as "draft" | "published", updatedAt: Date.now() }).where(eq(pages.slug, slug)).run();
  recordAudit(user, "page.update", "page", slug, `${page.status} → ${status}`);
  refreshSite();
  return ok("Sayfa kaydedildi.");
}

// ── Kullanıcılar ────────────────────────────────────────────────────────

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("users");
  if (!user) return fail(NOT_ALLOWED, formData);
  const email = str(formData, "email").toLowerCase();
  const name = str(formData, "name");
  const role = str(formData, "role");
  const password = String(formData.get("parola") ?? "");
  const errors: Record<string, string> = {};
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Geçerli bir e-posta adresi girin.";
  if (name.length < 2) errors.name = "Ad soyad yazın.";
  if (role !== "admin" && role !== "staff") errors.role = "Rol seçin.";
  const problem = passwordProblem(password);
  if (problem) errors.parola = problem;
  const db = getDb();
  if (!errors.email && db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()) errors.email = "Bu e-posta ile bir kullanıcı zaten var.";
  if (Object.keys(errors).length) return fail("Lütfen işaretli alanları kontrol edin.", formData, errors);
  const created = db
    .insert(users)
    .values({ email, name: name.slice(0, 120), role: role as "admin" | "staff", passwordHash: await hashPassword(password), createdAt: Date.now() })
    .returning({ id: users.id })
    .get();
  recordAudit(user, "user.create", "user", created.id, `${email} · ${role}`);
  revalidatePath("/yonetim/kullanicilar");
  return ok(`${email} eklendi.`);
}

export async function setUserActive(formData: FormData) {
  const user = await authorize("users");
  if (!user) return;
  const id = int(str(formData, "id"));
  const active = str(formData, "active") === "1";
  if (Number.isNaN(id) || id === user.id) return; // kişi kendi hesabını kapatamaz
  const db = getDb();
  const target = db.select().from(users).where(eq(users.id, id)).get();
  if (!target) return;
  db.update(users).set({ active }).where(eq(users.id, id)).run();
  if (!active) destroyUserSessions(id);
  recordAudit(user, active ? "user.activate" : "user.deactivate", "user", id, target.email);
  revalidatePath("/yonetim/kullanicilar");
}

export async function resetUserPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await authorize("users");
  if (!user) return fail(NOT_ALLOWED);
  const id = int(str(formData, "id"));
  const password = String(formData.get("parola") ?? "");
  const problem = passwordProblem(password);
  if (problem) return fail(problem);
  const db = getDb();
  const target = Number.isNaN(id) ? null : db.select().from(users).where(eq(users.id, id)).get();
  if (!target) return fail("Kullanıcı bulunamadı.");
  db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id)).run();
  destroyUserSessions(id);
  recordAudit(user, "user.password_reset", "user", id, target.email);
  return ok(`${target.email} için parola güncellendi; açık oturumları kapatıldı.`);
}

// ── Mesajlar ────────────────────────────────────────────────────────────

export async function setMessageHandled(formData: FormData) {
  const user = await authorize("messages");
  if (!user) return;
  const id = int(str(formData, "id"));
  if (Number.isNaN(id)) return;
  getDb().update(contactMessages).set({ handled: str(formData, "handled") === "1" }).where(eq(contactMessages.id, id)).run();
  revalidatePath("/yonetim/mesajlar");
}
