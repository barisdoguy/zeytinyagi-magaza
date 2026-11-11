import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

/** Barındırma platformunun sağlık denetimi için. */
export function GET() {
  try {
    getDb().run(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
