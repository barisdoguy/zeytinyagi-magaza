const TZ = "Europe/Istanbul";
const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });
const dateOnly = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: TZ });
const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

export const formatDateTime = (ms: number) => dateTime.format(new Date(ms));
export const formatDate = (ms: number) => dateOnly.format(new Date(ms));
/** <input type="date"> için YYYY-AA-GG (Türkiye saatiyle). */
export const toDateInput = (ms: number | null) => (ms == null ? "" : isoDate.format(new Date(ms)));

/** Türkiye saatiyle günün başı ya da sonu. Geçersiz girişte undefined, boşta null. */
export function parseDateInput(value: string, edge: "start" | "end"): number | null | undefined {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const ms = Date.parse(`${value}T${edge === "start" ? "00:00:00" : "23:59:59"}+03:00`);
  return Number.isNaN(ms) ? undefined : ms;
}
