"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const FormStateContext = createContext<FormState>(null);

/**
 * Server Action'a bağlı form: gönderim sırasında bekleme durumu, ardından
 * başarı ya da hata mesajı gösterir; hata hâlinde alanları geri doldurur.
 */
export function ActionForm({
  action,
  children,
  className,
  messagePosition = "bottom",
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  messagePosition?: "top" | "bottom" | "none";
}) {
  const [state, formAction] = useActionState(action, null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state && !state.ok) messageRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state]);

  const message =
    state?.message && messagePosition !== "none" ? (
      <p
        ref={messageRef}
        role={state.ok ? "status" : "alert"}
        className={`rounded-xl px-4 py-3 text-[0.9375rem] font-semibold ${
          state.ok ? "bg-cam/10 text-cam" : "bg-kiremit/10 text-kiremit-koyu"
        }`}
      >
        {state.message}
      </p>
    ) : null;

  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={className} noValidate>
        {messagePosition === "top" && message}
        {children}
        {messagePosition === "bottom" && message}
      </form>
    </FormStateContext.Provider>
  );
}

export function useFormState(): FormState {
  return useContext(FormStateContext);
}

export function SubmitButton({
  children,
  pendingLabel = "Gönderiliyor…",
  className = "btn btn-primary",
  disabled = false,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending} name={name} value={value}>
      {pending ? pendingLabel : children}
    </button>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  help?: string;
  multiline?: boolean;
  rows?: number;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  placeholder?: string;
  className?: string;
  maxLength?: number;
  /** Aynı sayfada aynı adlı alan birden çok formda geçiyorsa kimlikleri ayırmak için. */
  idPrefix?: string;
};

export function Field({ name, label, type = "text", defaultValue = "", required, help, multiline, rows = 4, className = "", idPrefix = "", ...rest }: FieldProps) {
  const id = idPrefix + name;
  const state = useFormState();
  const error = state?.fieldErrors?.[name];
  const value = state && !state.ok && state.values?.[name] !== undefined ? state.values[name] : defaultValue;
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    defaultValue: value,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: "field-input",
    ...rest,
  };
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && (
          <span className="text-kiremit-koyu" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {multiline ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
      {help && (
        <p id={`${id}-help`} className="field-help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ name, children, defaultChecked }: { name: string; children: ReactNode; defaultChecked?: boolean }) {
  const state = useFormState();
  const error = state?.fieldErrors?.[name];
  const checked = state && !state.ok && state.values ? state.values[name] === "on" : defaultChecked;
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          aria-invalid={error ? true : undefined}
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-kiremit)]"
        />
        <span className="text-[0.9375rem]">{children}</span>
      </label>
      {error && <p className="field-error ml-8">{error}</p>}
    </div>
  );
}
