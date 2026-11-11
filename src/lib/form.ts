/** Server Action'ların form bileşenlerine döndürdüğü durum. */
export type FormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  /** Hata durumunda alanların yeniden doldurulması için gönderilen değerler. */
  values?: Record<string, string>;
} | null;

export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !/parola|password/i.test(key)) out[key] = value;
  }
  return out;
}

export function fail(message: string, formData?: FormData, fieldErrors?: Record<string, string>): FormState {
  return { ok: false, message, fieldErrors, values: formData ? formValues(formData) : undefined };
}

export function ok(message: string): FormState {
  return { ok: true, message };
}

export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
