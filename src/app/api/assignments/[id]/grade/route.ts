import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignmentSubmissions, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageAssignments, cleanGrade, findAssignment } from "@/lib/assignments";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageAssignments(session)) {
      return NextResponse.json({ error: "You do not have permission to grade assignments" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const assignmentId = parseInt(id);
    if (isNaN(assignmentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const assignment = await findAssignment(assignmentId, schoolId);
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const body = await req.json();

    // validate the student belongs to this school
    const studentId = parseInt(body?.studentId);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid student" }, { status: 400 });
    const stu = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
      .limit(1);
    if (stu.length === 0) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const result = cleanGrade(body, assignment.totalMarks ?? 100);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const isGraded = result.data.status === "graded";
    const marksValue = result.data.marks === null ? null : String(result.data.marks);

    // does a submission row already exist?
    const existing = await db
      .select({ id: assignmentSubmissions.id })
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          eq(assignmentSubmissions.studentId, studentId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(assignmentSubmissions)
        .set({
          marks: marksValue,
          feedback: result.data.feedback,
          status: result.data.status as any,
          gradedById: session.id ?? null,
          gradedAt: isGraded ? new Date() : null,
        })
        .where(eq(assignmentSubmissions.id, existing[0].id));
    } else {
      await db.insert(assignmentSubmissions).values({
        assignmentId,
        studentId,
        marks: marksValue,
        feedback: result.data.feedback,
        status: result.data.status as any,
        gradedById: session.id ?? null,
        gradedAt: isGraded ? new Date() : null,
      } as any);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Grade error:", err);
    return NextResponse.json({ error: "Could not save grade" }, { status: 500 });
  }
}
