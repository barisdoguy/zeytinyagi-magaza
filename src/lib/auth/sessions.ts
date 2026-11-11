import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "../db/client";
import { loginAttempts, sessions, users, type User } from "../db/schema";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

export function createSession(userId: number, now = Date.now()): string {
  const token = randomBytes(32).toString("base64url");
  const db = getDb();
  db.delete(sessions).where(lt(sessions.expiresAt, now)).run();
  db.insert(sessions)
    .values({ tokenHash: sha256(token), userId, expiresAt: now + SESSION_TTL_MS, createdAt: now })
    .run();
  return token;
}

export function getSessionUser(token: string | undefined, now = Date.now()): SessionUser | null {
  if (!token) return null;
  const row = getDb()
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, now)))
    .get();
  if (!row || !row.active) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function destroySession(token: string | undefined) {
  if (!token) return;
  getDb().delete(sessions).where(eq(sessions.tokenHash, sha256(token))).run();
}

export function destroyUserSessions(userId: number) {
  getDb().delete(sessions).where(eq(sessions.userId, userId)).run();
}

export type LoginResult =
  | { ok: true; user: SessionUser; token: string }
  | { ok: false; reason: "invalid" | "locked" };

// Var olmayan hesapta da parola doğrulama süresi harcansın diye sahte özet.
let dummyHash: Promise<string> | null = null;

export async function login(emailInput: string, password: string, ip: string, now = Date.now()): Promise<LoginResult> {
  const db = getDb();
  const email = emailInput.trim().toLowerCase();
  const key = `${email}|${ip}`;
  db.delete(loginAttempts).where(lt(loginAttempts.createdAt, now - ATTEMPT_WINDOW_MS)).run();
  const recent = db.select({ id: loginAttempts.id }).from(loginAttempts).where(eq(loginAttempts.key, key)).all();
  if (recent.length >= MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  const user = db.select().from(users).where(eq(users.email, email)).get();
  dummyHash ??= hashPassword("yer-tutucu-parola");
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !user.active || !valid) {
    db.insert(loginAttempts).values({ key, createdAt: now }).run();
    return { ok: false, reason: "invalid" };
  }
  db.delete(loginAttempts).where(eq(loginAttempts.key, key)).run();
  const token = createSession(user.id, now);
  return { ok: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
