/**
 * Uçtan uca duman testi. Üretim derlemesini geçici bir veritabanıyla başlatır
 * ve gerçek bir tarayıcıda alışveriş + yönetim akışını dener.
 *
 *   npm run build && npm run e2e
 *
 * Ekran görüntüleri için: E2E_SHOTS=/bir/klasor npm run e2e
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("/opt/node-tools/node_modules/playwright");
}
const { chromium, devices } = playwright;

const PORT = Number(process.env.E2E_PORT ?? 3210);
const BASE = `http://localhost:${PORT}`;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "magaza-e2e-"));
const SHOTS = process.env.E2E_SHOTS;
const ADMIN = { email: "yonetici@example.com", password: "e2e-yonetici-parolasi" };
const STAFF = { email: "personel@example.com", password: "e2e-personel-parolasi" };
const env = {
  ...process.env,
  NODE_ENV: "production",
  PORT: String(PORT),
  DATA_DIR,
  SITE_URL: BASE,
  APP_SECRET: "e2e-icin-uretilmis-en-az-otuz-iki-karakterlik-anahtar",
  PAYMENTS_PROVIDER: "test",
  PAYMENTS_MODE: "test",
  SITE_INDEXABLE: "false",
  // Gerçek hesap değil: yalnızca "izin verilmeden istek gitmiyor" denetimi için.
  GA4_MEASUREMENT_ID: "G-E2ETEST000",
  META_PIXEL_ID: "000000000000000",
};

let passed = 0;
const failures = [];
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${String(error.message ?? error).split("\n")[0]}`);
  }
}
function expect(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [who, role] of [[ADMIN, "admin"], [STAFF, "staff"]]) {
  const r = spawnSync("npx", ["tsx", "scripts/create-admin.ts", "--email", who.email, "--name", role === "admin" ? "Deneme Yönetici" : "Deneme Personel", "--role", role], {
    env: { ...env, ADMIN_PASSWORD: who.password },
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(`Kullanıcı oluşturulamadı: ${r.stderr}`);
}

try {
  await fetch(`${BASE}/api/saglik`);
  console.error(`${PORT} numaralı bağlantı noktasında zaten bir sunucu çalışıyor. Onu durdurun ya da E2E_PORT ile başka bir numara verin.`);
  process.exit(1);
} catch {
  /* beklenen durum: bağlantı noktası boş */
}

// npx yerine doğrudan node: süreç sonlandırıldığında sunucu da gerçekten kapanır.
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", String(PORT)], { env, stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(`${BASE}/api/saglik`)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch();
const shot = async (page, name) => SHOTS && (await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false }));

async function login(context, who) {
  const page = await context.newPage();
  await page.goto(`${BASE}/yonetim/giris`);
  await page.getByLabel("E-posta").fill(who.email);
  await page.getByLabel("Parola").fill(who.password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await page.waitForURL(`${BASE}/yonetim`);
  return page;
}

try {
  console.log("Erişim denetimi");
  await step("oturumsuz /yonetim girişe yönlendirir", async () => {
    const page = await browser.newPage();
    for (const p of ["/yonetim", "/yonetim/siparisler", "/yonetim/ayarlar", "/yonetim/kullanicilar"]) {
      await page.goto(BASE + p);
      expect(page.url().endsWith("/yonetim/giris"), `${p} korunmuyor: ${page.url()}`);
    }
    await page.close();
  });
  await step("hatalı parola reddedilir", async () => {
    const page = await browser.newPage();
    await page.goto(`${BASE}/yonetim/giris`);
    await page.getByLabel("E-posta").fill(ADMIN.email);
    await page.getByLabel("Parola").fill("yanlis-parola-000");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await page.getByText("E-posta ya da parola hatalı.").waitFor();
    await page.close();
  });
  await step("imzasız ödeme bildirimi reddedilir (401)", async () => {
    const res = await fetch(`${BASE}/api/payments/webhook/test`, { method: "POST", body: JSON.stringify({ eventId: "x", orderNumber: "AOXXXXXXXXXX", outcome: "paid" }) });
    expect(res.status === 401, `beklenen 401, gelen ${res.status}`);
    const other = await fetch(`${BASE}/api/payments/webhook/paytr`, { method: "POST", body: "a=b" });
    expect(other.status === 404, `etkin olmayan sağlayıcı için beklenen 404, gelen ${other.status}`);
  });
  await step("robots.txt yayın öncesi tüm siteyi kapatır", async () => {
    const text = await (await fetch(`${BASE}/robots.txt`)).text();
    expect(/Disallow: \/\s*$/m.test(text), text);
  });

  console.log("Çerez izni");
  await step("izin verilmeden izleme isteği gitmez; reddedince de gitmez", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const tracking = [];
    page.on("request", (r) => /googletagmanager|google-analytics|facebook\.net|facebook\.com/.test(r.url()) && tracking.push(r.url()));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("dialog", { name: "Çerez tercihleri" }).waitFor();
    await shot(page, "cerez-paneli");
    expect(tracking.length === 0, `izin öncesi istek: ${tracking[0]}`);
    await page.getByRole("button", { name: "Tümünü reddet" }).click();
    await page.goto(`${BASE}/urunler`, { waitUntil: "networkidle" });
    expect(tracking.length === 0, `ret sonrası istek: ${tracking[0]}`);
    expect((await page.getByRole("dialog").count()) === 0, "panel yeniden açıldı");
    await context.close();
  });
  await step("izin verilince etiketler yüklenmeye çalışılır", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const tracking = [];
    page.on("request", (r) => /googletagmanager|facebook\.net/.test(r.url()) && tracking.push(r.url()));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Tümünü kabul et" }).click();
    await page.waitForTimeout(800);
    expect(tracking.some((u) => u.includes("googletagmanager")) && tracking.some((u) => u.includes("facebook.net")), `istekler: ${tracking.join(", ") || "yok"}`);
    await context.close();
  });

  console.log("Hareket ve 3D");
  await step("masaüstünde 3D sahne sonradan yüklenir; 'hareketi azalt' ve mobilde yüklenmez", async () => {
    const consent = [{ name: "cerez_tercihi", value: encodeURIComponent(JSON.stringify({ a: 0, m: 0, t: 1 })), url: BASE }];
    const count = async (options) => {
      const context = await browser.newContext(options);
      await context.addCookies(consent);
      const page = await context.newPage();
      const scripts = [];
      page.on("response", (r) => r.url().endsWith(".js") && scripts.push(r.url()));
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      const result = { canvas: await page.locator("canvas").count(), svg: await page.locator('svg[role="img"]').first().isVisible(), scripts: scripts.length };
      await context.close();
      return result;
    };
    const desktop = await count({ viewport: { width: 1440, height: 900 } });
    const reduced = await count({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const mobile = await count({ ...devices["iPhone 13"] });
    expect(reduced.canvas === 0 && reduced.svg, `hareketi azalt: ${JSON.stringify(reduced)}`);
    expect(mobile.canvas === 0 && mobile.svg, `mobil: ${JSON.stringify(mobile)}`);
    expect(desktop.scripts > reduced.scripts, "3D kodu azaltılmış harekette de indirildi");
    console.log(`      (masaüstü canvas: ${desktop.canvas}; WebGL yoksa SVG yedek kalır)`);
  });

  console.log("Yayın öncesi vitrin");
  const shopper = await browser.newContext({ ...devices["iPhone 13"] });
  const shop = await shopper.newPage();
  await shopper.addCookies([{ name: "cerez_tercihi", value: encodeURIComponent(JSON.stringify({ a: 0, m: 0, t: 1 })), url: BASE }]);
  await step("fiyatsız taslak ürün satın alınamaz", async () => {
    await shop.goto(`${BASE}/urunler/zeytinyagi`);
    await shop.getByText("Bu ürün henüz satışa açılmadı").waitFor();
    expect((await shop.getByRole("button", { name: "Sepete ekle" }).count()) === 0, "sepete ekle düğmesi görünüyor");
    expect(!(await shop.content()).includes("application/ld+json"), "taslak ürün için yapılandırılmış veri üretildi");
  });

  console.log("Yönetim: kurulum");
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const admin = await login(adminCtx, ADMIN);
  await step("kontrol listesi açık maddeleri gösterir", async () => {
    await admin.getByText("Yayın öncesi kontrol listesi").waitFor();
    await shot(admin, "panel-pano");
  });
  await step("kargo ücreti tanımlanır", async () => {
    await admin.goto(`${BASE}/yonetim/ayarlar`);
    await admin.getByLabel("Sabit kargo ücreti (TL)").fill("90");
    await admin.getByRole("button", { name: "Kargo ve teslimat bölümünü kaydet" }).click();
    await admin.getByText("“Kargo ve teslimat” kaydedildi.").waitFor();
  });
  let productId;
  await step("ürüne fiyat ve stok girilir, ürün yayına alınır", async () => {
    await admin.goto(`${BASE}/yonetim/urunler`);
    await admin.getByRole("link", { name: "Zeytinyağı", exact: true }).click();
    await admin.waitForURL(/\/yonetim\/urunler\/\d+$/);
    productId = admin.url().split("/").pop();
    const first = admin.locator("form", { has: admin.locator('input[name="label"][value="500 ml cam şişe"]') });
    await first.getByLabel("Satış fiyatı (KDV dahil, TL)").fill("400,00");
    await first.getByLabel("Stok (adet)").fill("7");
    await first.getByRole("button", { name: "Seçeneği kaydet" }).click();
    await first.getByText("Seçenek kaydedildi.").waitFor();
    const info = admin.locator("form", { has: admin.locator('input[name="slug"]') });
    await info.getByLabel("Durum").selectOption("active");
    await info.getByRole("button", { name: "Ürünü kaydet" }).click();
    await info.getByText("Ürün kaydedildi.").waitFor();
    await shot(admin, "panel-urun");
  });
  await step("geçersiz kupon reddedilir, geçerli kupon oluşturulur", async () => {
    await admin.goto(`${BASE}/yonetim/kuponlar`);
    await admin.getByLabel("Kod").fill("ON");
    await admin.getByLabel("İndirim değeri").fill("250");
    await admin.getByRole("button", { name: "Kuponu oluştur" }).click();
    await admin.getByText("Yüzde 1 ile 100 arasında bir tam sayı olmalı.").waitFor();
    await admin.getByLabel("Kod").fill("HOSGELDIN");
    await admin.getByLabel("İndirim değeri").fill("10");
    await admin.getByRole("button", { name: "Kuponu oluştur" }).click();
    await admin.getByText("HOSGELDIN kuponu oluşturuldu.").waitFor();
  });

  console.log("Alışveriş akışı (mobil)");
  let orderNumber = "";
  await step("ürün sayfası fiyatı, stoğu ve yapılandırılmış veriyi gösterir", async () => {
    await shop.goto(`${BASE}/urunler/zeytinyagi`);
    await shop.getByText("₺400,00").first().waitFor();
    expect((await shop.content()).includes('"priceCurrency":"TRY"'), "Product JSON-LD yok");
    await shot(shop, "mobil-urun");
  });
  await step("sepete eklenir; ara toplam, kargo ve toplam gösterilir", async () => {
    await shop.getByLabel("Adet").selectOption("2");
    await shop.getByRole("button", { name: "Sepete ekle" }).click();
    await shop.getByText("Sepetinize eklendi.").waitFor();
    await shop.getByRole("link", { name: "Sepete git" }).click();
    await shop.waitForURL(`${BASE}/sepet`);
    const text = await shop.locator("aside").innerText();
    expect(text.includes("₺800,00") && text.includes("₺90,00") && text.includes("₺890,00"), `özet: ${text}`);
  });
  await step("geçersiz kupon reddedilir, geçerli kupon indirimi uygular", async () => {
    await shop.getByLabel("Kupon kodu").fill("YOKBOYLE");
    await shop.getByRole("button", { name: "Uygula" }).click();
    await shop.getByText("Bu kupon kodu geçerli değil.").waitFor();
    await shop.getByLabel("Kupon kodu").fill("hosgeldin");
    await shop.getByRole("button", { name: "Uygula" }).click();
    await shop.getByText("kuponu uygulandı").waitFor();
    const text = await shop.locator("aside").innerText();
    expect(text.includes("₺80,00") && text.includes("₺810,00"), `özet: ${text}`);
    await shot(shop, "mobil-sepet");
  });
  await step("eksik bilgi ve onaysız sipariş reddedilir", async () => {
    await shop.getByRole("link", { name: "Ödeme adımına geç" }).click();
    await shop.waitForURL(`${BASE}/odeme`);
    await shop.getByRole("button", { name: "Siparişi onayla ve ödemeye geç" }).click();
    await shop.getByText("Lütfen işaretli alanları kontrol edin.").waitFor();
    await shop.getByText("Geçerli bir e-posta adresi girin.").waitFor();
    expect(shop.url() === `${BASE}/odeme`, "sipariş oluşturuldu");
  });
  await step("sipariş oluşturulur; ödeme ekranı deneme olduğunu açıkça söyler", async () => {
    await shop.getByLabel("Ad soyad").fill("Deneme Müşteri");
    await shop.getByLabel("E-posta").fill("musteri@example.com");
    await shop.getByLabel("Cep telefonu").fill("0555 000 00 00");
    await shop.locator("#city").fill("Balıkesir");
    await shop.locator("#district").fill("Edremit");
    await shop.getByLabel("Açık adres").fill("Deneme Mahallesi, Deneme Sokak No: 1 Daire: 2");
    await shop.getByRole("checkbox").nth(0).check();
    await shop.getByRole("checkbox").nth(1).check();
    await shot(shop, "mobil-odeme");
    await shop.getByRole("button", { name: "Siparişi onayla ve ödemeye geç" }).click();
    await shop.waitForURL(/\/odeme\/AO[A-Z0-9]+\?t=/);
    orderNumber = new URL(shop.url()).pathname.split("/").pop();
    await shop.getByText("Bu ekran gerçek bir ödeme sayfası").waitFor();
    expect((await shop.locator("input[type=text], input[type=tel], input[type=number]").count()) === 0, "ödeme ekranında kart alanı var");
    await shot(shop, "mobil-deneme-odeme");
  });
  await step("başka birinin siparişi belirteç olmadan görüntülenemez", async () => {
    const res = await fetch(`${BASE}/siparis/${orderNumber}`);
    const wrong = await fetch(`${BASE}/siparis/${orderNumber}?t=yanlis`);
    expect(res.status === 404 && wrong.status === 404, `durum: ${res.status}/${wrong.status}`);
  });
  await step("başarısız ödeme siparişi ödenmiş saymaz", async () => {
    await shop.getByRole("button", { name: "Başarısız ödemeyi dene" }).click();
    await shop.getByText("Ödeme tamamlanamadı. Tutar tahsil edilmedi").waitFor();
  });
  await step("başarılı ödeme siparişi onaylar ve sepeti boşaltır", async () => {
    await shop.getByRole("button", { name: "Başarılı ödemeyi dene" }).click();
    await shop.waitForURL(/\/siparis\/AO/);
    await shop.getByRole("heading", { name: "Siparişiniz alındı" }).waitFor();
    await shop.getByText("Bu bir deneme siparişidir").waitFor();
    await shot(shop, "mobil-siparis");
    await shop.waitForTimeout(1200);
    await shop.goto(`${BASE}/sepet`);
    await shop.getByRole("heading", { name: "Sepetiniz boş" }).waitFor();
  });

  console.log("Yönetim: sipariş");
  await step("sipariş panelde görünür, stok düşmüştür", async () => {
    await admin.goto(`${BASE}/yonetim/siparisler`);
    await admin.getByRole("link", { name: orderNumber }).click();
    await admin.getByText("Ödendi").first().waitFor();
    await shot(admin, "panel-siparis");
    await admin.goto(`${BASE}/yonetim/urunler/${productId}`);
    const stock = await admin.locator("form", { has: admin.locator('input[name="label"][value="500 ml cam şişe"]') }).getByLabel("Stok (adet)").inputValue();
    expect(stock === "5", `stok ${stock}, beklenen 5`);
  });
  await step("durum hazırlanıyor → kargoya verildi olarak güncellenir; müşteri sayfasına yansır", async () => {
    await admin.goto(`${BASE}/yonetim/siparisler`);
    await admin.getByRole("link", { name: orderNumber }).click();
    expect((await admin.locator('select[name="to"] option[value="paid"]').count()) === 0, "'ödendi' elle atanabiliyor");
    await admin.getByLabel("Yeni durum").selectOption("preparing");
    await admin.getByRole("button", { name: "Durumu güncelle" }).click();
    await admin.getByText("Sipariş durumu güncellendi.").waitFor();
    await admin.getByLabel("Yeni durum").selectOption("shipped");
    await admin.getByLabel("Kargo firması").fill("Deneme Kargo");
    await admin.getByLabel("Takip numarası").fill("TR123456");
    await admin.getByRole("button", { name: "Durumu güncelle" }).click();
    await admin.getByText("Kargoya verildi").first().waitFor();
    await shop.goBack();
    await shop.reload();
    await shop.getByText("TR123456").waitFor();
  });
  await step("işlem kayıtları fiyat, sipariş ve kupon değişikliklerini içerir", async () => {
    await admin.goto(`${BASE}/yonetim/kayitlar`);
    const text = await admin.locator("table").innerText();
    for (const needle of ["Fiyat / stok güncellendi", "Sipariş durumu değişti", "Kupon oluşturuldu", "Ödeme onaylandı", "Hatalı giriş denemesi"])
      expect(text.includes(needle), `kayıt yok: ${needle}`);
    await shot(admin, "panel-kayitlar");
  });

  console.log("Rol ayrımı");
  const staffCtx = await browser.newContext({ ...devices["iPhone 13"] });
  const staff = await login(staffCtx, STAFF);
  await step("personel ayar, kupon, kullanıcı, içerik ve kayıt ekranlarına giremez", async () => {
    for (const p of ["ayarlar", "kuponlar", "kullanicilar", "kayitlar", "icerik"]) {
      await staff.goto(`${BASE}/yonetim/${p}`);
      expect(staff.url().includes("yetki=yok"), `personel /yonetim/${p} sayfasına girdi`);
    }
    expect((await staff.getByRole("link", { name: "Ayarlar" }).count()) === 0, "menüde Ayarlar görünüyor");
    await staff.goto(`${BASE}/yonetim/siparisler`);
    await staff.getByRole("link", { name: orderNumber }).waitFor();
    await shot(staff, "mobil-panel-personel");
  });
  await step("personel oturumuyla yönetici işlemi (kupon oluşturma) sunucuda reddedilir", async () => {
    // Yönetici kupon formunu açar; ardından oturum çerezi personelinkiyle değiştirilir.
    await admin.goto(`${BASE}/yonetim/kuponlar`);
    const staffCookie = (await staffCtx.cookies(`${BASE}/yonetim`)).find((c) => c.name === "yonetim_oturum");
    await adminCtx.clearCookies();
    await adminCtx.addCookies([{ name: staffCookie.name, value: staffCookie.value, url: `${BASE}/yonetim` }]);
    await admin.getByLabel("Kod").fill("SIZMA");
    await admin.getByLabel("İndirim değeri").fill("50");
    await admin.getByRole("button", { name: "Kuponu oluştur" }).click();
    await admin.getByText("Bu işlem için yetkiniz yok").waitFor();
  });
  await step("oturumsuz yönetim işlemi reddedilir", async () => {
    await adminCtx.clearCookies();
    await admin.getByLabel("Kod").fill("SIZMA2");
    await admin.getByRole("button", { name: "Kuponu oluştur" }).click();
    await admin.getByText("Bu işlem için yetkiniz yok").waitFor();
  });

  if (SHOTS) {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktop.newPage();
    for (const [name, url] of [["masaustu-ana", "/"], ["masaustu-urunler", "/urunler"], ["masaustu-hikaye", "/hikayemiz"], ["masaustu-sss", "/sss"], ["masaustu-iletisim", "/iletisim"], ["masaustu-yasal", "/teslimat-ve-iade"]]) {
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      await shot(page, name);
    }
    for (const [name, url] of [["mobil-ana", "/"], ["mobil-urunler", "/urunler"]]) {
      await shop.goto(BASE + url, { waitUntil: "networkidle" });
      await shot(shop, name);
    }
  }
} finally {
  await browser.close();
  server.kill("SIGTERM");
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
}

console.log(`\n${passed} adım geçti, ${failures.length} adım başarısız.`);
if (failures.length > 0) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  if (process.env.E2E_VERBOSE) console.log(serverLog);
  process.exit(1);
}
