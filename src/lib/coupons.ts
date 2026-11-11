import type { CouponRule } from "./pricing";
import { discountFor } from "./pricing";
import { formatTl } from "./money";

export type CouponRecord = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotalKurus: number;
  startsAt: number | null;
  endsAt: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
};

export type CouponCheck =
  | { ok: true; rule: CouponRule; discountKurus: number }
  | { ok: false; reason: string };

export function normalizeCouponCode(code: string): string {
  return code.trim().toLocaleUpperCase("tr-TR").replace(/\s+/g, "");
}

/** Kuponun şu an, bu ara toplam için geçerli olup olmadığını denetler. */
export function checkCoupon(
  coupon: CouponRecord | null | undefined,
  subtotalKurus: number,
  now: number = Date.now(),
): CouponCheck {
  if (!coupon || !coupon.active) return { ok: false, reason: "Bu kupon kodu geçerli değil." };
  if (coupon.startsAt != null && now < coupon.startsAt)
    return { ok: false, reason: "Bu kuponun geçerlilik süresi henüz başlamadı." };
  if (coupon.endsAt != null && now > coupon.endsAt)
    return { ok: false, reason: "Bu kuponun süresi dolmuş." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
    return { ok: false, reason: "Bu kuponun kullanım hakkı dolmuş." };
  if (subtotalKurus < coupon.minSubtotalKurus)
    return {
      ok: false,
      reason: `Bu kupon ${formatTl(coupon.minSubtotalKurus)} ve üzeri sepetlerde geçerli.`,
    };
  const rule: CouponRule = { type: coupon.type, value: coupon.value };
  const discountKurus = discountFor(subtotalKurus, rule);
  if (discountKurus <= 0) return { ok: false, reason: "Bu kupon bu sepete uygulanamıyor." };
  return { ok: true, rule, discountKurus };
}
