import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageAssignments, cleanAssignment, findAssignment } from "@/lib/assignments";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageAssignments(session)) {
      return NextResponse.json({ error: "You do not have permission to edit assignments" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const assignmentId = parseInt(id);
    if (isNaN(assignmentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findAssignment(assignmentId, schoolId))) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const result = await cleanAssignment(await req.json(), schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await db
      .update(assignments)
      .set(result.data as any)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update assignment error:", err);
    return NextResponse.json({ error: "Could not update assignment" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageAssignments(session)) {
      return NextResponse.json({ error: "You do not have permission to delete assignments" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const assignmentId = parseInt(id);
    if (isNaN(assignmentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findAssignment(assignmentId, schoolId))) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    try {
      // submissions are removed automatically (onDelete cascade)
      await db
        .delete(assignments)
        .where(and(eq(assignments.id, assignmentId), eq(assignments.schoolId, schoolId)));
    } catch (e: any) {
      const linked =
        e?.code === "23503" || e?.cause?.code === "23503" || /foreign key/i.test(e?.message || "");
      if (linked) {
        return NextResponse.json(
          { error: "This assignment has linked records and cannot be deleted right now." },
          { status: 400 }
        );
      }
      throw e;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete assignment error:", err);
    return NextResponse.json({ error: "Could not delete assignment" }, { status: 500 });
  }
}
