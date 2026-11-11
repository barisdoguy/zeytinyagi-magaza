import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  DATA_DIR: z.string().min(1).default("./data"),
  APP_SECRET: z.string().optional(),
  SITE_INDEXABLE: z.enum(["true", "false"]).default("false"),
  PAYMENTS_PROVIDER: z.enum(["none", "test", "paytr", "iyzico"]).default("none"),
  PAYMENTS_MODE: z.enum(["test", "live"]).default("test"),
  PAYTR_MERCHANT_ID: z.string().optional(),
  PAYTR_MERCHANT_KEY: z.string().optional(),
  PAYTR_MERCHANT_SALT: z.string().optional(),
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
  IYZICO_BASE_URL: z.string().optional(),
  GA4_MEASUREMENT_ID: z.string().optional(),
  META_PIXEL_ID: z.string().optional(),
});

export type Env = Omit<z.infer<typeof schema>, "APP_SECRET"> & { APP_SECRET: string };

const DEV_SECRET = "yalnizca-gelistirme-icin-gizli-anahtar-degistirin";
let cached: Env | null = null;

/** Boş bırakılmış değişkenleri "tanımsız" say. */
function clean(source: NodeJS.ProcessEnv) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string" && value.trim() !== "") out[key] = value.trim();
  }
  return out;
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(clean(process.env));
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Ortam değişkenleri geçersiz — ${detail}`);
  }
  const env = parsed.data;
  const building = process.env.NEXT_PHASE === "phase-production-build";
  let secret = env.APP_SECRET;
  if (env.NODE_ENV === "production" && !building) {
    if (!secret || secret.length < 32) {
      throw new Error("APP_SECRET canlı ortamda zorunludur ve en az 32 karakter olmalıdır.");
    }
  }
  if (!secret) secret = DEV_SECRET;
  cached = { ...env, SITE_URL: env.SITE_URL.replace(/\/+$/, ""), APP_SECRET: secret };
  return cached;
}
