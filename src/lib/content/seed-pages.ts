/**
 * Yasal sayfa iskeletleri. Bunlar hukuki metin DEĞİLDİR: başlıkları ve
 * doldurulması gereken alanları gösterir. Köşeli parantez içindeki bölümler
 * sitede "tamamlanacak" olarak vurgulanır. Yayına almadan önce bir hukuk
 * danışmanına inceletin.
 */
export const LEGAL_SLUGS = [
  "on-bilgilendirme-formu",
  "mesafeli-satis-sozlesmesi",
  "teslimat-ve-iade",
  "gizlilik-ve-kvkk",
  "cerez-politikasi",
] as const;

export const SEED_PAGES: { slug: string; title: string; body: string }[] = [
  {
    slug: "sss",
    title: "Sık Sorulan Sorular",
    body: `## Siparişim ne zaman kargoya verilir?
[Siparişlerin kaç iş günü içinde kargoya verildiğini yazın.]

## Kargo ücreti ne kadar?
Kargo ücreti, sepetinizde ve ödeme adımında siparişi onaylamadan önce ayrı bir satır olarak gösterilir. [Varsa ücretsiz kargo koşulunu yazın.]

## Hangi illere gönderim yapıyorsunuz?
[Gönderim yaptığınız bölgeleri ve çalıştığınız kargo firmasını yazın.]

## Ödemeyi nasıl yapabilirim?
[Kabul ettiğiniz ödeme yöntemlerini yazın. Kart bilgileri sitemizde saklanmaz; ödeme, ödeme kuruluşunun güvenli sayfasında alınır.]

## İade ve değişim koşulları nedir?
Koşulların tamamı Teslimat ve İade sayfasında yer alır. [Kısa özetini buraya yazın.]

## Zeytinyağını nasıl saklamalıyım?
Zeytinyağı ışığı, sıcağı ve havayı sevmez. Şişeyi ya da tenekeyi serin ve karanlık bir yerde, kapağı sıkıca kapalı tutun; ocağın yanında bekletmeyin.

## Teneke ile cam şişe arasında fark var mı?
Teneke ışık geçirmez ve büyük hacimler için pratiktir; cam şişe sofrada kullanım için rahattır. [Teneke ve şişedeki yağın aynı parti olup olmadığını belirtin.]

## Fatura düzenliyor musunuz?
[Fatura / e-arşiv fatura bilgisini yazın.]`,
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    body: `## Satıcı bilgileri
[Ticaret unvanı, açık adres, telefon, e-posta, MERSİS numarası]

## Ürünün temel nitelikleri
Sipariş edilen ürünlerin adı, hacmi ve adedi sipariş özetinde gösterilir.

## Fiyat ve ödeme
Ürün fiyatları, kargo ücreti ve varsa indirimler sipariş özetinde, siparişi onaylamadan önce toplam tutarla birlikte gösterilir. [Vergilerin fiyata dahil olup olmadığını ve ödeme yöntemlerini yazın.]

## Teslimat
[Teslimat süresi, kargo firması, teslimat masrafının kime ait olduğu]

## Cayma hakkı
[Cayma hakkının süresi, nasıl kullanılacağı, bildirimin yapılacağı adres ve iade masrafları. Gıda ürünlerine ilişkin istisnaların sizin ürünleriniz için nasıl uygulanacağını hukuk danışmanınızla netleştirin.]

## Şikâyet ve itiraz
[Şikâyetlerin iletileceği iletişim bilgileri; tüketici hakem heyeti ve tüketici mahkemelerine başvuru bilgisi]`,
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    body: `## 1. Taraflar
[Satıcı bilgileri] ile sipariş sırasında bilgilerini giren alıcı.

## 2. Konu
[Sözleşmenin konusu]

## 3. Ürün, fiyat ve ödeme
Sözleşme konusu ürünler, adetleri, satış fiyatları, kargo ücreti ve toplam tutar sipariş özetinde yer alır.

## 4. Teslimat
[Teslimat koşulları ve süresi]

## 5. Cayma hakkı
[Cayma hakkı koşulları ve istisnaları]

## 6. Genel hükümler
[Genel hükümler]

## 7. Uyuşmazlıkların çözümü
[Yetkili merciler]`,
  },
  {
    slug: "teslimat-ve-iade",
    title: "Teslimat ve İade",
    body: `## Teslimat
[Siparişlerin hazırlanma ve kargoya verilme süresi, kargo firması, gönderim yapılan bölgeler]

## Kargo ücreti
Kargo ücreti sepette ve ödeme adımında ayrı bir satır olarak gösterilir. [Ücretsiz kargo koşulu varsa yazın.]

## Hasarlı ya da eksik teslimat
[Hasarlı paket tesliminde izlenecek yol ve iletişim bilgisi]

## İade ve cayma
[İade ve cayma koşulları, süre, iade adresi, iade kargo ücreti, ücret iadesinin nasıl ve ne sürede yapılacağı]`,
  },
  {
    slug: "gizlilik-ve-kvkk",
    title: "Gizlilik ve Kişisel Verilerin Korunması",
    body: `## Veri sorumlusu
[Veri sorumlusunun kimliği ve iletişim bilgileri]

## Hangi verileri işliyoruz?
Sipariş verirken paylaştığınız ad soyad, e-posta, telefon ve teslimat adresi ile sipariş içeriği. İletişim formunu kullanırsanız adınız, e-posta adresiniz ve mesajınız. Kart bilgileriniz sitemizde işlenmez ve saklanmaz; ödeme, ödeme kuruluşunun kendi sayfasında alınır.

## İşleme amaçları ve hukuki sebepler
[Amaçlar ve hukuki sebepler]

## Verilerin aktarılması
[Kargo firması, ödeme kuruluşu gibi alıcı grupları]

## Saklama süresi
[Saklama süreleri]

## Haklarınız ve başvuru
[İlgili kişi hakları ve başvuru yöntemi]`,
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    body: `## Zorunlu çerezler
Sitenin çalışması için gereken çerezlerdir; kapatılamaz.
- sepet: sepetinizdeki ürünleri hatırlar.
- kupon: sepete uyguladığınız kupon kodunu hatırlar.
- cerez_tercihi: çerez tercihinizi saklar.

## Ölçümleme çerezleri
Yalnızca izin verirseniz çalışır. [Kullanıyorsanız: Google Analytics 4 — amaç ve saklama süresi]

## Pazarlama çerezleri
Yalnızca izin verirseniz çalışır. [Kullanıyorsanız: Meta Pixel — amaç ve saklama süresi]

## Tercihinizi değiştirme
Sayfanın altındaki “Çerez tercihleri” bağlantısından tercihinizi dilediğiniz zaman değiştirebilirsiniz.`,
  },
];
