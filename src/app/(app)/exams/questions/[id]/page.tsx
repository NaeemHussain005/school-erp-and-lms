import { notFound } from "next/navigation";
import { db } from "@/db";
import { classes, subjects, questions } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import QuestionForm from "@/components/QuestionForm";

export const dynamic = "force-dynamic";

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const { id } = await params;
  const qid = parseInt(id);
  if (isNaN(qid)) return notFound();

  const rows = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, qid), eq(questions.schoolId, schoolId)))
    .limit(1);
  if (rows.length === 0) return notFound();
  const q = rows[0];

  const [classRows, subjectRows] = await Promise.all([
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)).orderBy(asc(classes.name)),
    db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.schoolId, schoolId)).orderBy(asc(subjects.name)),
  ]);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title="Edit Question" description="Update or delete this question." backHref="/exams/questions" />
      <QuestionForm
        questionId={q.id}
        classes={classRows}
        subjects={subjectRows}
        initial={{
          type: q.type || "mcq",
          questionText: q.questionText || "",
          marks: String(q.marks ?? 1),
          difficulty: q.difficulty || "medium",
          classId: q.classId ? String(q.classId) : "",
          subjectId: q.subjectId ? String(q.subjectId) : "",
          chapter: q.chapter || "",
          topic: q.topic || "",
          options: (q.options as string[] | null) || [],
          correctAnswer: q.correctAnswer || "",
          explanation: q.explanation || "",
        }}
      />
    </div>
  );
}
