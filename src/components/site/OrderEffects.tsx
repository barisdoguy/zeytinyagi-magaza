"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { clearCartAfterPayment } from "@/app/(site)/actions";
import { trackPurchase } from "./Consent";

/**
 * Sipariş sayfası yan etkileri: ödeme onaylandıysa sepeti temizler ve (izin
 * verilmişse) dönüşüm olayını bir kez gönderir; ödeme henüz doğrulanmadıysa
 * sayfayı birkaç kez yeniler.
 */
export function OrderEffects({ number, token, paid, totalKurus }: { number: string; token: string; paid: boolean; totalKurus: number }) {
  const router = useRouter();
  const tries = useRef(0);

  useEffect(() => {
    if (paid) {
      void clearCartAfterPayment(number, token).then(() => router.refresh());
      const key = `siparis-olay-${number}`;
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          trackPurchase({ number, totalKurus });
        }
      } catch {
        /* depolama kapalıysa olay gönderilmez */
      }
      return;
    }
    const timer = window.setInterval(() => {
      if (++tries.current > 8) window.clearInterval(timer);
      else router.refresh();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [paid, number, token, totalKurus, router]);

  return null;
}
