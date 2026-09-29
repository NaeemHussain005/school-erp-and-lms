import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { classSubjects, classes, subjects, assignments, exams } from "@/db/schema";
import PageHeader from "@/components/PageHeader";
import { GraduationCap, FileText, Calendar, BookOpen, ClipboardList, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const session = await requireAuth();
  const teacherId = session.id;
  const schoolId = session.schoolId!;

  const [mySubjects, myAssignments, myExams] = await Promise.all([
    db
      .select({
        id: classSubjects.id,
        subjectId: classSubjects.subjectId,
        classId: classSubjects.classId,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(classSubjects)
      .leftJoin(classes, eq(classes.id, classSubjects.classId))
      .leftJoin(subjects, eq(subjects.id, classSubjects.subjectId))
      .where(and(eq(classSubjects.teacherId, teacherId), eq(classSubjects.schoolId, schoolId))),
    db
      .select({ id: assignments.id, title: assignments.title, dueDate: assignments.dueDate })
      .from(assignments)
      .where(and(eq(assignments.createdById, teacherId), eq(assignments.schoolId, schoolId)))
      .orderBy(desc(assignments.createdAt))
      .limit(5),
    db
      .select({ id: exams.id, title: exams.title, startDate: exams.startDate, className: classes.name })
      .from(exams)
      .leftJoin(classes, eq(classes.id, exams.classId))
      .where(and(eq(exams.createdById, teacherId), eq(exams.schoolId, schoolId)))
      .orderBy(exams.startDate)
      .limit(5),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`Welcome, ${session.firstName || "Teacher"} 👋`}
        description="Your classes, assignments and exams at a glance."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat icon={GraduationCap} label="My Subjects" value={mySubjects.length} color="bg-blue-50 text-blue-600" href="/teacher/classes" />
        <Stat icon={FileText} label="Assignments" value={myAssignments.length} color="bg-violet-50 text-violet-600" href="/assignments" />
        <Stat icon={ClipboardList} label="My Exams" value={myExams.length} color="bg-rose-50 text-rose-600" href="/exams" />
        <Stat icon={Calendar} label="Mark Attendance" value="→" color="bg-emerald-50 text-emerald-600" href="/attendance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" /> My Assigned Subjects</h3>
          {mySubjects.length === 0 ? (
            <p className="text-sm text-slate-500">No subjects assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {mySubjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <div>
                    <div className="font-semibold text-sm">{s.subjectName || "—"}</div>
                    <div className="text-xs text-slate-500">{s.className}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /> Upcoming Exams</h3>
          {myExams.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming exams.</p>
          ) : (
            <div className="space-y-2">
              {myExams.map((e) => (
                <Link key={e.id} href={`/exams/${e.id}`} className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100">
                  <div className="font-semibold text-sm">{e.title}</div>
                  <div className="text-xs text-slate-500">{formatDate(e.startDate)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, href }: any) {
  return (
    <Link href={href} className="card-hover p-5 block">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Link>
  );
}
