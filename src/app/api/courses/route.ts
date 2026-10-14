import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, academicSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageLms, cleanCourse } from "@/lib/lms";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to create courses" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = await cleanCourse(await req.json(), schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const current = await db
      .select({ id: academicSessions.id })
      .from(academicSessions)
      .where(and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.isCurrent, true)))
      .limit(1);

    const inserted = await db
      .insert(courses)
      .values({
        schoolId,
        ...result.data,
        teacherId: session.userId ?? session.id ?? null,
        academicSessionId: current[0]?.id ?? null,
        isPublished: false,
      } as any)
      .returning({ id: courses.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create course error:", err);
    return NextResponse.json({ error: "Could not create course" }, { status: 500 });
  }
}
