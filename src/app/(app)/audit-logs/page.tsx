import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { canViewAudit } from "@/lib/audit";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const fmt = (d: Date | null) =>
  d
    ? d.toLocaleString("en-GB", {
        timeZone: "Asia/Karachi",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

function Details({ v }: { v: any }) {
  if (!v || typeof v !== "object") return <span className="text-slate-400">—</span>;
  const entries = Object.entries(v).slice(0, 6);
  if (entries.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <div className="text-xs text-slate-600 space-y-0.5">
      {entries.map(([k, val]) => (
        <div key={k}>
          <span className="text-slate-400">{k}:</span> {String(val ?? "").slice(0, 80)}
        </div>
      ))}
    </div>
  );
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entityType?: string; from?: string; to?: string; page?: string }>;
}) {
  const session: any = await requireAuth();
  if (!canViewAudit(session)) return notFound();
  const schoolId = session.schoolId!;

  const { q = "", entityType = "", from = "", to = "", page = "1" } = await searchParams;
  const pageNo = Math.max(1, parseInt(page) || 1);
  const datePat = /^\d{4}-\d{2}-\d{2}$/;

  const conds: any[] = [eq(auditLogs.schoolId, schoolId)];
  if (q.trim()) {
    conds.push(or(ilike(auditLogs.action, `%${q.trim()}%`), ilike(auditLogs.entityId, `%${q.trim()}%`)));
  }
  if (entityType) conds.push(eq(auditLogs.entityType, entityType));
  if (datePat.test(from)) conds.push(gte(auditLogs.createdAt, new Date(`${from}T00:00:00+05:00`)));
  if (datePat.test(to)) conds.push(lte(auditLogs.createdAt, new Date(`${to}T23:59:59.999+05:00`)));

  const [rows, types] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.newValues,
        ip: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conds))
      .orderBy(desc(auditLogs.id))
      .limit(PAGE_SIZE + 1)
      .offset((pageNo - 1) * PAGE_SIZE),
    db.selectDistinct({ t: auditLogs.entityType }).from(auditLogs).where(eq(auditLogs.schoolId, schoolId)),
  ]);

  const hasNext = rows.length > PAGE_SIZE;
  const list = rows.slice(0, PAGE_SIZE);

  const qs = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (entityType) sp.set("entityType", entityType);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return "?" + s;
  };

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Audit Log" description="Track important actions performed by users." />

      <div className="card p-4">
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3" method="get">
          <input name="q" defaultValue={q} className="input md:col-span-2" placeholder="Search action or record id…" />
          <select name="entityType" defaultValue={entityType} className="input">
            <option value="">All record types</option>
            {types
              .map((t) => t.t)
              .filter(Boolean)
              .map((t) => (
                <option key={t as string} value={t as string}>
                  {t}
                </option>
              ))}
          </select>
          <input type="date" name="from" defaultValue={from} className="input" />
          <input type="date" name="to" defaultValue={to} className="input" />
          <div className="md:col-span-5 flex gap-2">
            <button type="submit" className="btn-primary">Filter</button>
            <Link href="?" className="btn-secondary">Clear</Link>
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="p-3">When</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Record</th>
              <th className="p-3">Details</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <ScrollText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {list.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 align-top">
                <td className="p-3 whitespace-nowrap">{fmt(r.createdAt)}</td>
                <td className="p-3">
                  <div className="font-medium text-slate-900">
                    {[r.firstName, r.lastName].filter(Boolean).join(" ") || "System"}
                  </div>
                  {r.role && <div className="text-xs text-slate-500 capitalize">{String(r.role).replace("_", " ")}</div>}
                </td>
                <td className="p-3">
                  <span className="badge badge-blue font-mono">{r.action}</span>
                </td>
                <td className="p-3">
                  {r.entityType || "—"}
                  {r.entityId ? <span className="text-slate-500"> #{r.entityId}</span> : null}
                </td>
                <td className="p-3">
                  <Details v={r.details} />
                </td>
                <td className="p-3 text-xs text-slate-500">{r.ip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(pageNo > 1 || hasNext) && (
        <div className="flex items-center justify-between">
          {pageNo > 1 ? (
            <Link href={qs(pageNo - 1)} className="btn-secondary">← Newer</Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-slate-500">Page {pageNo}</span>
          {hasNext ? (
            <Link href={qs(pageNo + 1)} className="btn-secondary">Older →</Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
