import { NextResponse } from "next/server";
import { db } from "@/db";
import { timetableSlots, subjects, users, academicSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, desc } from "drizzle-orm";
import { canManageTimetable, cleanSlot, findSlotConflict } from "@/lib/timetable";

// GET /api/timetable?classId=..&sectionId=..  -> slots for that class+section
export async function GET(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const { searchParams } = new URL(req.url);
    const classId = Number(searchParams.get("classId"));
    const sectionId = Number(searchParams.get("sectionId"));

    // No class/section chosen yet -> nothing to show
    if (!classId || !sectionId) return NextResponse.json({ slots: [] });

    const rows = await db
      .select({
        id: timetableSlots.id,
        classId: timetableSlots.classId,
        sectionId: timetableSlots.sectionId,
        subjectId: timetableSlots.subjectId,
        teacherId: timetableSlots.teacherId,
        dayOfWeek: timetableSlots.dayOfWeek,
        periodNo: timetableSlots.periodNo,
        startTime: timetableSlots.startTime,
        endTime: timetableSlots.endTime,
        roomNo: timetableSlots.roomNo,
        subjectName: subjects.name,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
      })
      .from(timetableSlots)
      .leftJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
      .leftJoin(users, eq(timetableSlots.teacherId, users.id))
      .where(
        and(
          eq(timetableSlots.schoolId, schoolId),
          eq(timetableSlots.classId, classId),
          eq(timetableSlots.sectionId, sectionId),
        ),
      );

    const slots = rows.map((r) => {
      const name = [r.teacherFirstName, r.teacherLastName].filter(Boolean).join(" ").trim();
      return {
        id: r.id,
        classId: r.classId,
        sectionId: r.sectionId,
        subjectId: r.subjectId,
        teacherId: r.teacherId,
        dayOfWeek: r.dayOfWeek,
        periodNo: r.periodNo,
        startTime: r.startTime,
        endTime: r.endTime,
        roomNo: r.roomNo,
        subjectName: r.subjectName ?? "—",
        teacherName: name.length ? name : "—",
      };
    });

    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error("List timetable error:", err);
    return NextResponse.json({ error: "Could not load timetable" }, { status: 500 });
  }
}

// POST /api/timetable  -> create one slot
export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageTimetable(session)) {
      return NextResponse.json({ error: "You do not have permission to manage the timetable" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = cleanSlot(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;

    const conflict = await findSlotConflict({
      schoolId,
      classId: data.classId,
      sectionId: data.sectionId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      periodNo: data.periodNo,
    });
    if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });

    // Attach the current academic session for this school, if one is set
    const currentSession = await db
      .select({ id: academicSessions.id })
      .from(academicSessions)
      .where(and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.isCurrent, true)))
      .orderBy(desc(academicSessions.id))
      .limit(1);
    const academicSessionId = currentSession[0]?.id ?? null;

    const inserted = await db
      .insert(timetableSlots)
      .values({
        schoolId,
        ...data,
        academicSessionId,
      } as any)
      .returning({ id: timetableSlots.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create timetable slot error:", err);
    return NextResponse.json({ error: "Could not create slot" }, { status: 500 });
  }
}
