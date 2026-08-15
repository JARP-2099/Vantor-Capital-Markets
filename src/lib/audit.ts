import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

type AuditEntry = {
  actorUserId: string | null;
  /** Dot-separated action, e.g. "company.submitted". */
  action: string;
  entityType: "company" | "user" | "role";
  entityId: string;
  /** Small, non-sensitive context only. Never secrets, tokens, or passwords. */
  metadata?: Record<string, unknown>;
};

/**
 * Append an audit record. Audit failures are logged but never abort the
 * user-facing action they describe.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to record", entry.action, err);
  }
}
