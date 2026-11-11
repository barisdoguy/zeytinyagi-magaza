import { processNotification } from "@/lib/payments";

/**
 * Ödeme sağlayıcısının sunucudan sunucuya bildirimi.
 * İmza doğrulanmadan hiçbir sipariş güncellenmez; yinelenen bildirimler
 * ikinci kez işlenmez (lib/orders/service.ts → applyPaymentEvent).
 */
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const rawBody = await request.text();
  if (rawBody.length > 64_000) return new Response("Payload too large", { status: 413 });
  const result = processNotification(provider, rawBody, request.headers);
  return new Response(result.body, { status: result.status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
