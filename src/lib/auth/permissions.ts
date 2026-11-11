export type Role = "admin" | "staff";

export const PERMISSIONS = [
  "products",
  "orders",
  "messages",
  "content",
  "settings",
  "coupons",
  "users",
  "audit",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Personel yalnızca günlük işleri görür; ayar, kampanya, kullanıcı ve kayıtlar yöneticiye aittir. */
const STAFF: readonly Permission[] = ["products", "orders", "messages"];

export function can(role: Role, permission: Permission): boolean {
  return role === "admin" || STAFF.includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = { admin: "Yönetici", staff: "Personel" };
