import { db } from "@/db";
import {
  students,
  users,
  feeInvoices,
  feePayments,
  exams,
  assignments,
  courses,
  attendanceSessions,
  attendanceRecords,
  announcements,
  setupProgress,
  classes,
  sections,
  parents,
  branches,
  academicSessions,
} from "@/db/schema";
import { and, eq, gte, sql, count, sum, desc, isNotNull } from "drizzle-orm";
import { requireAuth, getSetupProgress } from "@/lib/auth";
import { formatCurrency, formatDate, studentFullName } from "@/lib/utils";
import Link from "next/link";
import {
  Users as UsersIcon,
  UserCheck,
  Wallet,
  Calendar,
  GraduationCap,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Megaphone,
  ClipboardList,
  UserPlus,
  Receipt,
  QrCode,
  Upload,
  BellRing,
} from "lucide-react";
import QuickActions from "@/components/QuickActions";
import SetupWidget from "@/components/SetupWidget";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const [
    studentCountRes,
    teacherCountRes,
    parentCountRes,
    activeStudentCountRes,
    newThisMonthRes,
  ] = await Promise.all([
    db.select({ c: count() }).from(students).where(eq(students.schoolId, schoolId)),
    db.select({ c: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher"))),
    db.select({ c: count() }).from(parents).where(eq(parents.schoolId, schoolId)),
    db.select({ c: count() }).from(students).where(and(eq(students.schoolId, schoolId), eq(students.isActive, true))),
    db
      .select({ c: count() })
      .from(students)
      .where(
        and(
          eq(students.schoolId, schoolId),
          gte(students.admissionDate, sql`CURRENT_DATE - INTERVAL '30 days'`)
        )
      ),
  ]);

  const totalStudents = studentCountRes[0]?.c || 0;
  const totalTeachers = teacherCountRes[0]?.c || 0;
  const totalParents = parentCountRes[0]?.c || 0;
  const activeStudents = activeStudentCountRes[0]?.c || 0;
  const newThisMonth = newThisMonthRes[0]?.c || 0;

  // Fees
  const [todayColRes, monthColRes, outstandingRes, overdueRes] = await Promise.all([
    db
      .select({ total: sql<number>`COALESCE(SUM(${feePayments.amount}),0)` })
      .from(feePayments)
      .where(
        and(eq(feePayments.schoolId, schoolId), sql`${feePayments.createdAt}::date = CURRENT_DATE`)
      ),
    db
      .select({ total: sql<number>`COALESCE(SUM(${feePayments.amount}),0)` })
      .from(feePayments)
      .where(
        and(
          eq(feePayments.schoolId, schoolId),
          gte(feePayments.createdAt, sql`DATE_TRUNC('month', CURRENT_DATE)`)
        )
      ),
    db
      .select({ total: sql<number>`COALESCE(SUM(${feeInvoices.balanceAmount}),0)` })
      .from(feeInvoices)
      .where(
        and(
          eq(feeInvoices.schoolId, schoolId),
          sql`${feeInvoices.balanceAmount} > 0`,
          sql`${feeInvoices.status} != 'cancelled'`
        )
      ),
    db
      .select({ total: sql<number>`COALESCE(SUM(${feeInvoices.balanceAmount}),0)` })
      .from(feeInvoices)
      .where(
        and(
          eq(feeInvoices.schoolId, schoolId),
          sql`${feeInvoices.balanceAmount} > 0`,
          sql`${feeInvoices.dueDate} < CURRENT_DATE`,
          sql`${feeInvoices.status} != 'cancelled'`
        )
      ),
  ]);

  const todayCollection = Number(todayColRes[0]?.total || 0);
  const monthCollection = Number(monthColRes[0]?.total || 0);
  const outstanding = Number(outstandingRes[0]?.total || 0);
  const overdue = Number(overdueRes[0]?.total || 0);

  // Attendance today
  let todayPresent = 0;
  let todayAbsent = 0;
  let todayTotal = 0;
  const todaySession = await db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.schoolId, schoolId),
        sql`${attendanceSessions.date} = CURRENT_DATE`
      )
    )
    .limit(1);

  if (todaySession.length > 0) {
    const att = await db
      .select({ status: attendanceRecords.status, c: count() })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, todaySession[0].id))
      .groupBy(attendanceRecords.status);
    for (const a of att) {
      todayTotal += Number(a.c);
      if (a.status === "present") todayPresent += Number(a.c);
      else if (a.status === "absent") todayAbsent += Number(a.c);
    }
  }

  const attendanceRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

  // Upcoming exams
  const upcomingExams = await db
    .select({
      id: exams.id,
      title: exams.title,
      type: exams.type,
      startDate: exams.startDate,
      className: sql<string>`(SELECT name FROM classes WHERE id = ${exams.classId})`,
    })
    .from(exams)
    .where(
      and(
        eq(exams.schoolId, schoolId),
        sql`${exams.startDate} >= CURRENT_DATE`,
        eq(exams.isPublished, true)
      )
    )
    .orderBy(exams.startDate)
    .limit(5);

  // Recent announcements
  const recentAnnouncements = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      priority: announcements.priority,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(eq(announcements.schoolId, schoolId))
    .orderBy(desc(announcements.createdAt))
    .limit(4);

  const setup = await getSetupProgress(schoolId);
  const stepsCompleted =
    (setup.schoolInfo ? 1 : 0) +
    (setup.academicStructure ? 1 : 0)
    + (setup.staff ? 1 : 0)
    + (setup.students ? 1 : 0)
    + (setup.parents ? 1 : 0)
    + (setup.fees ? 1 : 0)
    + (setup.exams ? 1 : 0);
  const setupPercent = Math.round((stepsCompleted / 7) * 100);

  // Quick stats
  const [examCountRes, courseCountRes, assignmentCountRes] = await Promise.all([
    db.select({ c: count() }).from(exams).where(eq(exams.schoolId, schoolId)),
    db.select({ c: count() }).from(courses).where(eq(courses.schoolId, schoolId)),
    db.select({ c: count() }).from(assignments).where(eq(assignments.schoolId, schoolId)),
  ]);
  const totalExams = examCountRes[0]?.c || 0;
  const totalCourses = courseCountRes[0]?.c || 0;
  const totalAssignments = assignmentCountRes[0]?.c || 0;

  const statCards = [
    { label: "Total Students", value: totalStudents, delta: `+${newThisMonth} this month`, icon: UsersIcon, color: "from-blue-500 to-blue-600", href: "/students" },
    { label: "Teachers", value: totalTeachers, delta: "active staff", icon: UserCheck, color: "from-violet-500 to-violet-600", href: "/staff" },
    { label: "Today's Collection", value: formatCurrency(todayCollection), delta: formatCurrency(monthCollection) + " this month", icon: Wallet, color: "from-emerald-500 to-emerald-600", href: "/fees/payments" },
    { label: "Outstanding Fees", value: formatCurrency(outstanding), delta: formatCurrency(overdue) + " overdue", icon: AlertCircle, color: overdue > 0 ? "from-amber-500 to-orange-600" : "from-slate-400 to-slate-500", href: "/fees/invoices" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome back{session.firstName ? `, ${session.firstName}` : ""} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening at your school today.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/setup-wizard" className="btn-secondary">
            <Sparkles className="w-4 h-4" /> Setup Wizard
          </Link>
          <Link href="/students/new" className="btn-primary">
            <UserPlus className="w-4 h-4" /> Add Student
          </Link>
        </div>
      </div>

      {setupPercent < 100 && <SetupWidget percent={setupPercent} stepsCompleted={stepsCompleted} setup={setup} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="card-hover p-5 block">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.delta}</div>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-sm`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary stats + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniCard icon={Calendar} label="Today Attendance" value={`${attendanceRate}%`} sub={`${todayPresent} of ${todayTotal}`} color="text-blue-600 bg-blue-50" href="/attendance" />
          <MiniCard icon={CheckCircle2} label="Active Students" value={activeStudents} sub={totalStudents ? `${Math.round((activeStudents/totalStudents)*100)}% active` : "—"} color="text-emerald-600 bg-emerald-50" href="/students" />
          <MiniCard icon={GraduationCap} label="Exams" value={totalExams} sub="total" color="text-violet-600 bg-violet-50" href="/exams" />
          <MiniCard icon={BookOpen} label="Courses" value={totalCourses} sub="published" color="text-amber-600 bg-amber-50" href="/lms" />
          <MiniCard icon={FileText} label="Assignments" value={totalAssignments} sub="created" color="text-rose-600 bg-rose-50" href="/assignments" />
          <MiniCard icon={UserCheck} label="Parents" value={totalParents} sub="contacts" color="text-indigo-600 bg-indigo-50" href="/parents" />
          <MiniCard icon={ClipboardList} label="New Admissions" value={newThisMonth} sub="last 30 days" color="text-cyan-600 bg-cyan-50" href="/students" />
          <MiniCard icon={Wallet} label="This Month" value={formatCurrency(monthCollection).replace("PKR ", "PKR\n")} sub="collected" color="text-emerald-600 bg-emerald-50" href="/fees/payments" />
        </div>
        <QuickActions />
      </div>

      {/* Exams + announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Upcoming Exams
            </h3>
            <Link href="/exams" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {upcomingExams.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No upcoming exams"
              desc="When you schedule exams, they'll appear here."
              href="/exams/new"
              cta="Create Exam"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingExams.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{e.title}</div>
                    <div className="text-sm text-slate-500">
                      {e.className} · {(e.type || "").replace("_", " ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">{formatDate(e.startDate)}</div>
                    <Link href={`/exams/${e.id}`} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5">
                      View <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-violet-600" /> Announcements
            </h3>
            <Link href="/announcements" className="text-sm text-blue-600 hover:underline">
              New
            </Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="No announcements yet"
              desc="Share important news with teachers, parents and students."
              href="/announcements"
              cta="Create"
              compact
            />
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-900 text-sm">{a.title}</div>
                    <span className={`badge ${a.priority === "high" ? "badge-red" : "badge-blue"}`}>
                      {a.priority}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{formatDate(a.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ icon: Icon, label, value, sub, color, href }: any) {
  return (
    <Link href={href} className="card p-4 block hover:border-slate-300 transition">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="text-lg font-bold text-slate-900 mt-0.5 whitespace-pre-line leading-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, desc, href, cta, compact }: any) {
  return (
    <div className={`text-center ${compact ? "py-6" : "py-10"}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-semibold text-slate-900">{title}</div>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">{desc}</p>
      {href && (
        <Link href={href} className="btn-primary mt-4 text-sm">
          {cta}
        </Link>
      )}
    </div>
  );
}
