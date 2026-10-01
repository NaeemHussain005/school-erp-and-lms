import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, sections, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const classId = parseInt(id);
    if (isNaN(classId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [cnt] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(students)
      .where(and(eq(students.classId, classId), eq(students.schoolId, session.schoolId)));
    if ((cnt?.n || 0) > 0) {
      return NextResponse.json({ error: `${cnt.n} student(s) are in this class. Move them first.` }, { status: 400 });
    }

    await db.delete(sections).where(and(eq(sections.classId, classId), eq(sections.schoolId, session.schoolId)));
    await db.delete(classes).where(and(eq(classes.id, classId), eq(classes.schoolId, session.schoolId)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not delete class" }, { status: 500 });
  }
}
