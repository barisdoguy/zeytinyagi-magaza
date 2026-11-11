"use client";

import { useEffect, useRef, useState } from "react";
import { BranchArt } from "../art/BranchArt";

type NavigatorHints = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

/**
 * Hero görseli. Her zaman önce SVG illüstrasyon çizilir (yedek görünüm).
 * 3D sahne yalnızca geniş ekranda, yeterli cihazda, "hareketi azalt" ve veri
 * tasarrufu kapalıyken, sayfa boşa çıkınca yüklenir.
 */
export function HeroVisual() {
  const mount = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const nav = navigator as NavigatorHints;
    const skip =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 767px)").matches ||
      nav.connection?.saveData === true ||
      (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
      (nav.hardwareConcurrency ?? 8) < 4;
    if (skip) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;
    const start = () => {
      import("./branch-scene")
        .then((m) => {
          if (!cancelled) dispose = m.mountBranchScene(el, () => setReady(true));
        })
        .catch(() => {
          /* 3D yüklenemezse illüstrasyon kalır */
        });
    };
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(start, { timeout: 2000 }) : window.setTimeout(start, 400);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      dispose?.();
    };
  }, []);

  return (
    <div className="relative aspect-[6/5] w-full">
      <BranchArt className={`h-full w-full transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} />
      <div ref={mount} aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
