import { db } from "@/db";
import { classes, sections, subjects } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ExamForm from "@/components/ExamForm";

export const dynamic = "force-dynamic";

export default async function NewExamPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const [classRows, sectionRows, subjectRows] = await Promise.all([
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)).orderBy(asc(classes.name)),
    db.select({ id: sections.id, classId: sections.classId, name: sections.name }).from(sections).where(eq(sections.schoolId, schoolId)).orderBy(asc(sections.name)),
    db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.schoolId, schoolId)).orderBy(asc(subjects.name)),
  ]);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title="Create Exam" description="Set up the exam, then enter marks on the next screen." backHref="/exams" />
      <ExamForm classes={classRows} sections={sectionRows} subjects={subjectRows} />
    </div>
  );
}
