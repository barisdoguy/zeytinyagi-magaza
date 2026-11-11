import { desc } from "drizzle-orm";
import { Badge, Empty, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { contactMessages } from "@/lib/db/schema";
import { setMessageHandled } from "../../actions";

export const metadata = { title: "Mesajlar" };

export default async function MessagesPage() {
  await requireUser("messages");
  const rows = getDb().select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200).all();
  return (
    <>
      <PageHeader title="Mesajlar" description="İletişim formundan gelen mesajlar. Yanıtlar buradan gönderilmez; müşteriye kendi e-posta adresinizden dönün." />
      {rows.length === 0 ? (
        <Empty title="Henüz mesaj yok">İletişim formundan gelen mesajlar burada görünür.</Empty>
      ) : (
        <ul className="space-y-4">
          {rows.map((m) => (
            <li key={m.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{m.name} · <a href={`mailto:${m.email}`} className="underline underline-offset-4">{m.email}</a></p>
                <span className="flex items-center gap-3 text-sm text-korfez/70">
                  {formatDateTime(m.createdAt)}
                  {m.handled ? <Badge>Yanıtlandı</Badge> : <Badge tone="warn">Yeni</Badge>}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line">{m.message}</p>
              <form action={setMessageHandled} className="mt-3">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="handled" value={m.handled ? "0" : "1"} />
                <button type="submit" className="text-sm font-semibold underline underline-offset-4">{m.handled ? "Yeni olarak işaretle" : "Yanıtlandı olarak işaretle"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
