const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
});

/** Kuruş cinsinden tutarı "1.249,90 ₺" biçiminde yazar. */
export function formatTl(kurus: number): string {
  return formatter.format(kurus / 100);
}

/**
 * "149,90", "149.90", "1.249,90" veya "149" gibi girişleri kuruşa çevirir.
 * Geçersiz ya da negatif girişte null döner.
 */
export function parseTlToKurus(input: string | null | undefined): number | null {
  if (input == null) return null;
  let text = input.replace(/[₺\s]|TL/gi, "");
  if (text === "") return null;
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const value = Math.round(Number(text) * 100);
  return Number.isSafeInteger(value) ? value : null;
}

/** Kuruşu form alanında gösterilecek "149,90" biçimine çevirir. */
export function kurusToInput(kurus: number | null | undefined): string {
  if (kurus == null) return "";
  return (kurus / 100).toFixed(2).replace(".", ",");
}
