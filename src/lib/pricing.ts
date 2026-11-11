export type CouponRule = { type: "percent" | "fixed"; value: number };

export type TotalsInput = {
  lines: { unitPriceKurus: number; quantity: number }[];
  /** Sabit kargo ücreti (kuruş). */
  shippingFeeKurus: number;
  /** Bu tutarın üzerindeki sepetlerde kargo ücretsiz (kuruş); yoksa null. */
  freeShippingThresholdKurus: number | null;
  coupon?: CouponRule | null;
};

export type Totals = {
  subtotalKurus: number;
  discountKurus: number;
  shippingKurus: number;
  totalKurus: number;
};

export function discountFor(subtotalKurus: number, coupon: CouponRule | null | undefined): number {
  if (!coupon) return 0;
  const raw =
    coupon.type === "percent"
      ? Math.floor((subtotalKurus * Math.min(Math.max(coupon.value, 0), 100)) / 100)
      : Math.max(coupon.value, 0);
  return Math.min(raw, subtotalKurus);
}

/** Tüm tutarlar yalnızca burada hesaplanır; istemciden gelen tutara güvenilmez. */
export function computeTotals(input: TotalsInput): Totals {
  const subtotalKurus = input.lines.reduce((sum, l) => sum + l.unitPriceKurus * l.quantity, 0);
  const discountKurus = discountFor(subtotalKurus, input.coupon);
  const afterDiscount = subtotalKurus - discountKurus;
  const free =
    input.freeShippingThresholdKurus != null && afterDiscount >= input.freeShippingThresholdKurus;
  const shippingKurus = input.lines.length === 0 || free ? 0 : input.shippingFeeKurus;
  return { subtotalKurus, discountKurus, shippingKurus, totalKurus: afterDiscount + shippingKurus };
}
