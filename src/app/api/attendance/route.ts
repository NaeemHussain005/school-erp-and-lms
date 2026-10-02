import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceSessions, attendanceRecords, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";

const VALID = ["present", "absent", "late", "leave"];

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;
    const body = await req.json();

    const classId = parseInt(body.classId);
    const sectionId = parseInt(body.sectionId);
    const date = String(body.date || "");
    if (isNaN(classId) || isNaN(sectionId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Class, section and date are required" }, { status: 400 });
    }
    const records: { studentId: number; status: string; reason?: string }[] = Array.isArray(body.records) ? body.records : [];
    if (records.length === 0) return NextResponse.json({ error: "No records" }, { status: 400 });

    const ids = records.map((r) => Number(r.studentId)).filter((n) => !isNaN(n));
    const valid = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), inArray(students.id, ids)));
    const validIds = new Set(valid.map((v) => v.id));

    const found = await db
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

    const userId = session.userId ?? session.id ?? null;
    let sessionId: number;
    if (found.length > 0) {
      sessionId = found[0].id;
      await db
        .update(attendanceSessions)
        .set({ markedById: userId, markedAt: new Date() })
        .where(eq(attendanceSessions.id, sessionId));
      await db.delete(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
    } else {
      const [created] = await db
        .insert(attendanceSessions)
        .values({
          schoolId,
          date,
          classId,
          sectionId,
          type: "student",
          markedById: userId,
        } as any)
        .returning({ id: attendanceSessions.id });
      sessionId = created.id;
    }

    const rows = records
      .filter((r) => validIds.has(Number(r.studentId)) && VALID.includes(r.status))
      .map((r) => ({ sessionId, studentId: Number(r.studentId), status: r.status as any, reason: r.reason || null }));
    if (rows.length > 0) await db.insert(attendanceRecords).values(rows);

    return NextResponse.json({ success: true, sessionId, saved: rows.length });
  } catch (err: any) {
    console.error("Attendance error:", err);
    return NextResponse.json({ error: err.message || "Could not save attendance" }, { status: 500 });
  }
}
