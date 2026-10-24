import { notFound } from "next/navigation";
import { db } from "@/db";
import { classes, sections } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import StudentImport from "@/components/StudentImport";
import { canImportStudents } from "@/lib/student-import";

export const dynamic = "force-dynamic";

export default async function ImportStudentsPage() {
  const session: any = await requireAuth();
  if (!canImportStudents(session)) return notFound();
  const schoolId = session.schoolId!;

  const [classRows, sectionRows] = await Promise.all([
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)).orderBy(asc(classes.name)),
    db.select({ classId: sections.classId, name: sections.name }).from(sections).where(eq(sections.schoolId, schoolId)).orderBy(asc(sections.name)),
  ]);

  const info = classRows.map((c) => ({
    name: c.name,
    sections: sectionRows.filter((s) => s.classId === c.id).map((s) => s.name),
  }));

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <PageHeader title="Import Students" description="Upload a CSV file to add many students at once." backHref="/students" />
      <StudentImport classes={info} />
    </div>
  );
}
