import { db } from "@/db";
import { classes, subjects } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import QuestionForm from "@/components/QuestionForm";

export const dynamic = "force-dynamic";

export default async function NewQuestionPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const [classRows, subjectRows] = await Promise.all([
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)).orderBy(asc(classes.name)),
    db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.schoolId, schoolId)).orderBy(asc(subjects.name)),
  ]);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title="Add Question" description="Add a reusable question to the bank." backHref="/exams/questions" />
      <QuestionForm classes={classRows} subjects={subjectRows} />
    </div>
  );
}
