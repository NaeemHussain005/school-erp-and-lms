import { db } from "@/db";
import {
  students, users, parents, classes, sections, subjects, courses, exams,
  feeInvoices, attendanceRecords, attendanceSessions, schools,
} from "@/db/schema";
import { and, eq, gte, count, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import {
  Users, GraduationCap, Contact, School, Layers, BookOpen,
  BookMarked, ClipboardList, Wallet, CalendarCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

const num = (v: any) => Number(v ?? 0) || 0;

function fmtMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: number | string; tint: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-bold text-slate-800 leading-tight">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

const FEE_BADGE: Record<string, string> = {
  paid: "badge-green", unpaid: "badge-slate", partial: "badge-yellow",
  overdue: "badge-red", cancelled: "badge-slate",
};
const ATT_BADGE: Record<string, string> = {
  present: "badge-green", absent: "badge-red", late: "badge-yellow",
  leave: "badge-blue", holiday: "badge-slate",
};

export default async function ReportsPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  // 30-day window for attendance
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const since = d.toISOString().slice(0, 10);

  const [
    school,
    studentCount, teacherCount, parentCount, classCount,
    sectionCount, subjectCount, courseCount, examCount,
    studentsByClass, feeByStatus, attByStatus,
  ] = await Promise.all([
    db.select({ currency: schools.currency }).from(schools).where(eq(schools.id, schoolId)).limit(1),

    db.select({ v: count() }).from(students).where(and(eq(students.schoolId, schoolId), eq(students.isActive, true))),
    db.select({ v: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher"), eq(users.isActive, true))),
    db.select({ v: count() }).from(parents).where(eq(parents.schoolId, schoolId)),
    db.select({ v: count() }).from(classes).where(eq(classes.schoolId, schoolId)),
    db.select({ v: count() }).from(sections).where(eq(sections.schoolId, schoolId)),
    db.select({ v: count() }).from(subjects).where(eq(subjects.schoolId, schoolId)),
    db.select({ v: count() }).from(courses).where(eq(courses.schoolId, schoolId)),
    db.select({ v: count() }).from(exams).where(eq(exams.schoolId, schoolId)),

    // Students grouped by class
    db
      .select({ classId: students.classId, className: classes.name, total: count() })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(and(eq(students.schoolId, schoolId), eq(students.isActive, true)))
      .groupBy(students.classId, classes.name),

    // Fee invoices grouped by status (count + summed amounts)
    db
      .select({
        status: feeInvoices.status,
        cnt: count(),
        total: sql<string>`coalesce(sum(${feeInvoices.totalAmount}), 0)`,
        paid: sql<string>`coalesce(sum(${feeInvoices.paidAmount}), 0)`,
        balance: sql<string>`coalesce(sum(${feeInvoices.balanceAmount}), 0)`,
      })
      .from(feeInvoices)
      .where(eq(feeInvoices.schoolId, schoolId))
      .groupBy(feeInvoices.status),

    // Attendance (last 30 days) grouped by status
    db
      .select({ status: attendanceRecords.status, cnt: count() })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
      .where(and(eq(attendanceSessions.schoolId, schoolId), gte(attendanceSessions.date, since)))
      .groupBy(attendanceRecords.status),
  ]);

  const currency = school[0]?.currency || "PKR";

  const totalBilled = feeByStatus.reduce((a, r) => a + num(r.total), 0);
  const totalPaid = feeByStatus.reduce((a, r) => a + num(r.paid), 0);
  const totalOutstanding = feeByStatus.reduce((a, r) => a + num(r.balance), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  const classRows = [...studentsByClass].sort((a, b) => b.total - a.total);
  const attTotal = attByStatus.reduce((a, r) => a + r.cnt, 0);

  const cards = [
    { icon: Users, label: "Active Students", value: studentCount[0].v, tint: "bg-blue-50 text-blue-600" },
    { icon: GraduationCap, label: "Teachers", value: teacherCount[0].v, tint: "bg-violet-50 text-violet-600" },
    { icon: Contact, label: "Parents", value: parentCount[0].v, tint: "bg-emerald-50 text-emerald-600" },
    { icon: School, label: "Classes", value: classCount[0].v, tint: "bg-amber-50 text-amber-600" },
    { icon: Layers, label: "Sections", value: sectionCount[0].v, tint: "bg-rose-50 text-rose-600" },
    { icon: BookOpen, label: "Subjects", value: subjectCount[0].v, tint: "bg-cyan-50 text-cyan-600" },
    { icon: BookMarked, label: "Courses", value: courseCount[0].v, tint: "bg-indigo-50 text-indigo-600" },
    { icon: ClipboardList, label: "Exams", value: examCount[0].v, tint: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Report Center" description="A live snapshot of your school's key numbers." />

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} tint={c.tint} />
        ))}
      </div>

      {/* Fee summary */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900">Fee Collection Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Total Billed</div>
            <div className="text-lg font-bold text-slate-800">{fmtMoney(totalBilled, currency)}</div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="text-xs text-slate-500">Collected</div>
            <div className="text-lg font-bold text-emerald-700">{fmtMoney(totalPaid, currency)}</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <div className="text-xs text-slate-500">Outstanding</div>
            <div className="text-lg font-bold text-red-700">{fmtMoney(totalOutstanding, currency)}</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-xs text-slate-500">Collection Rate</div>
            <div className="text-lg font-bold text-blue-700">{collectionRate}%</div>
          </div>
        </div>
        {feeByStatus.length === 0 ? (
          <p className="text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="p-2">Status</th>
                  <th className="p-2">Invoices</th>
                  <th className="p-2">Billed</th>
                  <th className="p-2">Collected</th>
                  <th className="p-2">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {feeByStatus.map((r) => (
                  <tr key={r.status} className="border-b border-slate-100">
                    <td className="p-2"><span className={FEE_BADGE[r.status] || "badge-slate"}>{r.status}</span></td>
                    <td className="p-2 text-slate-700">{r.cnt}</td>
                    <td className="p-2 text-slate-700">{fmtMoney(num(r.total), currency)}</td>
                    <td className="p-2 text-slate-700">{fmtMoney(num(r.paid), currency)}</td>
                    <td className="p-2 text-slate-700">{fmtMoney(num(r.balance), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-column: students by class + attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Students by class */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <School className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900">Students by Class</h3>
          </div>
          {classRows.length === 0 ? (
            <p className="text-sm text-slate-500">No students yet.</p>
          ) : (
            <div className="space-y-2">
              {classRows.map((r) => {
                const max = classRows[0].total || 1;
                const pct = Math.round((r.total / max) * 100);
                return (
                  <div key={String(r.classId)}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{r.className || "Unassigned"}</span>
                      <span className="font-semibold text-slate-800">{r.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance last 30 days */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-slate-900">Attendance <span className="text-xs font-normal text-slate-400">(last 30 days)</span></h3>
          </div>
          {attTotal === 0 ? (
            <p className="text-sm text-slate-500">No attendance records in this period.</p>
          ) : (
            <div className="space-y-2">
              {attByStatus.map((r) => {
                const pct = Math.round((r.cnt / attTotal) * 100);
                return (
                  <div key={r.status} className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
                    <span className={ATT_BADGE[r.status] || "badge-slate"}>{r.status}</span>
                    <span className="text-sm text-slate-700"><b>{r.cnt}</b> <span className="text-slate-400">({pct}%)</span></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
