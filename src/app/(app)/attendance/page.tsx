import { db } from "@/db";
import { classes, sections, students, attendanceSessions, attendanceRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Calendar, Users } from "lucide-react";
import AttendanceMarker from "@/components/AttendanceMarker";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; section?: string; date?: string }>;
}) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const sp = await searchParams;

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const classId = sp.class && !isNaN(parseInt(sp.class)) ? parseInt(sp.class) : null;

  const classList = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.schoolId, schoolId))
    .orderBy(classes.name);

  let sectionList: { id: number; name: string }[] = [];
  if (classId) {
    sectionList = await db
      .select({ id: sections.id, name: sections.name })
      .from(sections)
      .where(and(eq(sections.classId, classId), eq(sections.schoolId, schoolId)))
      .orderBy(sections.name);
  }

  // section: user ne chuna ho, ya class mein sirf ek section ho
  const chosenSection = sp.section && !isNaN(parseInt(sp.section)) ? parseInt(sp.section) : null;
  const sectionId = chosenSection ?? (classId && sectionList.length === 1 ? sectionList[0].id : null);

  let studentList: any[] = [];
  let existingSession: any = null;
  let existingRecords: any[] = [];

  if (classId && sectionId) {
    const sess = await db
      .select()
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.schoolId, schoolId),
          eq(attendanceSessions.date, date),
          eq(attendanceSessions.classId, classId),
          eq(attendanceSessions.sectionId, sectionId)
        )
      )
      .limit(1);
    existingSession = sess[0] || null;

    studentList = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        rollNo: students.rollNo,
        gender: students.gender,
      })
      .from(students)
      .where(
        and(
          eq(students.schoolId, schoolId),
          eq(students.classId, classId),
          eq(students.sectionId, sectionId),
          eq(students.isActive, true)
        )
      )
      .orderBy(
        sql`CASE WHEN ${students.rollNo} ~ '^[0-9]+$' THEN ${students.rollNo}::int END ASC NULLS LAST`,
        students.firstName
      );

    if (existingSession) {
      existingRecords = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.sessionId, existingSession.id));
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Attendance" description="Mark, view and analyze daily attendance." />

      <div className="card p-4 mb-4">
        <form action="/attendance" method="get" className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Class</label>
            <select name="class" defaultValue={classId || ""} className="input" required>
              <option value="">Select class</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select name="section" defaultValue={sectionId || ""} className="input">
              <option value="">{classId ? "Select section" : "Pehle class chunein"}</option>
              {sectionList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" name="date" defaultValue={date} className="input" />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full">
              <Calendar className="w-4 h-4" /> Load
            </button>
          </div>
        </form>
        {classId && !sectionId && (
          <p className="text-sm text-amber-600 mt-3">
            Ab section chunein aur dobara <b>Load</b> dabayein.
          </p>
        )}
      </div>

      {classId && sectionId && studentList.length > 0 && (
        <AttendanceMarker
          key={`${classId}-${sectionId}-${date}`}
          date={date}
          classId={classId}
          sectionId={sectionId}
          students={studentList}
          existingSession={existingSession}
          existingRecords={existingRecords}
          schoolId={schoolId}
        />
      )}

      {classId && sectionId && studentList.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 mx-auto flex items-center justify-center text-amber-600 mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900">Is class/section mein koi student nahi</h3>
          <p className="text-sm text-slate-500 mt-1">
            Student ko Edit karke Class aur Section chunein, phir yahan wapas aayein.
          </p>
        </div>
      )}

      {!classId && (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-blue-600 mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900">Select class, section and date</h3>
          <p className="text-sm text-slate-500 mt-1">Pick a class above to begin marking attendance.</p>
        </div>
      )}
    </div>
  );
}
