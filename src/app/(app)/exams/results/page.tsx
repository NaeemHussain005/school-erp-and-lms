import Link from "next/link";
import { db } from "@/db";
import { exams, classes, results } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatDate } from "@/lib/utils";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const [examList, classList, stats] = await Promise.all([
    db.select().from(exams).where(eq(exams.schoolId, schoolId)).orderBy(desc(exams.createdAt)).limit(100),
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)),
    db
      .select({
        examId: results.examId,
        entered: sql<number>`count(*)`,
        sitting: sql<number>`count(*) filter (where ${results.isPresent} is not false)`,
        passed: sql<number>`count(*) filter (where ${results.isPresent} is not false and ${results.grade} <> 'F')`,
        avgPct: sql<number>`avg(${results.percentage})`,
      })
      .from(results)
      .where(eq(results.schoolId, schoolId))
      .groupBy(results.examId),
  ]);

  const classMap = new Map(classList.map((c) => [c.id, c.name]));
  const statMap = new Map(stats.map((s) => [s.examId, s]));

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Results"
        description="Enter marks and see how each exam went."
        backHref="/exams"
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="p-3">Exam</th>
              <th className="p-3">Class</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Entered</th>
              <th className="p-3 text-right">Average</th>
              <th className="p-3 text-right">Pass %</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {examList.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  <Trophy className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No exams yet. Create an exam first.
                </td>
              </tr>
            )}
            {examList.map((e) => {
              const st: any = statMap.get(e.id);
              const entered = st ? Number(st.entered) : 0;
              const sitting = st ? Number(st.sitting) : 0;
              const passed = st ? Number(st.passed) : 0;
              const avg = st && st.avgPct != null ? Number(st.avgPct) : null;
              return (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-semibold">
                    <Link href={`/exams/${e.id}`} className="text-blue-600 hover:underline">
                      {e.title}
                    </Link>
                  </td>
                  <td className="p-3">{e.classId ? classMap.get(e.classId) : "—"}</td>
                  <td className="p-3">{formatDate(e.startDate)}</td>
                  <td className="p-3 text-right">{entered}</td>
                  <td className="p-3 text-right">{avg === null ? "—" : `${avg.toFixed(1)}%`}</td>
                  <td className="p-3 text-right">{sitting > 0 ? `${Math.round((passed / sitting) * 100)}%` : "—"}</td>
                  <td className="p-3">
                    {e.isPublished ? <span className="badge badge-green">Published</span> : <span className="badge badge-yellow">Draft</span>}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/exams/${e.id}`} className="text-blue-600 hover:underline">
                      {entered > 0 ? "View / Edit" : "Enter Marks"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
