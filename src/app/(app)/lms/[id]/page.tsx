import { notFound } from "next/navigation";
import { db } from "@/db";
import { classes, sections, subjects, modules, lessons } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import CourseForm from "@/components/CourseForm";
import CourseActions from "@/components/CourseActions";
import CourseContent, { ModuleItem } from "@/components/CourseContent";
import { canManageLms, findCourse } from "@/lib/lms";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session: any = await requireAuth();
  const schoolId = session.schoolId!;
  const { id } = await params;
  const courseId = parseInt(id);
  if (isNaN(courseId)) return notFound();

  const course = await findCourse(courseId, schoolId);
  if (!course) return notFound();
  const manage = canManageLms(session);
  if (!manage && !course.isPublished) return notFound();

  const [classRows, sectionRows, subjectRows, modRows, lessonRows] = await Promise.all([
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)).orderBy(asc(classes.name)),
    db.select({ id: sections.id, classId: sections.classId, name: sections.name }).from(sections).where(eq(sections.schoolId, schoolId)).orderBy(asc(sections.name)),
    db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.schoolId, schoolId)).orderBy(asc(subjects.name)),
    db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.orderIndex), asc(modules.id)),
    db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.orderIndex), asc(lessons.id)),
  ]);

  const className = classRows.find((c) => c.id === course.classId)?.name || "";
  const sectionName = sectionRows.find((s) => s.id === course.sectionId)?.name || "";
  const subjectName = subjectRows.find((s) => s.id === course.subjectId)?.name || "";

  const items: ModuleItem[] = modRows.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description || "",
    lessons: lessonRows
      .filter((l) => l.moduleId === m.id && (manage || l.isPublished !== false))
      .map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description || "",
        content: l.content || "",
        videoUrl: l.videoUrl || "",
        pdfUrl: l.pdfUrl || "",
        externalUrl: l.externalUrl || "",
        isPublished: l.isPublished !== false,
      })),
  }));
  const lessonCount = items.reduce((t, m) => t + m.lessons.length, 0);

  const dates =
    course.startDate || course.endDate
      ? `${course.startDate ? formatDate(course.startDate) : "—"} - ${course.endDate ? formatDate(course.endDate) : "—"}`
      : "";
  const description = [`${className} ${sectionName}`.trim(), subjectName, dates].filter(Boolean).join(" · ");

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <PageHeader title={course.title} description={description || "Course"} backHref="/lms">
        {manage && <CourseActions courseId={course.id} isPublished={!!course.isPublished} />}
      </PageHeader>

      <div className="flex items-center gap-3 text-sm">
        <span className={course.isPublished ? "badge badge-green" : "badge badge-yellow"}>
          {course.isPublished ? "Published" : "Draft"}
        </span>
        <span className="text-slate-500">
          {items.length} module{items.length === 1 ? "" : "s"} · {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
        </span>
      </div>

      {course.description && <p className="text-slate-700 whitespace-pre-line">{course.description}</p>}

      <CourseContent courseId={course.id} modules={items} canEdit={manage} />

      {manage && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-blue-600 mb-3">Edit course details</summary>
          <CourseForm
            courseId={course.id}
            classes={classRows}
            sections={sectionRows}
            subjects={subjectRows}
            initial={{
              title: course.title || "",
              description: course.description || "",
              classId: course.classId ? String(course.classId) : "",
              sectionId: course.sectionId ? String(course.sectionId) : "",
              subjectId: course.subjectId ? String(course.subjectId) : "",
              startDate: course.startDate || "",
              endDate: course.endDate || "",
            }}
          />
        </details>
      )}
    </div>
  );
}
