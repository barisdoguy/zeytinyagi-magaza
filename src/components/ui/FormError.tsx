"use client";

import { useFormState } from "./ActionForm";

/** Form mesajını formun içinde belirli bir yerde göstermek için. */
export function FormError() {
  const state = useFormState();
  if (!state?.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`mt-5 rounded-xl px-4 py-3 text-[0.9375rem] font-semibold ${state.ok ? "bg-cam/10 text-cam" : "bg-kiremit/10 text-kiremit-koyu"}`}>
      {state.message}
    </p>
  );
}
