import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceSessions, attendanceRecords } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const schoolId = session.schoolId;
    if (!schoolId) return NextResponse.json({ error: "No school" }, { status: 400 });

    const { date, classId, sectionId, records, existingSessionId } = body;
    if (!date || !classId || !sectionId || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let sessionId = existingSessionId;
    if (!sessionId) {
      const inserted = await db
        .insert(attendanceSessions)
        .values({
          schoolId,
          date,
          classId,
          sectionId,
          markedById: session.id,
          markedAt: new Date(),
          type: "student",
        })
        .returning({ id: attendanceSessions.id });
      sessionId = inserted[0].id;
    } else {
      // Clear old records to re-save
      await db.delete(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
    }

    if (records.length > 0) {
      await db.insert(attendanceRecords).values(
        records.map((r: any) => ({
          sessionId,
          studentId: r.studentId,
          status: r.status,
          reason: r.reason || null,
        }))
      );
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
