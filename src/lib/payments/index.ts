import { getDb } from "../db/client";
import { getEnv } from "../env";
import { applyPaymentEvent, type PaymentEventResult } from "../orders/service";
import { iyzicoProvider } from "./iyzico";
import { paytrProvider } from "./paytr";
import { testProvider } from "./test-provider";
import { PaymentError, type PaymentProvider, type ProviderId } from "./types";

const PROVIDERS: Record<ProviderId, PaymentProvider> = {
  test: testProvider,
  paytr: paytrProvider,
  iyzico: iyzicoProvider,
};

export type PaymentState = {
  /** Müşteri şu an çevrimiçi ödeme yapabilir mi? */
  available: boolean;
  provider: PaymentProvider | null;
  /** Gerçek tahsilat yapılmıyor (deneme sağlayıcısı ya da sağlayıcının test modu). */
  isTest: boolean;
  mode: "test" | "live";
  /** available=false ise nedeni (yönetim paneli için). */
  reason: string | null;
};

export function getPaymentState(): PaymentState {
  const env = getEnv();
  const mode = env.PAYMENTS_MODE;
  if (env.PAYMENTS_PROVIDER === "none")
    return { available: false, provider: null, isTest: false, mode, reason: "Ödeme sağlayıcısı seçilmedi (PAYMENTS_PROVIDER=none)." };

  const provider = PROVIDERS[env.PAYMENTS_PROVIDER];
  if (provider.id === "test" && mode === "live")
    return { available: false, provider: null, isTest: false, mode, reason: "Canlı modda deneme sağlayıcısı kullanılamaz; gerçek bir sağlayıcı bağlayın." };

  const missing = provider.missingConfig();
  if (missing.length > 0)
    return { available: false, provider, isTest: mode === "test", mode, reason: `Eksik yapılandırma: ${missing.join(", ")}` };

  return { available: true, provider, isTest: provider.id === "test" || mode === "test", mode, reason: null };
}

export type NotificationResponse = { status: number; body: string; result?: PaymentEventResult };

/**
 * Sağlayıcıdan gelen bildirimi işler. Hem webhook rotası hem de deneme
 * sağlayıcısının "ödemeyi simüle et" düğmesi bu tek yolu kullanır.
 */
export function processNotification(providerId: string, rawBody: string, headers: Headers): NotificationResponse {
  const state = getPaymentState();
  if (!state.available || !state.provider || state.provider.id !== providerId) return { status: 404, body: "Not found" };

  try {
    const parsed = state.provider.parseNotification(rawBody, headers);
    const result = applyPaymentEvent(getDb(), { ...parsed, provider: state.provider.id });
    // Yinelenen ya da uygulanamayan bildirimlerde de onay dönülür; aksi hâlde
    // sağlayıcı aynı bildirimi tekrar tekrar gönderir. Ayrıntı kayıtlara yazılır.
    return { status: 200, body: state.provider.ackBody, result };
  } catch (error) {
    if (error instanceof PaymentError) {
      return { status: error.code === "invalid_signature" ? 401 : 400, body: "Rejected" };
    }
    throw error;
  }
}

export { PaymentError };
