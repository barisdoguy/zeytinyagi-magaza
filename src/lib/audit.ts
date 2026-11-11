import { getDb, type Db, type Tx } from "./db/client";
import { auditLog } from "./db/schema";

export type AuditActor = { id: number; email: string } | null;

/** Kritik yönetim işlemlerinin kaydı. Parola, belirteç gibi gizli veriler yazılmaz. */
export function recordAudit(
  actor: AuditActor,
  action: string,
  entity = "",
  entityId: string | number = "",
  detail = "",
  db: Db | Tx = getDb(),
) {
  db.insert(auditLog)
    .values({
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? "sistem",
      action,
      entity,
      entityId: String(entityId),
      detail: detail.slice(0, 500),
      createdAt: Date.now(),
    })
    .run();
}
