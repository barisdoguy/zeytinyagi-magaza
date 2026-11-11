import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getEnv } from "../env";
import { can, type Permission } from "./permissions";
import { getSessionUser, SESSION_TTL_MS, type SessionUser } from "./sessions";

export const SESSION_COOKIE = "yonetim_oturum";

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/yonetim",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { path: "/yonetim", maxAge: 0 });
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export const currentUser = cache(async (): Promise<SessionUser | null> => getSessionUser(await sessionToken()));

/** Sayfalar için: oturum yoksa girişe, yetki yoksa panoya yönlendirir. */
export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/yonetim/giris");
  if (permission && !can(user.role, permission)) redirect("/yonetim?yetki=yok");
  return user;
}

/**
 * Server Action'lar için: her işlemde oturum ve yetki yeniden denetlenir.
 * Arayüzde düğmenin gizli olması bir güvenlik önlemi değildir.
 */
export async function authorize(permission: Permission): Promise<SessionUser | null> {
  const user = getSessionUser(await sessionToken());
  if (!user || !can(user.role, permission)) return null;
  return user;
}

export const NOT_ALLOWED = "Bu işlem için yetkiniz yok ya da oturumunuz sona erdi.";
