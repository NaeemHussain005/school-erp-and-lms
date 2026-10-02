import { NextResponse } from "next/server";
import { db } from "@/db";
import { parents, students, studentParents } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageParents } from "@/lib/parents";

async function loadParent(parentId: number, schoolId: number) {
  const rows = await db
    .select()
    .from(parents)
    .where(and(eq(parents.id, parentId), eq(parents.schoolId, schoolId)))
    .limit(1);
  return rows[0];
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageParents(session)) {
      return NextResponse.json({ error: "You do not have permission to link students" }, { status: 403 });
    }

    const { id } = await params;
    const parentId = parseInt(id);
    const body = await req.json();
    const studentId = parseInt(body.studentId);
    if (isNaN(parentId) || isNaN(studentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const parent = await loadParent(parentId, session.schoolId);
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const stu = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, session.schoolId)))
      .limit(1);
    if (stu.length === 0) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const existing = await db
      .select({ id: studentParents.id })
      .from(studentParents)
      .where(and(eq(studentParents.parentId, parentId), eq(studentParents.studentId, studentId)))
      .limit(1);
    if (existing.length > 0) return NextResponse.json({ error: "Already linked" }, { status: 400 });

    await db.insert(studentParents).values({
      studentId,
      parentId,
      isPrimary: true,
      relationship: parent.relation || "father",
    } as any);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Link student error:", err);
    return NextResponse.json({ error: "Could not link student" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageParents(session)) {
      return NextResponse.json({ error: "You do not have permission to unlink students" }, { status: 403 });
    }

    const { id } = await params;
    const parentId = parseInt(id);
    const studentId = parseInt(new URL(req.url).searchParams.get("studentId") || "");
    if (isNaN(parentId) || isNaN(studentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const parent = await loadParent(parentId, session.schoolId);
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    await db
      .delete(studentParents)
      .where(and(eq(studentParents.parentId, parentId), eq(studentParents.studentId, studentId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Unlink student error:", err);
    return NextResponse.json({ error: "Could not unlink student" }, { status: 500 });
  }
}
