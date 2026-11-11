import { timingSafeEqual } from "node:crypto";
import { getOrderByNumber } from "./service";

/** Müşterinin kendi siparişine erişimi: sipariş numarası + gizli belirteç. */
export function findOrderForCustomer(number: string, token: string) {
  if (!/^[A-Z0-9]{6,20}$/.test(number) || !token) return null;
  const order = getOrderByNumber(number);
  if (!order) return null;
  const a = Buffer.from(order.accessToken);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b) ? order : null;
}
