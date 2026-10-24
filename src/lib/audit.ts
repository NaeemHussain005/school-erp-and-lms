import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export const AUDIT_VIEWER_ROLES = ["super_admin", "school_admin", "principal"];

export function canViewAudit(session: any) {
  return !!session?.isSuperAdmin || AUDIT_VIEWER_ROLES.includes(session?.role);
}

/**
 * Records one action. Never throws: if logging fails, the real action still succeeds.
 * Do NOT pass passwords, tokens or other secrets in `details`.
 */
export async function logAudit(
  session: any,
  action: string,
  entityType?: string | null,
  entityId?: string | number | null,
  details?: Record<string, any> | null,
  req?: Request
) {
  try {
    const forwarded = req ? (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() : "";
    await db.insert(auditLogs).values({
      schoolId: session?.schoolId ?? null,
      userId: session?.userId ?? session?.id ?? null,
      action: String(action).slice(0, 255),
      entityType: entityType ? String(entityType).slice(0, 100) : null,
      entityId: entityId !== null && entityId !== undefined ? String(entityId).slice(0, 100) : null,
      newValues: details ?? null,
      ipAddress: forwarded ? forwarded.slice(0, 50) : null,
      userAgent: req ? (req.headers.get("user-agent") || "").slice(0, 500) || null : null,
    } as any);
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
