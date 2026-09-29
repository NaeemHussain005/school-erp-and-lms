import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { classes, sections, academicSessions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import StudentForm from "@/components/StudentForm";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const [classList, sessionList] = await Promise.all([
    db.select().from(classes).where(eq(classes.schoolId, schoolId)).orderBy(classes.name),
    db.select().from(academicSessions).where(eq(academicSessions.schoolId, schoolId)).orderBy(asc(academicSessions.startDate)),
  ]);
  const currentSession = sessionList.find((s) => s.isCurrent) || sessionList[0];

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader title="Add New Student" description="Fill in the details below to admit a new student." backHref="/students" />
      <StudentForm
        classes={classList}
        currentSessionId={currentSession?.id}
        sessions={sessionList}
        schoolId={schoolId}
      />
    </div>
  );
}
