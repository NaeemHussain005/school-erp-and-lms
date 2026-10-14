import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canEnterMarks } from "@/lib/exams";
import { cleanQuestion } from "@/lib/questions";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canEnterMarks(session)) {
      return NextResponse.json({ error: "You do not have permission to add questions" }, { status: 403 });
    }

    const result = await cleanQuestion(await req.json(), session.schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const inserted = await db
      .insert(questions)
      .values({
        schoolId: session.schoolId,
        ...result.data,
        createdById: session.userId ?? session.id ?? null,
        isApproved: true,
      } as any)
      .returning({ id: questions.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create question error:", err);
    return NextResponse.json({ error: "Could not save question" }, { status: 500 });
  }
}
