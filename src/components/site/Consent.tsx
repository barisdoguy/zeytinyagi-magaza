"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const COOKIE = "cerez_tercihi";
const OPEN_EVENT = "cerez-tercihleri-ac";
type Choice = { analytics: boolean; marketing: boolean };
type Tracking = { ga4: string | null; metaPixel: string | null };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void };
    __izlemeYuklendi?: { ga4?: boolean; meta?: boolean };
  }
}

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
/** Çerezin ham değeri; "" = henüz tercih yapılmamış. */
function readRaw(): string {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  return match ? match.slice(COOKIE.length + 1) : "";
}

function parseChoice(raw: string | null): Choice | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw));
    return { analytics: value.a === 1, marketing: value.m === 1 };
  } catch {
    return null;
  }
}

function writeChoice(choice: Choice) {
  const value = encodeURIComponent(JSON.stringify({ a: choice.analytics ? 1 : 0, m: choice.marketing ? 1 : 0, t: Date.now() }));
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
  listeners.forEach((listener) => listener());
}

function loadScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** İzin verilmeden hiçbir izleme betiği yüklenmez; kimlik tanımlı değilse hiç yüklenmez. */
function applyChoice(choice: Choice, tracking: Tracking) {
  const loaded = (window.__izlemeYuklendi ??= {});
  if (tracking.ga4 && choice.analytics && !loaded.ga4) {
    loaded.ga4 = true;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- gtag "arguments" nesnesini bekler
      window.dataLayer!.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: choice.marketing ? "granted" : "denied",
      ad_user_data: choice.marketing ? "granted" : "denied",
      ad_personalization: choice.marketing ? "granted" : "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", tracking.ga4);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tracking.ga4)}`);
  }
  if (tracking.metaPixel && choice.marketing && !loaded.meta) {
    loaded.meta = true;
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as NonNullable<Window["fbq"]> & { queue: unknown[] };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", tracking.metaPixel);
    fbq("track", "PageView");
  }
}

/** İzin verilmişse dönüşüm olayı gönderir; verilmemişse hiçbir şey yapmaz. */
export function trackPurchase(order: { number: string; totalKurus: number }) {
  const value = order.totalKurus / 100;
  window.gtag?.("event", "purchase", { transaction_id: order.number, value, currency: "TRY" });
  window.fbq?.("track", "Purchase", { value, currency: "TRY" });
}

export function ConsentLink() {
  return (
    <button type="button" className="text-left hover:underline" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Çerez tercihleri
    </button>
  );
}

export function Consent({ tracking }: { tracking: Tracking }) {
  const hasTracking = Boolean(tracking.ga4 || tracking.metaPixel);
  // Sunucuda ve ilk çizimde null: tercih bilinene kadar hiçbir şey gösterilmez.
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const saved = parseChoice(raw);
  const [panel, setPanel] = useState<"closed" | "settings" | null>(null);
  const [draft, setDraft] = useState<Choice>({ analytics: false, marketing: false });
  const view: "hidden" | "banner" | "settings" =
    panel === "settings" ? "settings" : panel === "closed" || raw === null || saved || !hasTracking ? "hidden" : "banner";

  useEffect(() => {
    const current = parseChoice(readRaw());
    if (current) applyChoice(current, tracking);
    const open = () => {
      setDraft(parseChoice(readRaw()) ?? { analytics: false, marketing: false });
      setPanel("settings");
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [tracking]);

  const decide = (choice: Choice) => {
    const previous = parseChoice(readRaw());
    writeChoice(choice);
    setPanel("closed");
    // İzin geri alındıysa, yüklenmiş betikleri durdurmanın güvenilir yolu sayfayı yenilemektir.
    if (previous && ((previous.analytics && !choice.analytics) || (previous.marketing && !choice.marketing))) {
      window.location.reload();
      return;
    }
    applyChoice(choice, tracking);
  };

  if (view === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cerez-baslik"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-korfez/15 bg-[#fffdf8] p-5 text-korfez shadow-2xl md:p-6"
    >
      <h2 id="cerez-baslik" className="text-xl">Çerez tercihleri</h2>
      <p className="mt-2 text-[0.9375rem]">
        Sepetinizi hatırlamak gibi zorunlu çerezler her zaman çalışır.
        {hasTracking
          ? " Ölçümleme ve pazarlama çerezlerini yalnızca siz izin verirseniz kullanırız."
          : " Bu sitede şu anda ölçümleme ya da pazarlama çerezi kullanılmıyor."}{" "}
        <Link href="/cerez-politikasi" className="font-semibold underline">Çerez politikası</Link>
      </p>

      {view === "settings" && hasTracking && (
        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">Çerez türleri</legend>
          <label className="flex items-start gap-3 opacity-70">
            <input type="checkbox" checked disabled className="mt-1 h-5 w-5" />
            <span><strong>Zorunlu</strong> — sepet, kupon ve bu tercihin kendisi.</span>
          </label>
          {tracking.ga4 && (
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-kiremit)]" checked={draft.analytics} onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })} />
              <span><strong>Ölçümleme</strong> — sitenin nasıl kullanıldığını anlamamıza yardım eder.</span>
            </label>
          )}
          {tracking.metaPixel && (
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-kiremit)]" checked={draft.marketing} onChange={(e) => setDraft({ ...draft, marketing: e.target.checked })} />
              <span><strong>Pazarlama</strong> — reklamlarımızın etkisini ölçmemize yardım eder.</span>
            </label>
          )}
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {hasTracking ? (
          <>
            <button type="button" className="btn btn-sm btn-dark" onClick={() => decide({ analytics: false, marketing: false })}>Tümünü reddet</button>
            <button type="button" className="btn btn-sm btn-dark" onClick={() => decide({ analytics: Boolean(tracking.ga4), marketing: Boolean(tracking.metaPixel) })}>Tümünü kabul et</button>
            {view === "banner" ? (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setPanel("settings")}>Tercihleri ayarla</button>
            ) : (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => decide(draft)}>Seçimimi kaydet</button>
            )}
          </>
        ) : (
          <button type="button" className="btn btn-sm btn-dark" onClick={() => setPanel("closed")}>Kapat</button>
        )}
      </div>
    </div>
  );
}
