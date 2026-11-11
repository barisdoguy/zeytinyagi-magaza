import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getEnv } from "../env";
import * as schema from "./schema";
import { seed } from "./seed";

export type Db = BetterSQLite3Database<typeof schema>;
/** Transaction içinde de aynı sorgu arayüzü kullanılır. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { __magazaDb?: Db };

export function dataDir(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), getEnv().DATA_DIR);
}

export function getDb(): Db {
  if (globalForDb.__magazaDb) return globalForDb.__magazaDb;
  const dir = dataDir();
  fs.mkdirSync(path.join(dir, "uploads"), { recursive: true });
  const sqlite = new Database(path.join(dir, "magaza.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.resolve(/* turbopackIgnore: true */ process.cwd(), "drizzle") });
  seed(db);
  globalForDb.__magazaDb = db;
  return db;
}
