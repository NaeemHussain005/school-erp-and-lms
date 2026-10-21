import { notFound } from "next/navigation";
import { db } from "@/db";
import { classes, sections, subjects, students, assignmentSubmissions } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import AssignmentForm from "@/components/AssignmentForm";
import AssignmentActions from "@/components/AssignmentActions";
import AssignmentGradebook from "@/components/AssignmentGradebook";
import { canManageAssignments, findAssignment } from "@/lib/assignments";
import { formatDateTime, studentFullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toLocalInput(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session: any = await requireAuth();
  const schoolId = session.schoolId!;
  const { id } = await params;
  const assignmentId = parseInt(id);
  if (isNaN(assignmentId)) return notFound();

  const a = await findAssignment(assignmentId, schoolId);
  if (!a) return notFound();
  const manage = canManageAssignments(session);

  const [classRows, sectionRows, subjectRows] = await Promise.all([
    db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(asc(classes.name)),
    db
      .select({ id: sections.id, classId: sections.classId, name: sections.name })
      .from(sections)
      .where(eq(sections.schoolId, schoolId))
      .orderBy(asc(sections.name)),
    db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(eq(subjects.schoolId, schoolId))
      .orderBy(asc(subjects.name)),
  ]);

  const className = classRows.find((c) => c.id === a.classId)?.name || "";
  const sectionName = sectionRows.find((s) => s.id === a.sectionId)?.name || "";
  const subjectName = subjectRows.find((s) => s.id === a.subjectId)?.name || "";

  const now = Date.now();
  const due = a.dueDate ? new Date(a.dueDate) : null;
  const overdue = due ? due.getTime() < now : false;
  const meta = [`${className} ${sectionName}`.trim(), subjectName].filter(Boolean).join(" · ");

  // ---- Gradebook data (students of this class/section) ----
  let gradeRows: {
    studentId: number;
    name: string;
    rollNo: string;
    marks: string;
    feedback: string;
    status: string;
  }[] = [];

  if (manage && a.classId) {
    const studentRows = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        rollNo: students.rollNo,
      })
      .from(students)
      .where(
        and(
          eq(students.schoolId, schoolId),
          eq(students.classId, a.classId),
          a.sectionId ? eq(students.sectionId, a.sectionId) : undefined,
          eq(students.isActive, true)
        )
      )
      .orderBy(asc(students.rollNo), asc(students.firstName));

    const subRows = await db
      .select({
        studentId: assignmentSubmissions.studentId,
        marks: assignmentSubmissions.marks,
        feedback: assignmentSubmissions.feedback,
        status: assignmentSubmissions.status,
      })
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.assignmentId, assignmentId));

    const subMap = new Map(subRows.map((s) => [s.studentId, s]));

    gradeRows = studentRows.map((s) => {
      const sub = subMap.get(s.id);
      return {
        studentId: s.id,
        name: studentFullName(s),
        rollNo: s.rollNo || "",
        marks: sub?.marks != null ? String(sub.marks) : "",
        feedback: sub?.feedback || "",
        status: sub?.status || "pending",
      };
    });
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <PageHeader title={a.title} description={meta || "Assignment"} backHref="/assignments">
        {manage && <AssignmentActions assignmentId={a.id} />}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="badge badge-blue">{a.totalMarks} marks</span>
        {due && (
          <span className={overdue ? "badge badge-slate" : "badge badge-green"}>
            Due: {formatDateTime(a.dueDate)}
          </span>
        )}
        {a.allowLateSubmission && <span className="badge badge-slate">Late allowed</span>}
      </div>

      {a.description && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">Description</h3>
          <p className="text-slate-700 whitespace-pre-line">{a.description}</p>
        </div>
      )}

      {a.instructions && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">Instructions</h3>
          <p className="text-slate-700 whitespace-pre-line">{a.instructions}</p>
        </div>
      )}

      {manage && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Submissions &amp; Grading</h3>
          {a.classId ? (
            <AssignmentGradebook
              assignmentId={a.id}
              totalMarks={a.totalMarks ?? 100}
              rows={gradeRows}
            />
          ) : (
            <div className="card p-6 text-sm text-slate-500">
              This assignment is not linked to a class, so there is no student list to grade. Edit the
              assignment and choose a class to enable grading.
            </div>
          )}
        </div>
      )}

      {manage && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-blue-600 mb-3">
            Edit assignment
          </summary>
          <AssignmentForm
            classes={classRows}
            sections={sectionRows}
            subjects={subjectRows}
            initial={{
              id: a.id,
              title: a.title || "",
              description: a.description || "",
              instructions: a.instructions || "",
              classId: a.classId ? String(a.classId) : "",
              sectionId: a.sectionId ? String(a.sectionId) : "",
              subjectId: a.subjectId ? String(a.subjectId) : "",
              dueDate: toLocalInput(a.dueDate),
              totalMarks: String(a.totalMarks ?? 100),
              allowLateSubmission: !!a.allowLateSubmission,
            }}
          />
        </details>
      )}
    </div>
  );
}
