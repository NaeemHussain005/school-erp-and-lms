import Link from "next/link";
import { db } from "@/db";
import { questions, classes, subjects } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { QUESTION_TYPES } from "@/lib/questions";
import { FileQuestion, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  mcq: "MCQ",
  true_false: "True/False",
  short_answer: "Short",
  long_answer: "Long",
  fill_blank: "Fill blank",
  matching: "Matching",
};

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classId?: string; subjectId?: string; type?: string }>;
}) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const { q = "", classId = "", subjectId = "", type = "" } = await searchParams;

  const conds: any[] = [eq(questions.schoolId, schoolId)];
  const cid = parseInt(classId);
  const sid = parseInt(subjectId);
  if (!isNaN(cid)) conds.push(eq(questions.classId, cid));
  if (!isNaN(sid)) conds.push(eq(questions.subjectId, sid));
  if (type && QUESTION_TYPES.includes(type)) conds.push(eq(questions.type, type as any));
  if (q.trim()) conds.push(ilike(questions.questionText, `%${q.trim()}%`));

  const [list, classList, subjectList] = await Promise.all([
    db.select().from(questions).where(and(...conds)).orderBy(desc(questions.id)).limit(200),
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)),
    db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.schoolId, schoolId)),
  ]);
  const classMap = new Map(classList.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjectList.map((s) => [s.id, s.name]));

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Question Bank"
        description="Reusable questions across exams and papers."
        backHref="/exams"
        action="Add Question"
        actionHref="/exams/questions/new"
        actionIcon={<Plus className="w-4 h-4" />}
      />

      <div className="card p-4">
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3" action="/exams/questions" method="get">
          <input name="q" defaultValue={q} className="input md:col-span-2" placeholder="Search question text…" />
          <select name="classId" defaultValue={classId} className="input">
            <option value="">All classes</option>
            {classList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="subjectId" defaultValue={subjectId} className="input">
            <option value="">All subjects</option>
            {subjectList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select name="type" defaultValue={type} className="input">
            <option value="">All types</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <button type="submit" className="btn-secondary md:col-span-5 md:w-40">Filter</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="p-3">Question</th>
              <th className="p-3">Type</th>
              <th className="p-3">Class</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Level</th>
              <th className="p-3 text-right">Marks</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <FileQuestion className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No questions found.
                </td>
              </tr>
            )}
            {list.map((qn) => (
              <tr key={qn.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 max-w-md">
                  <Link href={`/exams/questions/${qn.id}`} className="font-medium text-blue-600 hover:underline">
                    {qn.questionText.length > 90 ? qn.questionText.slice(0, 90) + "…" : qn.questionText}
                  </Link>
                </td>
                <td className="p-3">{TYPE_LABELS[qn.type || ""] || qn.type}</td>
                <td className="p-3">{qn.classId ? classMap.get(qn.classId) : "—"}</td>
                <td className="p-3">{qn.subjectId ? subjectMap.get(qn.subjectId) : "—"}</td>
                <td className="p-3 capitalize">{qn.difficulty}</td>
                <td className="p-3 text-right">{qn.marks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
