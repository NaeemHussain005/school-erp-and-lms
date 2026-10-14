import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageLms, cleanCourse, findCourse } from "@/lib/lms";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to edit courses" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findCourse(courseId, schoolId))) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await req.json();

    // publish / unpublish only
    if (typeof body?.isPublished === "boolean" && Object.keys(body).length === 1) {
      await db
        .update(courses)
        .set({ isPublished: body.isPublished, updatedAt: new Date() })
        .where(and(eq(courses.id, courseId), eq(courses.schoolId, schoolId)));
      return NextResponse.json({ success: true });
    }

    const result = await cleanCourse(body, schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await db
      .update(courses)
      .set({ ...result.data, updatedAt: new Date() } as any)
      .where(and(eq(courses.id, courseId), eq(courses.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update course error:", err);
    return NextResponse.json({ error: "Could not update course" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to delete courses" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findCourse(courseId, schoolId))) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    try {
      // modules, lessons and enrollments are removed automatically (onDelete cascade)
      await db.delete(courses).where(and(eq(courses.id, courseId), eq(courses.schoolId, schoolId)));
    } catch (e: any) {
      const linked = e?.code === "23503" || e?.cause?.code === "23503" || /foreign key/i.test(e?.message || "");
      if (linked) {
        return NextResponse.json(
          { error: "This course is linked to assignments, so it cannot be deleted. Please Unpublish it instead." },
          { status: 400 }
        );
      }
      throw e;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete course error:", err);
    return NextResponse.json({ error: "Could not delete course" }, { status: 500 });
  }
}
