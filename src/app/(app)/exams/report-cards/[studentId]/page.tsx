import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, classes, sections, schools, results, exams, subjects } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import PrintReportButton from "@/components/PrintReportButton";
import { canEnterMarks, gradeFor } from "@/lib/exams";
import { formatDate, studentFullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  mid_term: "Mid Term",
  final_term: "Final Term",
  monthly: "Monthly",
  weekly: "Weekly",
  quiz: "Quiz",
  assignment: "Assignment",
  annual: "Annual",
  unit_test: "Unit Test",
};

export default async function ReportCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const session: any = await requireAuth();
  if (!canEnterMarks(session)) return notFound();
  const schoolId = session.schoolId!;

  const { studentId } = await params;
  const { type = "" } = await searchParams;
  const sid = parseInt(studentId);
  if (isNaN(sid)) return notFound();

  const stuRows = await db
    .select()
    .from(students)
    .where(and(eq(students.id, sid), eq(students.schoolId, schoolId)))
    .limit(1);
  if (stuRows.length === 0) return notFound();
  const s = stuRows[0];

  const [clsRows, secRows, schoolRows, resRows] = await Promise.all([
    s.classId ? db.select({ name: classes.name }).from(classes).where(and(eq(classes.id, s.classId), eq(classes.schoolId, schoolId))).limit(1) : Promise.resolve([]),
    s.sectionId ? db.select({ name: sections.name }).from(sections).where(and(eq(sections.id, s.sectionId), eq(sections.schoolId, schoolId))).limit(1) : Promise.resolve([]),
    db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
    db
      .select({
        id: results.id,
        obtained: results.obtainedMarks,
        total: results.totalMarks,
        percentage: results.percentage,
        grade: results.grade,
        position: results.position,
        isPresent: results.isPresent,
        examTitle: exams.title,
        examType: exams.type,
        startDate: exams.startDate,
        subjectName: subjects.name,
      })
      .from(results)
      .innerJoin(exams, eq(results.examId, exams.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(
        and(
          eq(results.studentId, sid),
          eq(results.schoolId, schoolId),
          eq(exams.isPublished, true),
          type ? eq(exams.type, type as any) : undefined
        )
      )
      .orderBy(asc(exams.startDate), asc(results.id)),
  ]);

  const className = (clsRows as any[])[0]?.name || "";
  const sectionName = (secRows as any[])[0]?.name || "";
  const school: any = schoolRows[0] || {};

  const sitting = resRows.filter((r) => r.isPresent !== false && r.obtained != null);
  const sumObtained = sitting.reduce((t, r) => t + Number(r.obtained), 0);
  const sumTotal = sitting.reduce((t, r) => t + Number(r.total || 0), 0);
  const overall = sumTotal > 0 ? gradeFor(sumObtained, sumTotal, 0) : null;
  const failed = sitting.filter((r) => r.grade === "F").length;
  const name = studentFullName(s);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title={`Report Card — ${name}`}
        description={type ? TYPE_LABELS[type] || type : "All published exams"}
        backHref={`/exams/report-cards${s.classId ? "?classId=" + s.classId : ""}`}
      >
        <PrintReportButton />
      </PageHeader>

      <div className="card p-8 print-area">
        <div className="text-center pb-5 border-b-2 border-slate-800">
          {school.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" className="w-16 h-16 object-contain mx-auto mb-2" />
          )}
          <div className="text-2xl font-bold text-slate-900">{school.name || "School"}</div>
          {school.address && <div className="text-sm text-slate-600">{school.address}</div>}
          <div className="mt-3 inline-block px-4 py-1 rounded bg-slate-900 text-white text-sm font-semibold tracking-widest">
            REPORT CARD
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-5 text-sm border-b border-slate-200">
          <Info label="Student" value={name} />
          <Info label="Father" value={s.fatherName} />
          <Info label="Class" value={`${className} ${sectionName}`.trim()} />
          <Info label="Admission No" value={s.admissionNo} />
          <Info label="Roll No" value={s.rollNo} />
          <Info label="Exams" value={type ? TYPE_LABELS[type] || type : "All published"} />
        </div>

        {resRows.length === 0 ? (
          <p className="py-10 text-center text-slate-500">No published results yet.</p>
        ) : (
          <table className="w-full my-5 text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-left text-xs uppercase text-slate-500">
                <th className="py-2">Exam</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Date</th>
                <th className="py-2 text-right">Total</th>
                <th className="py-2 text-right">Obtained</th>
                <th className="py-2 text-right">%</th>
                <th className="py-2 text-center">Grade</th>
                <th className="py-2 text-center">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {resRows.map((r) => {
                const absent = r.isPresent === false;
                return (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-900">
                      {r.examTitle}
                      <div className="text-xs text-slate-500">{TYPE_LABELS[r.examType || ""] || ""}</div>
                    </td>
                    <td className="py-2">{r.subjectName || "—"}</td>
                    <td className="py-2">{r.startDate ? formatDate(r.startDate) : "—"}</td>
                    <td className="py-2 text-right">{r.total}</td>
                    <td className="py-2 text-right font-semibold">{absent ? "Absent" : Number(r.obtained)}</td>
                    <td className="py-2 text-right">{absent || r.percentage == null ? "—" : Number(r.percentage).toFixed(1) + "%"}</td>
                    <td className={`py-2 text-center font-bold ${r.grade === "F" ? "text-red-600" : "text-slate-900"}`}>{r.grade || "—"}</td>
                    <td className="py-2 text-center">{r.position ? "#" + r.position : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {overall && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Box label="Total Marks" value={`${sumObtained}/${sumTotal}`} />
            <Box label="Percentage" value={`${overall.percentage.toFixed(1)}%`} />
            <Box label="Overall Grade" value={overall.grade} />
            <Box label="Result" value={failed === 0 ? "Pass" : `Failed in ${failed}`} tone={failed === 0 ? "green" : "red"} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 pt-12 text-sm text-slate-600">
          <div className="border-t border-slate-400 pt-1 text-center">Class Teacher</div>
          <div className="border-t border-slate-400 pt-1 text-center">
            Principal{school.principal ? ` — ${school.principal}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 w-28 flex-shrink-0">{label}:</span>
      <span className="font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  const color = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "red" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-900";
  return (
    <div className={`p-3 rounded-lg ${color}`}>
      <div className="text-xs uppercase font-medium opacity-70">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}
