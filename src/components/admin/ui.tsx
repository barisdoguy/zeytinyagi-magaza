import type { ReactNode } from "react";
import { STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-korfez/75">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 md:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-2xl">{title}</h2>}
      {children}
    </section>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card border-dashed p-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      {children && <div className="mt-2 text-korfez/75">{children}</div>}
    </div>
  );
}

const TONES = {
  neutral: "bg-korfez/10 text-korfez",
  good: "bg-cam/15 text-cam",
  warn: "bg-altin/35 text-korfez",
  bad: "bg-kiremit/15 text-kiremit-koyu",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

const STATUS_TONE: Record<OrderStatus, keyof typeof TONES> = {
  pending_payment: "warn",
  payment_failed: "bad",
  paid: "good",
  preparing: "good",
  shipped: "good",
  delivered: "neutral",
  cancelled: "bad",
  refunded: "bad",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}

/** Dar ekranda yatay kaydırılabilen tablo sarmalayıcısı. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-[0.9375rem] [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-sm [&_th]:font-semibold [&_th]:text-korfez/70 [&_tbody_tr]:border-t [&_tbody_tr]:border-korfez/10">
        {children}
      </table>
    </div>
  );
}
