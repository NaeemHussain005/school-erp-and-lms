import { NextResponse } from "next/server";
import { db } from "@/db";
import { sections, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const sectionId = parseInt(id);
    if (isNaN(sectionId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [cnt] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(students)
      .where(and(eq(students.sectionId, sectionId), eq(students.schoolId, session.schoolId)));
    if ((cnt?.n || 0) > 0) {
      return NextResponse.json({ error: `${cnt.n} student(s) are in this section.` }, { status: 400 });
    }
    await db.delete(sections).where(and(eq(sections.id, sectionId), eq(sections.schoolId, session.schoolId)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not delete section" }, { status: 500 });
  }
}
