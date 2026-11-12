# Zeytinyağı mağazası

Altınoluk'ta üretilen zeytinyağı için e-ticaret sitesi: hikâye anlatan vitrin, sepet ve ödeme akışı, yönetim paneli.

> **Durum: yayına hazır değil.** Marka adı geçici; fiyatlar, satıcı bilgileri, yasal metinler ve sanal POS henüz girilmedi. Eksikler panelde **Pano → Yayın öncesi kontrol listesi**'nde ve bu belgenin sonunda listelenir.

## Teknoloji

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · SQLite (better-sqlite3) + Drizzle ORM · Zod · three.js (yalnızca ana sayfa girişinde, sonradan yüklenir) · Vitest · Playwright.

## Çalıştırma

Node 22 gerekir.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run admin:create -- --email siz@ornek.com --name "Ad Soyad"
```

```bash
npm run dev
```

- Site: <http://localhost:3000> · Panel: <http://localhost:3000/yonetim>
- Veritabanı ilk çalıştırmada `DATA_DIR` altında kendiliğinden oluşur; taslak ürünler ve sayfa iskeletleri eklenir. **Örnek sipariş ya da müşteri verisi eklenmez.**
- Varsayılan yönetici parolası yoktur; hesabı `admin:create` oluşturur (parola ekranda görünmeden sorulur). Personel için sonuna `--role staff` ekleyin ya da panelden **Kullanıcılar**'ı kullanın.

### Komutlar

| Komut | İşlev |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve sunucusu |
| `npm run typecheck` | Tür denetimi |
| `npm run lint` | ESLint |
| `npm test` | Birim testleri (tutar hesabı, kupon, sipariş durumları, ödeme bildirimi, oturum, yetki) |
| `npm run e2e` | Tarayıcıda uçtan uca duman testi (önce `npm run build`) |
| `npm run db:generate` | Şema değişince yeni migration üretir |

## Ortam değişkenleri

Tamamı açıklamalarıyla `.env.example` dosyasındadır. Gizli değerleri koda ya da depoya yazmayın.

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `SITE_URL` | canlıda | Sitenin açık adresi; canonical, sitemap ve ödeme dönüş adresleri bundan üretilir |
| `DATA_DIR` | — | Veritabanı ve yüklenen görsellerin klasörü (varsayılan `./data`) |
| `APP_SECRET` | canlıda | İmzalama anahtarı, en az 32 karakter. Canlıda yoksa uygulama açılmaz |
| `SITE_INDEXABLE` | — | `true` olana dek `robots.txt` tüm siteyi kapatır, sayfalar `noindex` olur |
| `PAYMENTS_PROVIDER` | — | `none` · `test` · `paytr` · `iyzico` |
| `PAYMENTS_MODE` | — | `test` · `live`. `live` iken deneme sağlayıcısı devre dışıdır |
| `PAYTR_*`, `IYZICO_*` | sağlayıcıya göre | Sağlayıcı anahtarları |
| `GA4_MEASUREMENT_ID`, `META_PIXEL_ID` | — | Boşsa etiket hiç yüklenmez; doluysa yalnızca ziyaretçi izin verince yüklenir |

Geliştirme ve canlı ortam ayrı `.env` dosyalarıyla (ya da barındırma panelindeki ortam değişkenleriyle) ayrılır; test ve canlı anahtarları aynı ortama koymayın.

## Sayfalar ve alışveriş akışı

| Adres | İçerik |
|---|---|
| `/` | Giriş (3D zeytin dalı) → Yöre → Üretim → Yağın künyesi → Sofra → Seçki → Güven → Satın alma çağrısı |
| `/urunler`, `/urunler/[slug]` | Liste ve ürün detayı: fiyat, hacim, stok, teslimat, iade bağlantısı |
| `/sepet` | Adet, kupon, ara toplam, kargo, toplam |
| `/odeme` | İletişim → teslimat adresi → özet ve onay kutuları |
| `/odeme/[sipariş]` | Ödeme adımı (sağlayıcının formu ya da açıkça işaretli deneme ekranı) |
| `/siparis/[sipariş]` | Sipariş özeti ve durumu (gizli belirteçli bağlantı) |
| `/hikayemiz`, `/sss`, `/iletisim` | Hikâye, sorular, satıcı bilgileri ve iletişim formu |
| `/teslimat-ve-iade`, `/on-bilgilendirme-formu`, `/mesafeli-satis-sozlesmesi`, `/gizlilik-ve-kvkk`, `/cerez-politikasi` | Panelden düzenlenen sayfalar |
| `/yonetim` | Yönetim paneli |

Akış: ürün → sepet → bilgiler ve onay → sipariş `Ödeme bekleniyor` olarak kaydedilir → ödeme sağlayıcısı → sağlayıcının **sunucu bildirimi** siparişi `Ödendi` yapar, stoğu düşer, kupon sayacını artırır → müşteri sipariş sayfasını görür.

Tutarlar yalnızca sunucuda hesaplanır (`src/lib/pricing.ts`, `src/lib/cart-core.ts`); çerezde yalnızca varyant kimliği ve adet tutulur.

## Görsel yön

*Kazdağı'nın gölgesinden Edremit Körfezi'ne — gece mavisi bir körfezin üstünde parlayan sıvı altın.*

| Rol | Ad | HEX |
|---|---|---|
| Koyu zemin, ana metin | Körfez Laciverti | `#12263A` |
| Açık zemin | Kireç Taşı | `#F3EDE0` |
| Vurgu | Sıvı Altın | `#E0A526` |
| Satın alma çağrısı | Kiremit | `#C8452C` |
| Yardımcı | Yaprak Gümüşü | `#8FA08A` |
| Yardımcı | Kazdağı Çamı | `#2F3B24` |

Renkler `src/app/globals.css` içindeki `@theme` bloğundan değişir. Yazı tipleri: başlıklarda Fraunces, metinde Instrument Sans (ikisi de siteyle birlikte sunulur, dış istek yok).

**Görseller.** Depoda fotoğraf yoktur. Hero'daki zeytin dalı kodla üretilir (three.js; yedeği SVG). Yöre ve sofra görselleri kodla çizilmiş illüstrasyonlardır ve sitede *"İllüstrasyon · gerçek fotoğraf eklenecek"* etiketiyle görünür; panelden **İçerik → Fotoğraflar**'a gerçek fotoğraf yüklenince yerini ona bırakır. Ürün fotoğrafı olmayan ürünlerde uydurma ambalaj çizilmez, hacimleri gösteren bir yer tutucu kullanılır.

**Hareket.** Kaydırma animasyonları yalnızca CSS'tir (`animation-timeline: view()`), kaydırmayı kilitlemez; desteklemeyen tarayıcıda içerik düz görünür. 3D sahne yalnızca 768 px üstü ekranda, yeterli cihazda, veri tasarrufu ve "hareketi azalt" kapalıyken, sayfa boşa çıkınca indirilir; sekme arka plandayken ya da görünür değilken durur.

## Yönetim paneli

- **Roller:** *Yönetici* her şeye erişir. *Personel* yalnızca siparişler, ürün–stok ve mesajları görür.
- Yetki her sayfada **ve her işlemde sunucuda** yeniden denetlenir (`src/lib/auth/guard.ts`).
- Parolalar scrypt ile özetlenir; oturum belirtecinin yalnızca SHA-256 özeti saklanır; çerez `HttpOnly`, `SameSite=Lax`, canlıda `Secure`; 12 saatte sona erer. 15 dakikada 5 hatalı girişten sonra giriş kilitlenir.
- **İşlem kayıtları:** giriş, fiyat–stok, sipariş durumu, kupon, içerik ve kullanıcı değişiklikleri kaydedilir.
- "Ödendi" durumu panelden elle atanamaz; yalnızca ödeme bildirimiyle atanır. İptal ve iadede düşülen stok geri eklenir (ücret iadesi sağlayıcının panelinden yapılır).

## Sanal POS

Kart numarası, CVV gibi veriler bu uygulamaya **hiç girmez**: ödeme, sağlayıcının kendi formunda (iframe ya da yönlendirme) alınır. Uygulama yalnızca sağlayıcının imzalı sunucu bildirimini işler.

Sağlayıcılar tek bir arayüzü uygular: `src/lib/payments/types.ts` → `PaymentProvider`.

| Sağlayıcı | Durum |
|---|---|
| `test` | Çalışıyor. **Gerçek tahsilat yapmaz**; ekranda ve panelde "deneme" olarak işaretlidir. Gerçek sağlayıcılarla aynı yolu (imzalı bildirim → doğrulama → sipariş) izler |
| `paytr` | Kod yazıldı, **gerçek hesapla denenmedi**. Yazım sırasında resmî belgeye (dev.paytr.com) erişilemedi; alan adları ve imza sırası canlıya almadan önce belgeyle karşılaştırılmalı |
| `iyzico` | **İskelet.** Seçilirse site ödemeyi "kapalı" gösterir |

### Bildirim (webhook) güvenliği

`POST /api/payments/webhook/<sağlayıcı>`

- İmza doğrulanmadan hiçbir sipariş güncellenmez (geçersiz imza → 401).
- Her bildirim `payment_events` tablosuna `(sağlayıcı, olay kimliği)` tekil anahtarıyla yazılır; **yinelenen bildirim ikinci kez işlenmez**.
- Bildirilen tutar sipariş tutarıyla uyuşmazsa sipariş ödenmiş sayılmaz ve işlem kayıtlarına düşer.
- Olay kaydı, sipariş durumu, stok ve kupon sayacı tek bir veritabanı işleminde (transaction) güncellenir.

### Gerçek POS'u bağlamak için

1. **Sağlayıcı seçin.** PayTR ya da iyzico'ya (veya bankanızın sanal POS'una) üye işyeri başvurusu yapın. Başvuruda genellikle şirket/şahıs işletmesi belgeleri, banka hesabı ve sitede satıcı bilgileri ile yasal metinlerin yayında olması istenir — kesin listeyi sağlayıcıdan alın.
2. **Anahtarları alın** ve yalnızca sunucudaki ortam değişkenlerine yazın (asla koda, depoya ya da sohbete değil):
   - PayTR: mağaza no, mağaza parolası, mağaza gizli anahtarı → `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`
   - iyzico: API anahtarı, güvenlik anahtarı, API adresi → `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`
3. **Bildirim adresini** sağlayıcının paneline girin: `https://alanadiniz/api/payments/webhook/paytr` (ya da `/iyzico`). Adres panelde **Ayarlar → Ödeme ve yayın durumu**'nda da yazar.
4. `PAYMENTS_PROVIDER=paytr`, `PAYMENTS_MODE=test` ile sağlayıcının **test modunda** uçtan uca deneyin: başarılı ödeme, başarısız ödeme, aynı bildirimin iki kez gelmesi, tutar uyuşmazlığı.
   - PayTR için: `src/lib/payments/paytr.ts` içindeki istek alanlarını ve imza sırasını resmî belgeyle satır satır karşılaştırın.
   - iyzico için: `src/lib/payments/iyzico.ts` içindeki üç adımı yazın (Checkout Form oturumu, sonuç sorgusu, bildirim imzası). Resmî `iyzipay` paketi kullanılabilir.
5. Denemeler geçince `PAYMENTS_MODE=live` yapın ve canlı anahtarları girin.

## Reklam ve arama motoru hazırlığı

- Başlık, açıklama, canonical, Open Graph görseli (`/opengraph-image`), `sitemap.xml`, `robots.txt` hazır.
- `Product` / `Offer` yapılandırılmış verisi **yalnızca fiyatı girilmiş, yayındaki ürünlerden** üretilir; taslak ürünler `noindex`'tir ve sitemap'e girmez.
- Sahte indirim, geri sayım, yorum, ödül ya da sertifika yoktur. Kupon indirimi yalnızca tanımlı ve geçerli kodla uygulanır.
- Satıcı, teslimat ve iade bilgileri ana sayfada, ürün sayfasında, alt bilgide ve sipariş sayfasında bağlantılıdır.
- **Çerez izni:** ölçümleme (GA4) ve pazarlama (Meta Pixel) etiketleri, kimlik tanımlı olsa bile ziyaretçi izin vermeden yüklenmez. "Tümünü reddet" ile "Tümünü kabul et" aynı görünürlüktedir; kutular ön işaretli değildir. Kimlik tanımlı değilse izin paneli hiç çıkmaz.

### Doğrulanamayan konular

Bu proje hazırlanırken çalışma ortamının ağı `mevzuat.gov.tr`, `kvkk.gov.tr`, `support.google.com` ve `dev.paytr.com` adreslerine erişime izin vermedi. Bu nedenle **hiçbir mevzuat ya da reklam politikası uyumu doğrulanmadı ve sitede uyum iddiası yer almaz.** Yayından önce güncel resmî kaynaklardan ve bir hukuk danışmanıyla şunları doğrulayın:

- Mesafeli Sözleşmeler Yönetmeliği: ön bilgilendirmenin zorunlu içeriği, cayma hakkı süresi ve **gıda ürünlerine ilişkin istisnalar**, iade masrafları
- 6502 sayılı Kanun ve ilgili yönetmelikler: fiyat etiketi / KDV dahil fiyat gösterimi, sipariş onayı ve kalıcı veri saklayıcısıyla bildirim yükümlülüğü (sipariş onay e-postası şu an **gönderilmiyor**)
- 6563 sayılı Kanun: sitede bulunması gereken tanıtıcı bilgiler (MERSİS, KEP vb.), ETBİS kaydı
- KVKK: aydınlatma metni, açık rıza gereken işlemler, VERBİS yükümlülüğü, Kurul'un çerez rehberi
- Gıda mevzuatı: işletme kayıt/onay numarası, etiket bilgileri, "erken hasat", "sızma" gibi ifadelerin kullanım koşulları, sağlık beyanı yasağı
- Google Ads (hedef sayfa gereksinimleri, yanlış beyan) ve Meta reklam standartları: gıda ürünleri ve iddialar için güncel kurallar
- Google Consent Mode ve Meta Pixel'in izin gereksinimleri

## Dağıtım

SQLite ve yüklenen görseller diske yazıldığı için **kalıcı diski olan** bir Node barındırma gerekir (VPS, Railway, Fly.io, Render vb.). Vercel gibi sunucusuz ortamlarda disk kalıcı değildir; orada kullanmak için veri katmanını Postgres'e ve görselleri nesne depolamaya taşımak gerekir (şema Drizzle ile yazıldığı için taşınabilir, ancak bu iş yapılmadı).

1. `npm ci && npm run build`
2. Ortam değişkenlerini girin (`SITE_URL`, `APP_SECRET`, `DATA_DIR` kalıcı diskte).
3. `npm start` (ters vekil arkasında; HTTPS zorunlu).
4. `DATA_DIR` klasörünü düzenli yedekleyin (veritabanı + `uploads/`).
5. Sağlık denetimi: `GET /api/saglik`.

## Yayından önce tamamlanacaklar

Panelde **Pano → Yayın öncesi kontrol listesi** bu maddelerin durumunu canlı gösterir.

| Eksik | Nerede girilir |
|---|---|
| Gerçek marka adı ("Altınoluk Zeytinyağı" geçicidir) ve logo | Ayarlar → Marka · logo için `src/components/site/Header.tsx` içindeki `Wordmark` |
| Satıcı bilgileri (unvan, adres, telefon, e-posta, MERSİS, vergi, KEP, işletme kayıt no) | Ayarlar → Satıcı bilgileri |
| Kargo ücreti, ücretsiz kargo sınırı, teslimat süresi, iade özeti | Ayarlar → Kargo ve teslimat |
| Ürün fiyatları, stok, hacimler (tohum hacimler varsayımdır), açıklama ve özellikler | Ürünler |
| Ürün fotoğrafları | Ürünler → ürün → Ürün fotoğrafı |
| Yöre, sofra ve üretici fotoğrafları | İçerik → Fotoğraflar |
| Yağın künyesi (çeşit, hasat dönemi, sıkım, asitlik, tat profili, belgeler) | İçerik → Yağın künyesi |
| Üretim notları ve üreticinin kendi hikâyesi | İçerik → Üretim notları / Hikâyemiz |
| Yasal metinler ve SSS (şu an köşeli parantezli iskelet; hukuki inceleme gerekir) | İçerik → Sayfalar |
| Sanal POS | Ortam değişkenleri (yukarıdaki bölüm) |
| Sipariş onay e-postası (şu an gönderilmiyor; onay ekranda gösterilir) | Bir e-posta sağlayıcısı bağlanmalı |
| GA4 / Meta Pixel kimlikleri | Ortam değişkenleri |
| Arama motorlarına açılma | `SITE_INDEXABLE=true` |

Fiyat alanları "KDV dahil satış fiyatı" olarak etiketlidir ve sitede "Fiyatlara KDV dahildir" yazar; fiyatlarınızı buna göre girin ya da ifadeyi kendi uygulamanıza göre düzeltin (`src/components/site/OrderSummary.tsx`, ürün sayfası).

## Dizin yapısı

```
src/app/(site)/      vitrin sayfaları ve alışveriş işlemleri (actions.ts)
src/app/yonetim/     yönetim paneli ve işlemleri (actions.ts)
src/app/api/         ödeme bildirimi, sağlık denetimi
src/components/      art/ (illüstrasyonlar) · hero/ (3D) · site/ · admin/ · ui/
src/lib/             db/ · auth/ · orders/ · payments/ · content/ · pricing, coupons, cart
drizzle/             veritabanı migration'ları
tests/               birim testleri        scripts/   admin oluşturma, uçtan uca test
```
