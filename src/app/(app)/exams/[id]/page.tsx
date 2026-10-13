import { notFound } from "next/navigation";
import { db } from "@/db";
import { exams, classes, sections, subjects, students, results } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import MarksEntry from "@/components/MarksEntry";
import ExamActions from "@/components/ExamActions";
import { canEnterMarks, canAdminExams } from "@/lib/exams";
import { formatDate, studentFullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session: any = await requireAuth();
  const schoolId = session.schoolId!;
  const { id } = await params;
  const examId = parseInt(id);
  if (isNaN(examId)) return notFound();

  const examRows = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.schoolId, schoolId)))
    .limit(1);
  if (examRows.length === 0) return notFound();
  const exam = examRows[0];

  const [clsRows, secRows, subRows, stuRows, resRows] = await Promise.all([
    exam.classId
      ? db.select({ name: classes.name }).from(classes).where(and(eq(classes.id, exam.classId), eq(classes.schoolId, schoolId))).limit(1)
      : Promise.resolve([]),
    exam.sectionId
      ? db.select({ name: sections.name }).from(sections).where(and(eq(sections.id, exam.sectionId), eq(sections.schoolId, schoolId))).limit(1)
      : Promise.resolve([]),
    exam.subjectId
      ? db.select({ name: subjects.name }).from(subjects).where(and(eq(subjects.id, exam.subjectId), eq(subjects.schoolId, schoolId))).limit(1)
      : Promise.resolve([]),
    exam.classId
      ? db
          .select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            admissionNo: students.admissionNo,
            rollNo: students.rollNo,
          })
          .from(students)
          .where(
            and(
              eq(students.schoolId, schoolId),
              eq(students.classId, exam.classId),
              exam.sectionId ? eq(students.sectionId, exam.sectionId) : undefined
            )
          )
          .orderBy(asc(students.firstName))
      : Promise.resolve([]),
    db.select().from(results).where(and(eq(results.examId, examId), eq(results.schoolId, schoolId))),
  ]);

  const className = (clsRows as any[])[0]?.name || "";
  const sectionName = (secRows as any[])[0]?.name || "";
  const subjectName = (subRows as any[])[0]?.name || "";
  const stuList = stuRows as any[];

  const totalMarks = exam.totalMarks ?? 100;
  const passMarks = exam.passMarks ?? 33;

  const resMap = new Map(resRows.map((r) => [r.studentId, r]));
  const rows = stuList.map((s) => {
    const r: any = resMap.get(s.id);
    return {
      studentId: s.id as number,
      name: studentFullName({ firstName: s.firstName, lastName: s.lastName } as any),
      admissionNo: s.admissionNo || "",
      rollNo: s.rollNo || "",
      obtained: r && r.isPresent !== false && r.obtainedMarks != null ? String(Number(r.obtainedMarks)) : "",
      absent: r ? r.isPresent === false : false,
      grade: r?.grade || "",
      position: (r?.position ?? null) as number | null,
    };
  });

  const present = resRows.filter((r) => r.isPresent !== false && r.obtainedMarks != null);
  const avg = present.length ? present.reduce((s, r) => s + Number(r.percentage || 0), 0) / present.length : null;
  const passed = present.filter((r) => r.grade !== "F").length;

  const description = [
    `${className}${sectionName ? " " + sectionName : ""}`.trim(),
    subjectName,
    (exam.type || "").replace("_", " "),
    exam.startDate ? formatDate(exam.startDate) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <PageHeader title={exam.title} description={description} backHref="/exams">
        {canAdminExams(session) && <ExamActions examId={exam.id} isPublished={!!exam.isPublished} />}
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Students" value={String(stuList.length)} />
        <Stat label="Marks Entered" value={`${resRows.length}/${stuList.length}`} />
        <Stat label="Average" value={avg === null ? "—" : `${avg.toFixed(1)}%`} />
        <Stat label="Passed" value={present.length ? `${passed}/${present.length}` : "—"} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className={exam.isPublished ? "badge badge-green" : "badge badge-yellow"}>
          {exam.isPublished ? "Published" : "Draft"}
        </span>
        <span className="text-slate-500">Total {totalMarks} · Pass {passMarks}</span>
      </div>

      {!exam.classId ? (
        <div className="card p-8 text-center text-slate-500">This exam has no class, so marks cannot be entered.</div>
      ) : (
        <MarksEntry
          examId={exam.id}
          totalMarks={totalMarks}
          passMarks={passMarks}
          rows={rows}
          canEdit={canEnterMarks(session)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase text-slate-500 font-semibold">{label}</div>
      <div className="text-xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
