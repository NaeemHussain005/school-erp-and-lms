import { db } from "@/db";
import { classes, sections, subjects, courses, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const LMS_MANAGER_ROLES = ["super_admin", "school_admin", "principal", "vice_principal", "teacher"];

export function canManageLms(session: any) {
  return !!session?.isSuperAdmin || LMS_MANAGER_ROLES.includes(session?.role);
}

export function cleanUrl(v: any): string | null | "invalid" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (s.length > 2000) return "invalid";
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "invalid";
    return s;
  } catch {
    return "invalid";
  }
}

export async function findCourse(id: number, schoolId: number) {
  const rows = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.schoolId, schoolId)))
    .limit(1);
  return rows[0];
}

export function cleanModule(
  body: any
): { error: string } | { data: { title: string; description: string | null } } {
  const title = String(body?.title || "").trim();
  if (!title) return { error: "Module title is required" };
  if (title.length > 255) return { error: "Title is too long" };
  const description = String(body?.description || "").trim().slice(0, 2000) || null;
  return { data: { title, description } };
}

export function cleanLesson(body: any):
  | { error: string }
  | {
      data: {
        title: string;
        description: string | null;
        content: string | null;
        videoUrl: string | null;
        pdfUrl: string | null;
        externalUrl: string | null;
        isPublished: boolean;
      };
    } {
  const title = String(body?.title || "").trim();
  if (!title) return { error: "Lesson title is required" };
  if (title.length > 255) return { error: "Title is too long" };
  const description = String(body?.description || "").trim().slice(0, 2000) || null;
  const content = String(body?.content || "").trim().slice(0, 20000) || null;

  const videoUrl = cleanUrl(body?.videoUrl);
  if (videoUrl === "invalid") return { error: "Video link must start with http:// or https://" };
  const pdfUrl = cleanUrl(body?.pdfUrl);
  if (pdfUrl === "invalid") return { error: "PDF link must start with http:// or https://" };
  const externalUrl = cleanUrl(body?.externalUrl);
  if (externalUrl === "invalid") return { error: "Other link must start with http:// or https://" };

  return {
    data: { title, description, content, videoUrl, pdfUrl, externalUrl, isPublished: body?.isPublished !== false },
  };
}

export async function cleanCourse(
  body: any,
  schoolId: number
): Promise<{ error: string } | { data: any }> {
  const title = String(body?.title || "").trim();
  if (!title) return { error: "Course title is required" };
  if (title.length > 255) return { error: "Title is too long" };
  const description = String(body?.description || "").trim().slice(0, 5000) || null;

  let classId: number | null = null;
  let sectionId: number | null = null;
  let subjectId: number | null = null;

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

  const datePat = /^\d{4}-\d{2}-\d{2}$/;
  const startDate = datePat.test(String(body?.startDate || "")) ? String(body.startDate) : null;
  const endDate = datePat.test(String(body?.endDate || "")) ? String(body.endDate) : null;
  if (startDate && endDate && endDate < startDate) return { error: "End date cannot be before start date" };

  return { data: { title, description, classId, sectionId, subjectId, startDate, endDate } };
}
// ============ MATERIALS LIBRARY ============
export const MATERIAL_TYPES = [
  "pdf",
  "video",
  "document",
  "link",
  "worksheet",
  "past_paper",
  "book",
] as const;

export async function cleanMaterial(
  body: any,
  schoolId: number
): Promise<
  | { error: string }
  | {
      data: {
        title: string;
        description: string | null;
        type: string;
        subjectId: number | null;
        classId: number | null;
        fileUrl: string | null;
        externalUrl: string | null;
        isPublic: boolean;
      };
    }
> {
  const title = String(body?.title || "").trim();
  if (!title) return { error: "Material title is required" };
  if (title.length > 255) return { error: "Title is too long" };

  const type = String(body?.type || "").trim();
  if (!MATERIAL_TYPES.includes(type as any)) {
    return { error: "Please choose a valid material type" };
  }

  const description = String(body?.description || "").trim().slice(0, 2000) || null;

  const fileUrl = cleanUrl(body?.fileUrl);
  if (fileUrl === "invalid") return { error: "File link must start with http:// or https://" };
  const externalUrl = cleanUrl(body?.externalUrl);
  if (externalUrl === "invalid") return { error: "External link must start with http:// or https://" };

  // At least one link so students have something to open
  if (!fileUrl && !externalUrl) {
    return { error: "Add at least a file link or an external link" };
  }

  let classId: number | null = null;
  let subjectId: number | null = null;

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

  return {
    data: {
      title,
      description,
      type,
      subjectId,
      classId,
      fileUrl,
      externalUrl,
      isPublic: body?.isPublic === true || body?.isPublic === "true",
    },
  };
}
// ============ LIVE CLASSES ============
export async function cleanLiveClass(
  body: any,
  schoolId: number
): Promise<
  | { error: string }
  | {
      data: {
        title: string;
        classId: number | null;
        sectionId: number | null;
        subjectId: number | null;
        teacherId: number | null;
        meetingUrl: string | null;
        provider: string;
        scheduledAt: Date | null;
        durationMinutes: number;
        description: string | null;
      };
    }
> {
  const title = String(body?.title || "").trim();
  if (!title) return { error: "Class title is required" };
  if (title.length > 255) return { error: "Title is too long" };

  const description = String(body?.description || "").trim().slice(0, 2000) || null;
  const provider = String(body?.provider || "external").trim().slice(0, 50) || "external";

  const meetingUrl = cleanUrl(body?.meetingUrl);
  if (meetingUrl === "invalid") return { error: "Meeting link must start with http:// or https://" };

  // scheduled date-time (from a datetime-local input)
  let scheduledAt: Date | null = null;
  if (body?.scheduledAt) {
    const d = new Date(String(body.scheduledAt));
    if (isNaN(d.getTime())) return { error: "Invalid date/time" };
    scheduledAt = d;
  }

  let duration = parseInt(body?.durationMinutes);
  if (isNaN(duration) || duration <= 0) duration = 45;
  if (duration > 600) duration = 600;

  let classId: number | null = null;
  let sectionId: number | null = null;
  let subjectId: number | null = null;
  let teacherId: number | null = null;

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

  if (body?.teacherId) {
    const id = parseInt(body.teacherId);
    if (isNaN(id)) return { error: "Invalid teacher" };
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return { error: "Teacher not found" };
    teacherId = id;
  }

  return {
    data: {
      title,
      classId,
      sectionId,
      subjectId,
      teacherId,
      meetingUrl,
      provider,
      scheduledAt,
      durationMinutes: duration,
      description,
    },
  };
}
