import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { pages, type Page } from "./db/schema";

export function getPage(slug: string): Page | null {
  return getDb().select().from(pages).where(eq(pages.slug, slug)).get() ?? null;
}

export function listPages(): Page[] {
  return getDb().select().from(pages).all();
}
