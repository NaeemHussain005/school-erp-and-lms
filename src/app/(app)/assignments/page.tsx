import Link from "next/link";
import { db } from "@/db";
import { assignments, classes, sections, subjects, assignmentSubmissions } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatDateTime } from "@/lib/utils";
import { FileText, Plus, Search, Filter, Users } from "lucide-react";
import { canManageAssignments } from "@/lib/assignments";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  class?: string;
  subject?: string;
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session: any = await requireAuth();
  const schoolId = session.schoolId!;
  const manage = canManageAssignments(session);
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const classFilter = sp.class ? parseInt(sp.class) : null;
  const subjectFilter = sp.subject ? parseInt(sp.subject) : null;

  const whereClause = and(
    eq(assignments.schoolId, schoolId),
    classFilter ? eq(assignments.classId, classFilter) : undefined,
    subjectFilter ? eq(assignments.subjectId, subjectFilter) : undefined,
    q
      ? or(
          ilike(assignments.title, `%${q}%`),
          ilike(assignments.description, `%${q}%`)
        )
      : undefined
  );

  const [items, classRows, subjectRows, sectionRows, subCounts] = await Promise.all([
    db
      .select()
      .from(assignments)
      .where(whereClause)
      .orderBy(desc(assignments.createdAt))
      .limit(200),
    db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(asc(classes.name)),
    db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(eq(subjects.schoolId, schoolId))
      .orderBy(asc(subjects.name)),
    db
      .select({ id: sections.id, name: sections.name })
      .from(sections)
      .where(eq(sections.schoolId, schoolId)),
    db
      .select({ assignmentId: assignmentSubmissions.assignmentId, n: sql<number>`count(*)` })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
      .where(eq(assignments.schoolId, schoolId))
      .groupBy(assignmentSubmissions.assignmentId),
  ]);

  const classMap = new Map(classRows.map((c) => [c.id, c.name]));
  const sectionMap = new Map(sectionRows.map((s) => [s.id, s.name]));
  const subjectMap = new Map(subjectRows.map((s) => [s.id, s.name]));
  const countMap = new Map(subCounts.map((c) => [c.assignmentId, Number(c.n)]));

  const now = Date.now();

  function dueBadge(dueDate: any) {
    if (!dueDate) return null;
    const due = new Date(dueDate).getTime();
    if (isNaN(due)) return null;
    const dayMs = 24 * 60 * 60 * 1000;
    const diff = due - now;
    if (diff < 0) return <span className="badge badge-slate">Overdue</span>;
    if (diff < dayMs) return <span className="badge badge-yellow">Due today</span>;
    if (diff < 3 * dayMs) return <span className="badge badge-yellow">Due soon</span>;
    return <span className="badge badge-green">Upcoming</span>;
  }

  return (
    <div className="animate-fade-in">
      {manage ? (
        <PageHeader
          title="Assignments"
          description="Create and manage class assignments and submissions."
          action="New Assignment"
          actionHref="/assignments/new"
          actionIcon={<Plus className="w-4 h-4" />}
        />
      ) : (
        <PageHeader title="Assignments" description="Your class assignments." />
      )}

      <div className="card p-4 mb-4">
        <form className="flex flex-col md:flex-row gap-3" action="/assignments" method="get">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="Search assignments…" className="input pl-9" />
          </div>
          <select name="class" defaultValue={classFilter || ""} className="input md:w-44">
            <option value="">All classes</option>
            {classRows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="subject" defaultValue={subjectFilter || ""} className="input md:w-44">
            <option value="">All subjects</option>
            {subjectRows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-5">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </form>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-900">
              {q || classFilter || subjectFilter ? "No assignments match your filters" : "No assignments yet"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {manage ? "Create your first assignment for students." : "No assignments have been set yet."}
            </p>
            {manage && (
              <Link href="/assignments/new" className="btn-primary mt-4">
                <Plus className="w-4 h-4" /> New Assignment
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((a) => {
              const meta = [
                a.classId ? classMap.get(a.classId) : null,
                a.sectionId ? sectionMap.get(a.sectionId) : null,
                a.subjectId ? subjectMap.get(a.subjectId) : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={a.id}
                  href={`/assignments/${a.id}`}
                  className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{a.title}</div>
                    {meta && <div className="text-xs text-slate-500 mt-0.5">{meta}</div>}
                    {a.description && (
                      <div className="text-sm text-slate-500 mt-0.5 line-clamp-1">{a.description}</div>
                    )}
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Due: {formatDateTime(a.dueDate)}</span>
                      <span>· {a.totalMarks} marks</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" /> {countMap.get(a.id) ?? 0} submitted
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">{dueBadge(a.dueDate)}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
