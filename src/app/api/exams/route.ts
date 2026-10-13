import { NextResponse } from "next/server";
import { db } from "@/db";
import { exams, classes, sections, subjects, academicSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canEnterMarks, EXAM_TYPES } from "@/lib/exams";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canEnterMarks(session)) {
      return NextResponse.json({ error: "You do not have permission to create exams" }, { status: 403 });
    }
    const schoolId = session.schoolId;
    const body = await req.json();

    const title = String(body.title || "").trim().slice(0, 255);
    if (!title) return NextResponse.json({ error: "Exam title is required" }, { status: 400 });

    const type = String(body.type || "");
    if (!EXAM_TYPES.includes(type)) return NextResponse.json({ error: "Select an exam type" }, { status: 400 });

    const classId = parseInt(body.classId);
    if (isNaN(classId)) return NextResponse.json({ error: "Select a class" }, { status: 400 });

    const totalMarks = parseInt(body.totalMarks);
    if (isNaN(totalMarks) || totalMarks <= 0 || totalMarks > 1000) {
      return NextResponse.json({ error: "Total marks must be between 1 and 1000" }, { status: 400 });
    }
    const passMarks = parseInt(body.passMarks);
    if (isNaN(passMarks) || passMarks < 0 || passMarks > totalMarks) {
      return NextResponse.json({ error: "Pass marks must be between 0 and total marks" }, { status: 400 });
    }

    const cls = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)))
      .limit(1);
    if (cls.length === 0) return NextResponse.json({ error: "Class not found" }, { status: 400 });

    let sectionId: number | null = null;
    if (body.sectionId) {
      const sid = parseInt(body.sectionId);
      const sec = await db
        .select({ id: sections.id })
        .from(sections)
        .where(and(eq(sections.id, sid), eq(sections.classId, classId), eq(sections.schoolId, schoolId)))
        .limit(1);
      if (sec.length === 0) return NextResponse.json({ error: "Section not found in this class" }, { status: 400 });
      sectionId = sid;
    }

    let subjectId: number | null = null;
    if (body.subjectId) {
      const sub = parseInt(body.subjectId);
      const subRows = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(and(eq(subjects.id, sub), eq(subjects.schoolId, schoolId)))
        .limit(1);
      if (subRows.length === 0) return NextResponse.json({ error: "Subject not found" }, { status: 400 });
      subjectId = sub;
    }

    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.startDate || "")) ? String(body.startDate) : null;

    const current = await db
      .select({ id: academicSessions.id })
      .from(academicSessions)
      .where(and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.isCurrent, true)))
      .limit(1);

    const inserted = await db
      .insert(exams)
      .values({
        schoolId,
        title,
        type,
        classId,
        sectionId,
        subjectId,
        academicSessionId: current[0]?.id ?? null,
        startDate,
        totalMarks,
        passMarks,
        isOnline: false,
        isPublished: false,
        createdById: session.userId ?? session.id ?? null,
      } as any)
      .returning({ id: exams.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create exam error:", err);
    return NextResponse.json({ error: "Could not create exam" }, { status: 500 });
  }
}
