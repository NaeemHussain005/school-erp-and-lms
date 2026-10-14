import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canEnterMarks } from "@/lib/exams";
import { cleanQuestion } from "@/lib/questions";

async function exists(id: number, schoolId: number) {
  const rows = await db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.id, id), eq(questions.schoolId, schoolId)))
    .limit(1);
  return rows.length > 0;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canEnterMarks(session)) {
      return NextResponse.json({ error: "You do not have permission to edit questions" }, { status: 403 });
    }

    const { id } = await params;
    const qid = parseInt(id);
    if (isNaN(qid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await exists(qid, session.schoolId))) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    const result = await cleanQuestion(await req.json(), session.schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await db
      .update(questions)
      .set(result.data as any)
      .where(and(eq(questions.id, qid), eq(questions.schoolId, session.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update question error:", err);
    return NextResponse.json({ error: "Could not update question" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canEnterMarks(session)) {
      return NextResponse.json({ error: "You do not have permission to delete questions" }, { status: 403 });
    }

    const { id } = await params;
    const qid = parseInt(id);
    if (isNaN(qid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await exists(qid, session.schoolId))) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    await db.delete(questions).where(and(eq(questions.id, qid), eq(questions.schoolId, session.schoolId)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete question error:", err);
    return NextResponse.json({ error: "Could not delete question" }, { status: 500 });
  }
}
