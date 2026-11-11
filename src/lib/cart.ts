import { cookies } from "next/headers";
import { cache } from "react";
import { buildCart, parseCartCookie, type CartItem, type CartView } from "./cart-core";
import { getDb } from "./db/client";
import { getEnv } from "./env";

const CART_COOKIE = "sepet";
const COUPON_COOKIE = "kupon";
const MAX_AGE = 60 * 60 * 24 * 30;

const options = () => ({
  httpOnly: true,
  secure: getEnv().NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
});

export async function readCartItems(): Promise<CartItem[]> {
  return parseCartCookie((await cookies()).get(CART_COOKIE)?.value);
}

export async function writeCartItems(items: CartItem[]) {
  const jar = await cookies();
  if (items.length === 0) jar.set(CART_COOKIE, "", { path: "/", maxAge: 0 });
  else jar.set(CART_COOKIE, JSON.stringify(items), options());
}

export async function readCouponCode(): Promise<string | null> {
  return (await cookies()).get(COUPON_COOKIE)?.value?.slice(0, 40) || null;
}

export async function writeCouponCode(code: string | null) {
  const jar = await cookies();
  if (!code) jar.set(COUPON_COOKIE, "", { path: "/", maxAge: 0 });
  else jar.set(COUPON_COOKIE, code, options());
}

export const getCartView = cache(async (): Promise<CartView> => {
  return buildCart(getDb(), await readCartItems(), await readCouponCode());
});

export async function cartCount(): Promise<number> {
  return (await readCartItems()).reduce((sum, item) => sum + item.q, 0);
}
