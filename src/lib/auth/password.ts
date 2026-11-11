import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LENGTH = 64;
export const MIN_PASSWORD_LENGTH = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Parola en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  if (password.length > 200) return "Parola çok uzun.";
  return null;
}
