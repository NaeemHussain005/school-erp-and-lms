import { notFound } from "next/navigation";
import { db } from "@/db";
import { classes, sections, subjects } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import CourseForm from "@/components/CourseForm";
import { canManageLms } from "@/lib/lms";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const session: any = await requireAuth();
  if (!canManageLms(session)) return notFound();
  const schoolId = session.schoolId!;

  const [classRows, sectionRows, subjectRows] = await Promise.all([
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)).orderBy(asc(classes.name)),
    db.select({ id: sections.id, classId: sections.classId, name: sections.name }).from(sections).where(eq(sections.schoolId, schoolId)).orderBy(asc(sections.name)),
    db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.schoolId, schoolId)).orderBy(asc(subjects.name)),
  ]);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title="New Course" description="Create the course, then add modules and lessons on the next screen." backHref="/lms" />
      <CourseForm classes={classRows} sections={sectionRows} subjects={subjectRows} />
    </div>
  );
}
