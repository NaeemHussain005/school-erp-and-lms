import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, classes, academicSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import StudentForm from "@/components/StudentForm";

export const dynamic = "force-dynamic";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;
  const studentId = parseInt(id);
  if (isNaN(studentId)) return notFound();
  const schoolId = session.schoolId!;

  const [sRows, classList, sessionList] = await Promise.all([
    db.select().from(students).where(and(eq(students.id, studentId), eq(students.schoolId, schoolId))).limit(1),
    db.select().from(classes).where(eq(classes.schoolId, schoolId)),
    db.select().from(academicSessions).where(eq(academicSessions.schoolId, schoolId)),
  ]);
  if (sRows.length === 0) return notFound();

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Edit Student" description="Update student details" backHref={`/students/${studentId}`} />
      <StudentForm
        student={sRows[0]}
        classes={classList}
        sessions={sessionList}
        currentSessionId={sRows[0].academicSessionId ?? undefined}
        schoolId={schoolId}
      />
    </div>
  );
}
