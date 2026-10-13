import { NextResponse } from "next/server";
import { db } from "@/db";
import { exams, results } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canAdminExams } from "@/lib/exams";

async function loadExam(examId: number, schoolId: number) {
  const rows = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.schoolId, schoolId)))
    .limit(1);
  return rows[0];
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canAdminExams(session)) {
      return NextResponse.json({ error: "You do not have permission to publish results" }, { status: 403 });
    }

    const { id } = await params;
    const examId = parseInt(id);
    if (isNaN(examId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const exam = await loadExam(examId, session.schoolId);
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const body = await req.json();
    if (typeof body.isPublished !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await db
      .update(exams)
      .set({ isPublished: body.isPublished })
      .where(and(eq(exams.id, examId), eq(exams.schoolId, session.schoolId)));
    await db
      .update(results)
      .set({ isPublished: body.isPublished })
      .where(and(eq(results.examId, examId), eq(results.schoolId, session.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Publish exam error:", err);
    return NextResponse.json({ error: "Could not update exam" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canAdminExams(session)) {
      return NextResponse.json({ error: "You do not have permission to delete exams" }, { status: 403 });
    }

    const { id } = await params;
    const examId = parseInt(id);
    if (isNaN(examId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const exam = await loadExam(examId, session.schoolId);
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const existing = await db.select({ id: results.id }).from(results).where(eq(results.examId, examId)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "This exam already has marks entered, so it cannot be deleted" }, { status: 400 });
    }

    await db.delete(exams).where(and(eq(exams.id, examId), eq(exams.schoolId, session.schoolId)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete exam error:", err);
    return NextResponse.json({ error: "Could not delete exam" }, { status: 500 });
  }
}
