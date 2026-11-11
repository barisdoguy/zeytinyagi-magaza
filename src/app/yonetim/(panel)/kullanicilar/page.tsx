import { asc } from "drizzle-orm";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { requireUser } from "@/lib/auth/guard";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { createUser, resetUserPassword, setUserActive } from "../../actions";

export const metadata = { title: "Kullanıcılar" };

export default async function UsersPage() {
  const me = await requireUser("users");
  const rows = getDb().select().from(users).orderBy(asc(users.createdAt)).all();
  return (
    <>
      <PageHeader title="Kullanıcılar" description="Yönetici her şeye erişir. Personel yalnızca siparişleri, ürün–stok bilgilerini ve mesajları görür; ayarlara, kuponlara, kullanıcılara ve kayıtlara erişemez." />
      <div className="space-y-6">
        <Panel title="Hesaplar">
          <ul className="divide-y divide-korfez/10">
            {rows.map((u) => (
              <li key={u.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{u.name} {u.id === me.id && <span className="text-sm font-normal text-korfez/70">(siz)</span>}</p>
                    <p className="text-sm text-korfez/70">{u.email} · {formatDate(u.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={u.role === "admin" ? "good" : "neutral"}>{ROLE_LABELS[u.role]}</Badge>
                    {!u.active && <Badge tone="bad">Kapalı</Badge>}
                    {u.id !== me.id && (
                      <form action={setUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                        <button type="submit" className="text-sm font-semibold underline underline-offset-4">{u.active ? "Hesabı kapat" : "Hesabı aç"}</button>
                      </form>
                    )}
                  </div>
                </div>
                {u.id !== me.id && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-semibold">Parolayı sıfırla</summary>
                    <ActionForm action={resetUserPassword} className="mt-3 flex flex-wrap items-end gap-3">
                      <input type="hidden" name="id" value={u.id} />
                      <Field idPrefix={`u${u.id}-`} name="parola" label="Yeni parola" type="password" autoComplete="new-password" />
                      <SubmitButton className="btn btn-sm btn-dark" pendingLabel="…">Parolayı güncelle</SubmitButton>
                    </ActionForm>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Yeni kullanıcı">
          <ActionForm action={createUser} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field name="name" label="Ad soyad" required />
              <Field name="email" label="E-posta" type="email" required autoComplete="off" />
              <Field name="parola" label="Parola" type="password" required autoComplete="new-password" help="En az 10 karakter. Kullanıcıya güvenli bir yoldan iletin." />
              <div>
                <label htmlFor="role" className="field-label">Rol</label>
                <select id="role" name="role" className="field-input" defaultValue="staff">
                  <option value="staff">Personel</option>
                  <option value="admin">Yönetici</option>
                </select>
              </div>
            </div>
            <SubmitButton className="btn btn-dark" pendingLabel="Ekleniyor…">Kullanıcı ekle</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
