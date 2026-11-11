import fs from "node:fs/promises";
import path from "node:path";
import { isSafeMediaName, uploadsDir } from "@/lib/media";

/** Panelden yüklenen görselleri sunar. Dosya adı rastgele olduğu için uzun süre önbelleklenir. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!isSafeMediaName(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(uploadsDir(), file));
    return new Response(new Uint8Array(data), {
      headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
