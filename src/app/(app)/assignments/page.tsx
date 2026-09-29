import Link from "next/link";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatDate } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const items = await db
    .select()
    .from(assignments)
    .where(eq(assignments.schoolId, schoolId))
    .orderBy(desc(assignments.createdAt))
    .limit(50);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Assignments" description="Create and manage class assignments and submissions." action="New Assignment" actionHref="/assignments/new" actionIcon={<Plus className="w-4 h-4" />} />
      <div className="card">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-900">No assignments yet</h3>
            <p className="text-sm text-slate-500 mt-1">Create your first assignment for students.</p>
            <Link href="/assignments/new" className="btn-primary mt-4"><Plus className="w-4 h-4" /> New Assignment</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((a) => (
              <div key={a.id} className="p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{a.title}</div>
                  <div className="text-sm text-slate-500 mt-0.5 line-clamp-2">{a.description}</div>
                  <div className="text-xs text-slate-400 mt-1">Due: {formatDate(a.dueDate)} · {a.totalMarks} marks</div>
                </div>
                <span className="badge badge-blue">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
