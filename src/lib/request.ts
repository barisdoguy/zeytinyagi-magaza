import { headers } from "next/headers";

/** İstemci IP'si (ters vekil arkasında x-forwarded-for'un ilk değeri). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "0.0.0.0";
}
