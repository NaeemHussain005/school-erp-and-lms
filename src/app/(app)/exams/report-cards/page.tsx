import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, classes, results, exams } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { canEnterMarks } from "@/lib/exams";
import { studentFullName } from "@/lib/utils";
import { Award } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPES: { v: string; l: string }[] = [
  { v: "", l: "All exam types" },
  { v: "mid_term", l: "Mid Term" },
  { v: "final_term", l: "Final Term" },
  { v: "monthly", l: "Monthly" },
  { v: "weekly", l: "Weekly" },
  { v: "quiz", l: "Quiz" },
  { v: "assignment", l: "Assignment" },
  { v: "annual", l: "Annual" },
  { v: "unit_test", l: "Unit Test" },
];

export default async function ReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; type?: string }>;
}) {
  const session: any = await requireAuth();
  if (!canEnterMarks(session)) return notFound();
  const schoolId = session.schoolId!;
  const { classId = "", type = "" } = await searchParams;
  const cid = parseInt(classId);
  const validType = TYPES.some((t) => t.v === type) ? type : "";

  const classList = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.schoolId, schoolId))
    .orderBy(asc(classes.name));

  let rows: any[] = [];
  const statMap = new Map<number, { cnt: number; avg: number | null }>();

  if (!isNaN(cid)) {
    const [stuRows, stats] = await Promise.all([
      db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNo: students.admissionNo,
          rollNo: students.rollNo,
        })
        .from(students)
        .where(and(eq(students.schoolId, schoolId), eq(students.classId, cid)))
        .orderBy(asc(students.firstName)),
      db
        .select({
          studentId: results.studentId,
          cnt: sql<number>`count(*)`,
          avgPct: sql<number>`avg(${results.percentage})`,
        })
        .from(results)
        .innerJoin(exams, eq(results.examId, exams.id))
        .where(
          and(
            eq(results.schoolId, schoolId),
            eq(exams.isPublished, true),
            sql`${results.isPresent} is not false`,
            validType ? eq(exams.type, validType as any) : undefined
          )
        )
        .groupBy(results.studentId),
    ]);
    rows = stuRows;
    for (const st of stats) {
      if (st.studentId != null) statMap.set(st.studentId, { cnt: Number(st.cnt), avg: st.avgPct != null ? Number(st.avgPct) : null });
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Report Cards"
        description="Pick a class to view and print each student's report card."
        backHref="/exams"
      />

      <div className="card p-4">
        <form className="flex flex-col md:flex-row gap-3" action="/exams/report-cards" method="get">
          <select name="classId" defaultValue={classId} className="input md:w-64">
            <option value="">Select class…</option>
            {classList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="type" defaultValue={validType} className="input md:w-56">
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>{t.l}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Show Students</button>
        </form>
      </div>

      {isNaN(cid) ? (
        <div className="card p-10 text-center text-slate-500">
          <Award className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          Select a class to see its students.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="p-3">Roll</th>
                <th className="p-3">Student</th>
                <th className="p-3">Adm No</th>
                <th className="p-3 text-right">Published Results</th>
                <th className="p-3 text-right">Average</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No students in this class.</td>
                </tr>
              )}
              {rows.map((s) => {
                const st = statMap.get(s.id);
                const href = `/exams/report-cards/${s.id}${validType ? "?type=" + validType : ""}`;
                return (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{s.rollNo || "—"}</td>
                    <td className="p-3 font-medium text-slate-900">
                      <Link href={href} className="text-blue-600 hover:underline">
                        {studentFullName({ firstName: s.firstName, lastName: s.lastName } as any)}
                      </Link>
                    </td>
                    <td className="p-3">{s.admissionNo || "—"}</td>
                    <td className="p-3 text-right">{st?.cnt ?? 0}</td>
                    <td className="p-3 text-right">{st?.avg != null ? st.avg.toFixed(1) + "%" : "—"}</td>
                    <td className="p-3 text-right">
                      <Link href={href} className="text-blue-600 hover:underline">View Report Card</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
