import { NextResponse } from "next/server";
import { db } from "@/db";
import { modules, lessons } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageLms, cleanLesson, cleanModule, findCourse } from "@/lib/lms";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return bad("Unauthorized", 401);
    if (!canManageLms(session)) return bad("You do not have permission to edit course content", 403);

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) return bad("Invalid id");
    if (!(await findCourse(courseId, session.schoolId))) return bad("Course not found", 404);

    const body = await req.json();
    const action = String(body?.action || "");

    // ---- modules ----
    if (action === "addModule") {
      const r = cleanModule(body);
      if ("error" in r) return bad(r.error);
      const existing = await db.select({ id: modules.id }).from(modules).where(eq(modules.courseId, courseId));
      await db.insert(modules).values({ courseId, ...r.data, orderIndex: existing.length } as any);
      return NextResponse.json({ success: true });
    }

    if (action === "updateModule" || action === "deleteModule") {
      const moduleId = parseInt(body?.moduleId);
      if (isNaN(moduleId)) return bad("Invalid module");
      const mod = await db
        .select({ id: modules.id })
        .from(modules)
        .where(and(eq(modules.id, moduleId), eq(modules.courseId, courseId)))
        .limit(1);
      if (mod.length === 0) return bad("Module not found", 404);

      if (action === "deleteModule") {
        // lessons inside are removed automatically (onDelete cascade)
        await db.delete(modules).where(eq(modules.id, moduleId));
        return NextResponse.json({ success: true });
      }

      const r = cleanModule(body);
      if ("error" in r) return bad(r.error);
      await db.update(modules).set(r.data).where(eq(modules.id, moduleId));
      return NextResponse.json({ success: true });
    }

    // ---- lessons ----
    if (action === "addLesson") {
      const moduleId = parseInt(body?.moduleId);
      if (isNaN(moduleId)) return bad("Invalid module");
      const mod = await db
        .select({ id: modules.id })
        .from(modules)
        .where(and(eq(modules.id, moduleId), eq(modules.courseId, courseId)))
        .limit(1);
      if (mod.length === 0) return bad("Module not found", 404);

      const r = cleanLesson(body);
      if ("error" in r) return bad(r.error);
      const existing = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.moduleId, moduleId));
      await db.insert(lessons).values({ moduleId, courseId, ...r.data, orderIndex: existing.length } as any);
      return NextResponse.json({ success: true });
    }

    if (action === "updateLesson" || action === "deleteLesson") {
      const lessonId = parseInt(body?.lessonId);
      if (isNaN(lessonId)) return bad("Invalid lesson");
      const les = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
        .limit(1);
      if (les.length === 0) return bad("Lesson not found", 404);

      if (action === "deleteLesson") {
        await db.delete(lessons).where(eq(lessons.id, lessonId));
        return NextResponse.json({ success: true });
      }

      const r = cleanLesson(body);
      if ("error" in r) return bad(r.error);
      await db
        .update(lessons)
        .set({ ...r.data, updatedAt: new Date() } as any)
        .where(eq(lessons.id, lessonId));
      return NextResponse.json({ success: true });
    }

    return bad("Unknown action");
  } catch (err: any) {
    console.error("Course content error:", err);
    return bad("Could not save changes", 500);
  }
}
