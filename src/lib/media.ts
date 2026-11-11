import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { dataDir } from "./db/client";

const MAX_BYTES = 5 * 1024 * 1024;
const FILE_PATTERN = /^[a-z0-9-]+\.webp$/;

export const uploadsDir = () => path.join(dataDir(), "uploads");

export function isSafeMediaName(name: string): boolean {
  return FILE_PATTERN.test(name);
}

export type SaveImageResult = { ok: true; file: string } | { ok: false; message: string };

/**
 * Yüklenen görseli doğrular (içeriğine bakarak), en fazla 1600 px'e küçültür
 * ve WebP olarak kaydeder. Özgün dosya saklanmaz.
 */
export async function saveImage(file: File, prefix: string): Promise<SaveImageResult> {
  if (file.size === 0) return { ok: false, message: "Dosya seçilmedi." };
  if (file.size > MAX_BYTES) return { ok: false, message: "Görsel 5 MB'tan büyük olamaz." };
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(input, { failOn: "error" });
    const meta = await image.metadata();
    if (!meta.format || !["jpeg", "png", "webp", "avif"].includes(meta.format))
      return { ok: false, message: "Yalnızca JPEG, PNG, WebP veya AVIF yükleyebilirsiniz." };
    const output = await image
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const name = `${prefix.replace(/[^a-z0-9]+/g, "-")}-${randomBytes(6).toString("hex")}.webp`;
    await fs.mkdir(uploadsDir(), { recursive: true });
    await fs.writeFile(path.join(uploadsDir(), name), output);
    return { ok: true, file: name };
  } catch {
    return { ok: false, message: "Görsel okunamadı. Farklı bir dosya deneyin." };
  }
}

export async function deleteImage(name: string | null | undefined) {
  if (!name || !isSafeMediaName(name)) return;
  await fs.rm(path.join(uploadsDir(), name), { force: true });
}

export const mediaUrl = (name: string) => `/medya/${name}`;
