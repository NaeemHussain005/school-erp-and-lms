import { db } from "@/db";
import { classes, sections, subjects, courses, assignments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const ASSIGNMENT_MANAGER_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "teacher",
];

export function canManageAssignments(session: any) {
  return !!session?.isSuperAdmin || ASSIGNMENT_MANAGER_ROLES.includes(session?.role);
}

export async function findAssignment(id: number, schoolId: number) {
  const rows = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.schoolId, schoolId)))
    .limit(1);
  return rows[0];
}

export async function cleanAssignment(
  body: any,
  schoolId: number
): Promise<
  | { error: string }
  | {
      data: {
        title: string;
        description: string | null;
        instructions: string | null;
        classId: number | null;
        sectionId: number | null;
        subjectId: number | null;
        courseId: number | null;
        dueDate: Date | null;
        totalMarks: number;
        allowLateSubmission: boolean;
      };
    }
> {
  const title = String(body?.title || "").trim();
  if (!title) return { error: "Assignment title is required" };
  if (title.length > 255) return { error: "Title is too long" };

  const description = String(body?.description || "").trim().slice(0, 5000) || null;
  const instructions = String(body?.instructions || "").trim().slice(0, 5000) || null;

  // total marks
  let totalMarks = parseInt(body?.totalMarks);
  if (isNaN(totalMarks) || totalMarks <= 0) totalMarks = 100;
  if (totalMarks > 10000) totalMarks = 10000;

  // due date (from datetime-local)
  let dueDate: Date | null = null;
  if (body?.dueDate) {
    const d = new Date(String(body.dueDate));
    if (isNaN(d.getTime())) return { error: "Invalid due date" };
    dueDate = d;
  }

  let classId: number | null = null;
  let sectionId: number | null = null;
  let subjectId: number | null = null;
  let courseId: number | null = null;

  if (body?.classId) {
    const id = parseInt(body.classId);
    if (isNaN(id)) return { error: "Invalid class" };
    const rows = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return { error: "Class not found" };
    classId = id;
  }

  if (body?.sectionId) {
    if (!classId) return { error: "Select a class before choosing a section" };
    const id = parseInt(body.sectionId);
    if (isNaN(id)) return { error: "Invalid section" };
    const rows = await db
      .select({ id: sections.id })
      .from(sections)
      .where(and(eq(sections.id, id), eq(sections.classId, classId), eq(sections.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return { error: "Section not found in this class" };
    sectionId = id;
  }

  if (body?.subjectId) {
    const id = parseInt(body.subjectId);
    if (isNaN(id)) return { error: "Invalid subject" };
    const rows = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return { error: "Subject not found" };
    subjectId = id;
  }

  if (body?.courseId) {
    const id = parseInt(body.courseId);
    if (isNaN(id)) return { error: "Invalid course" };
    const rows = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return { error: "Course not found" };
    courseId = id;
  }

  return {
    data: {
      title,
      description,
      instructions,
      classId,
      sectionId,
      subjectId,
      courseId,
      dueDate,
      totalMarks,
      allowLateSubmission: body?.allowLateSubmission === true || body?.allowLateSubmission === "true",
    },
  };
}
