export const ORDER_STATUSES = [
  "pending_payment",
  "payment_failed",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Ödeme bekleniyor",
  payment_failed: "Ödeme başarısız",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["paid", "payment_failed", "cancelled"],
  payment_failed: ["paid", "cancelled"],
  paid: ["preparing", "cancelled", "refunded"],
  preparing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

/** "Ödendi" ve "Ödeme başarısız" yalnızca ödeme bildirimiyle atanır; panelden elle atanamaz. */
const PAYMENT_ONLY: readonly OrderStatus[] = ["paid", "payment_failed"];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function manualTransitions(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from].filter((s) => !PAYMENT_ONLY.includes(s));
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
