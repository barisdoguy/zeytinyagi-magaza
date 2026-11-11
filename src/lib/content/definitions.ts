/**
 * Sitedeki düzenlenebilir metinlerin ve temel ayarların tanımı.
 * Değerler veritabanındaki `settings` tablosunda tutulur; kayıt yoksa buradaki
 * varsayılan kullanılır. Varsayılanı boş olan alanlar "henüz girilmemiş gerçek
 * bilgi" demektir: sitede "eklenecek" olarak işaretlenir, uydurma değer yazılmaz.
 */
export type FieldGroup =
  | "marka"
  | "satici"
  | "kargo"
  | "anasayfa"
  | "uretim"
  | "kunye"
  | "hikaye";

export type FieldDef = {
  label: string;
  group: FieldGroup;
  default: string;
  multiline?: boolean;
  help?: string;
};

export const GROUP_LABELS: Record<FieldGroup, { title: string; description: string; area: "settings" | "content" }> = {
  marka: { title: "Marka", description: "Site genelinde görünen ad ve yöre bilgisi.", area: "settings" },
  satici: {
    title: "Satıcı bilgileri",
    description: "Alt bilgide, iletişim sayfasında ve sipariş özetinde gösterilir. Yalnızca gerçek işletme bilgilerinizi girin.",
    area: "settings",
  },
  kargo: { title: "Kargo ve teslimat", description: "Sepette ve ürün sayfalarında gösterilen ücret ve notlar.", area: "settings" },
  anasayfa: { title: "Ana sayfa", description: "Ana sayfadaki başlık ve metinler.", area: "content" },
  uretim: {
    title: "Üretim notları",
    description: "Her üretim adımında kendi uygulamanızı anlatan kısa notlar. Boş bırakılan not sitede “eklenecek” olarak görünür.",
    area: "content",
  },
  kunye: {
    title: "Yağın künyesi",
    description: "Yalnızca belgeleyebildiğiniz bilgileri yazın. Boş alanlar sitede “eklenecek” olarak görünür.",
    area: "content",
  },
  hikaye: { title: "Hikâyemiz", description: "Hikâyemiz sayfasındaki metinler.", area: "content" },
};

export const FIELDS = {
  // ── Marka ──
  brandName: { label: "Marka adı", group: "marka", default: "Altınoluk Zeytinyağı", help: "Geçici addır; gerçek marka adınızla değiştirin." },
  tagline: { label: "Kısa tanıtım cümlesi", group: "marka", default: "Kazdağı eteklerinden, üreticisinden." },
  region: { label: "Yöre", group: "marka", default: "Altınoluk, Edremit / Balıkesir" },

  // ── Satıcı ──
  sellerLegalName: { label: "Ticaret unvanı / ad soyad", group: "satici", default: "" },
  sellerAddress: { label: "Açık adres", group: "satici", default: "", multiline: true },
  sellerPhone: { label: "Telefon", group: "satici", default: "" },
  sellerEmail: { label: "E-posta", group: "satici", default: "" },
  sellerMersis: { label: "MERSİS numarası", group: "satici", default: "" },
  sellerTaxOffice: { label: "Vergi dairesi", group: "satici", default: "" },
  sellerTaxNumber: { label: "Vergi / T.C. kimlik numarası", group: "satici", default: "" },
  sellerKep: { label: "KEP adresi", group: "satici", default: "" },
  sellerFoodRegNo: { label: "Gıda işletme kayıt / onay numarası", group: "satici", default: "" },

  // ── Kargo ──
  shippingFeeTl: { label: "Sabit kargo ücreti (TL)", group: "kargo", default: "", help: "Örnek: 89,90. Boşken sipariş alınmaz. Kargo ücretsizse 0 yazın." },
  freeShippingThresholdTl: { label: "Ücretsiz kargo alt sınırı (TL)", group: "kargo", default: "", help: "Bu tutar ve üzeri sepetlerde kargo ücreti alınmaz. Uygulamıyorsanız boş bırakın." },
  carrierName: { label: "Kargo firması", group: "kargo", default: "" },
  deliveryNote: { label: "Teslimat süresi notu", group: "kargo", default: "", multiline: true, help: "Örnek: “Siparişler … iş günü içinde kargoya verilir.” Yalnızca tutabileceğiniz süreyi yazın." },
  returnNote: { label: "İade koşulları özeti", group: "kargo", default: "", multiline: true, help: "Ürün sayfasında kısa özet olarak görünür; ayrıntısı “Teslimat ve İade” sayfasındadır." },

  // ── Ana sayfa ──
  heroEyebrow: { label: "Giriş — üst satır", group: "anasayfa", default: "Altınoluk · Kazdağı eteği" },
  heroTitle: { label: "Giriş — başlık", group: "anasayfa", default: "Dağın gölgesinde büyür, sofranızda ışır." },
  heroText: {
    label: "Giriş — metin",
    group: "anasayfa",
    multiline: true,
    default:
      "Kazdağı’nın Edremit Körfezi’ne indiği yamaçlarda, Altınoluk’ta ürettiğimiz zeytinyağını aracısız, doğrudan sofranıza gönderiyoruz.",
  },
  yoreTitle: { label: "Yöre — başlık", group: "anasayfa", default: "Dağ ile deniz arasında ince bir şerit" },
  yoreText: {
    label: "Yöre — metin",
    group: "anasayfa",
    multiline: true,
    default:
      "Altınoluk, Kazdağı’nın güney yamacıyla Edremit Körfezi arasına sıkışmış bir sahil beldesi. Sırtını dağa, yüzünü denize veren bu yamaçlarda zeytin, manzaranın da mutfağın da en eski parçası.\n\nBizim yağımız da bu ince şeridin ürünü: dağdan inen serinlikle körfezden gelen ışığın buluştuğu yerden.",
  },
  uretimTitle: { label: "Üretim — başlık", group: "anasayfa", default: "Daldan şişeye dört durak" },
  uretimIntro: {
    label: "Üretim — giriş",
    group: "anasayfa",
    multiline: true,
    default: "Bir zeytinyağını tanımanın en kısa yolu, yolculuğunu bilmek. Bizimki böyle ilerliyor.",
  },
  kunyeTitle: { label: "Künye — başlık", group: "anasayfa", default: "Yağın künyesi" },
  kunyeIntro: {
    label: "Künye — giriş",
    group: "anasayfa",
    multiline: true,
    default: "Ne aldığınızı bilmek hakkınız. Yağımızı tanımlayan bilgileri süslemeden, bir künye sadeliğinde paylaşıyoruz.",
  },
  sofraTitle: { label: "Sofra — başlık", group: "anasayfa", default: "En çok da sofrada anlaşılır" },
  sofraText: {
    label: "Sofra — metin",
    group: "anasayfa",
    multiline: true,
    default:
      "Kahvaltıda bir dilim ekmeğe, salataya, zeytinyağlı bir tencereye ya da ocaktan yeni inmiş çorbanın üstüne… İyi bir zeytinyağı, girdiği tabağın sesini yükseltir.",
  },
  ctaTitle: { label: "Kapanış — başlık", group: "anasayfa", default: "Sofranıza Altınoluk’tan bir şişe" },
  ctaText: {
    label: "Kapanış — metin",
    group: "anasayfa",
    multiline: true,
    default: "Şişeyi ya da tenekeyi seçin; gerisini biz paketleyip yola çıkaralım.",
  },

  // ── Üretim notları (gerçek bilgi; varsayılan boş) ──
  hasatNote: { label: "Hasat — bizde nasıl?", group: "uretim", default: "", multiline: true },
  sikimNote: { label: "Sıkım — bizde nasıl?", group: "uretim", default: "", multiline: true },
  dinlenmeNote: { label: "Dinlenme ve saklama — bizde nasıl?", group: "uretim", default: "", multiline: true },
  dolumNote: { label: "Dolum — bizde nasıl?", group: "uretim", default: "", multiline: true },

  // ── Künye (gerçek bilgi; varsayılan boş) ──
  zeytinCesidi: { label: "Zeytin çeşidi", group: "kunye", default: "" },
  hasatDonemi: { label: "Hasat dönemi", group: "kunye", default: "" },
  sikimYontemi: { label: "Sıkım yöntemi", group: "kunye", default: "" },
  asitlik: { label: "Asitlik (analiz sonucu)", group: "kunye", default: "", help: "Yalnızca analiz raporunuz varsa yazın." },
  tatProfili: { label: "Tat profili", group: "kunye", default: "" },
  belgeler: { label: "Belge ve sertifikalar", group: "kunye", default: "", help: "Yalnızca sahip olduğunuz, ibraz edebileceğiniz belgeleri yazın." },

  // ── Hikâyemiz ──
  storyTitle: { label: "Başlık", group: "hikaye", default: "Bu yağın arkasında bir fabrika değil, bir üretici var" },
  storyLead: {
    label: "Giriş",
    group: "hikaye",
    multiline: true,
    default:
      "Altınoluk’ta zeytinyağı üretiyoruz ve ürettiğimizi araya kimseyi koymadan satıyoruz. Bu site, yağın yola çıktığı yer ile sofranız arasındaki en kısa yol.",
  },
  storyPlace: {
    label: "Yöre anlatısı",
    group: "hikaye",
    multiline: true,
    default:
      "Kazdağı, Altınoluk’un hemen arkasında yükselir; önünde Edremit Körfezi uzanır. Zeytinlikler bu ikisinin arasındaki yamaçlara yayılır. Dağdan inen hava ile denizden gelen ışık, buranın zeytinine kendine özgü bir yer verir.\n\nBiz de bu coğrafyanın içinden konuşuyoruz: yağımızı nerede ürettiğimizi saklamadan, nasıl ürettiğimizi olduğu gibi anlatarak.",
  },
  storyPersonal: {
    label: "Üreticinin kendi hikâyesi",
    group: "hikaye",
    multiline: true,
    default: "",
    help: "Kim olduğunuzu, ne zamandır ürettiğinizi, zeytinliğinizi kendi cümlelerinizle anlatın. Boşken sitede “eklenecek” olarak görünür.",
  },
  storyPromise: {
    label: "Yaklaşım",
    group: "hikaye",
    multiline: true,
    default:
      "Sözümüz basit: yağ hakkında yalnızca bildiğimizi ve belgeleyebildiğimizi söyleriz. Künyede boş gördüğünüz bir satır varsa, o bilgi henüz elimizde kesinleşmediği içindir.",
  },
} as const satisfies Record<string, FieldDef>;

export type ContentKey = keyof typeof FIELDS;
export type Content = Record<ContentKey, string>;

export const CONTENT_KEYS = Object.keys(FIELDS) as ContentKey[];

export function isContentKey(key: string): key is ContentKey {
  return key in FIELDS;
}

export function fieldsInGroup(group: FieldGroup): { key: ContentKey; def: FieldDef }[] {
  return CONTENT_KEYS.filter((k) => FIELDS[k].group === group).map((key) => ({ key, def: FIELDS[key] }));
}
