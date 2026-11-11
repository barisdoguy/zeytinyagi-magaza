import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSite } from "@/lib/site";

// Derleme anında değil, her istekte güncel ayar ve veriyle üretilir.
export const dynamic = "force-dynamic";

export const alt = "Zeytin dalından süzülen bir damla zeytinyağı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFonts() {
  const dir = path.join(process.cwd(), "node_modules/@fontsource/fraunces/files");
  try {
    const [latin, latinExt] = await Promise.all([
      fs.readFile(path.join(dir, "fraunces-latin-600-normal.woff")),
      fs.readFile(path.join(dir, "fraunces-latin-ext-600-normal.woff")),
    ]);
    return [
      { name: "Fraunces", data: latin, weight: 600 as const, style: "normal" as const },
      { name: "Fraunces", data: latinExt, weight: 600 as const, style: "normal" as const },
    ];
  } catch {
    return undefined;
  }
}

export default async function OpengraphImage() {
  const { content } = getSite();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#12263a", color: "#f3ede0", padding: 72, fontFamily: "Fraunces" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ fontSize: 30, color: "#e0a526", letterSpacing: 4 }}>{content.region.toLocaleUpperCase("tr-TR")}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, lineHeight: 1.05 }}>{content.brandName}</div>
            <div style={{ fontSize: 38, marginTop: 20, color: "#e0a526" }}>{content.tagline}</div>
          </div>
        </div>
        <svg width="300" height="486" viewBox="0 0 200 324" style={{ alignSelf: "center" }}>
          <path d="M100 10c56 78 92 132 92 188a92 92 0 1 1-184 0C8 142 44 88 100 10z" fill="#e0a526" />
          <path d="M52 206a50 50 0 0 0 36 46" fill="none" stroke="#f3ede0" strokeWidth="11" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size, fonts: await loadFonts() },
  );
}
