import type { Order, OrderItem } from "../db/schema";
import type { PaymentNotification } from "../orders/service";

export type ProviderId = "test" | "paytr" | "iyzico";

/** Ödeme adımında müşteriye ne gösterileceği. Kart verisi hiçbir durumda bu uygulamadan geçmez. */
export type CheckoutSession =
  | { kind: "iframe"; url: string }
  | { kind: "redirect"; url: string }
  | { kind: "test" };

export type CheckoutContext = {
  siteUrl: string;
  ip: string;
  okUrl: string;
  failUrl: string;
  testMode: boolean;
};

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: "not_configured" | "invalid_signature" | "invalid_payload" | "provider_error",
  ) {
    super(message);
  }
}

export interface PaymentProvider {
  readonly id: ProviderId;
  readonly label: string;
  /** Eksik yapılandırma kalemleri; boş dizi "hazır" demektir. */
  missingConfig(): string[];
  createCheckout(order: Order, items: OrderItem[], ctx: CheckoutContext): Promise<CheckoutSession>;
  /** İmzayı doğrular ve bildirimi ayrıştırır; doğrulanamazsa PaymentError fırlatır. */
  parseNotification(rawBody: string, headers: Headers): Omit<PaymentNotification, "provider">;
  /** Sağlayıcının bildirime karşılık beklediği yanıt gövdesi. */
  readonly ackBody: string;
}
