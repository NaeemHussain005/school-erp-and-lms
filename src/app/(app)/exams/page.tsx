import Link from "next/link";
import { db } from "@/db";
import { exams, classes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Plus, FileQuestion, Trophy, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const [examList, classList] = await Promise.all([
    db.select().from(exams).where(eq(exams.schoolId, schoolId)).orderBy(desc(exams.createdAt)).limit(50),
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)),
  ]);
  const classMap = new Map(classList.map((c) => [c.id, c.name]));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Exams & Results"
        description="Create exams, manage question bank, evaluate papers and publish report cards."
        action="Create Exam"
        actionHref="/exams/new"
        actionIcon={<Plus className="w-4 h-4" />}
      >
        <Link href="/exams/questions" className="btn-secondary"><FileQuestion className="w-4 h-4" /> Question Bank</Link>
        <Link href="/exams/results" className="btn-secondary"><Trophy className="w-4 h-4" /> Results</Link>
        <Link href="/exams/report-cards" className="btn-secondary"><BookOpen className="w-4 h-4" /> Report Cards</Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/exams/new" className="card-hover p-5 border-dashed border-2 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-900">Create New Exam</div>
          <p className="text-sm text-slate-500 mt-1">Mid-term, final term, quiz, or assignment</p>
        </Link>

        <Link href="/exams/questions" className="card-hover p-5 border-dashed border-2 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-900">Question Bank</div>
          <p className="text-sm text-slate-500 mt-1">Reusable MCQs, short/long questions</p>
        </Link>

        <Link href="/exams/report-cards" className="card-hover p-5 border-dashed border-2 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-900">Report Cards</div>
          <p className="text-sm text-slate-500 mt-1">Generate beautiful PDF report cards</p>
        </Link>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">All Exams</h3>
        </div>
        {examList.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No exams created yet.</p>
            <Link href="/exams/new" className="btn-primary mt-4"><Plus className="w-4 h-4" /> Create your first exam</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>Start Date</th>
                  <th>Marks</th>
                  <th>Online</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {examList.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/exams/${e.id}`} className="font-semibold text-blue-600 hover:underline">
                        {e.title}
                      </Link>
                    </td>
                    <td className="capitalize text-sm">{(e.type || "").replace("_", " ")}</td>
                    <td className="text-sm">{e.classId ? classMap.get(e.classId) : "—"}</td>
                    <td className="text-sm">{formatDate(e.startDate)}</td>
                    <td className="text-sm">{e.totalMarks}</td>
                    <td>{e.isOnline ? <span className="badge badge-blue">Online</span> : <span className="badge badge-slate">Paper</span>}</td>
                    <td>{e.isPublished ? <span className="badge badge-green">Published</span> : <span className="badge badge-yellow">Draft</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
