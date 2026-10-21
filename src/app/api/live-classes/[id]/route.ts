import { NextResponse } from "next/server";
import { db } from "@/db";
import { liveClasses } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageLms, cleanLiveClass } from "@/lib/lms";

async function findLiveClass(id: number, schoolId: number) {
  const rows = await db
    .select({ id: liveClasses.id })
    .from(liveClasses)
    .where(and(eq(liveClasses.id, id), eq(liveClasses.schoolId, schoolId)))
    .limit(1);
  return rows[0];
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to edit classes" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const classId = parseInt(id);
    if (isNaN(classId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findLiveClass(classId, schoolId))) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const body = await req.json();

    // cancel / un-cancel only
    if (typeof body?.isCancelled === "boolean" && Object.keys(body).length === 1) {
      await db
        .update(liveClasses)
        .set({ isCancelled: body.isCancelled })
        .where(and(eq(liveClasses.id, classId), eq(liveClasses.schoolId, schoolId)));
      return NextResponse.json({ success: true });
    }

    const result = await cleanLiveClass(body, schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await db
      .update(liveClasses)
      .set(result.data as any)
      .where(and(eq(liveClasses.id, classId), eq(liveClasses.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update live class error:", err);
    return NextResponse.json({ error: "Could not update class" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to delete classes" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const classId = parseInt(id);
    if (isNaN(classId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findLiveClass(classId, schoolId))) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    await db
      .delete(liveClasses)
      .where(and(eq(liveClasses.id, classId), eq(liveClasses.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete live class error:", err);
    return NextResponse.json({ error: "Could not delete class" }, { status: 500 });
  }
}
