import { db } from "@/db";
import { classes, sections, subjects, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, asc } from "drizzle-orm";
import TimetableBoard from "@/components/TimetableBoard";

export const dynamic = "force-dynamic";

export default async function TimetablePage() {
  const session: any = await getSession();
  const schoolId = session?.schoolId;

  if (!schoolId) {
    return (
      <div className="animate-fade-in">
        <div className="card p-6 text-sm text-slate-500">
          Please sign in to view the timetable.
        </div>
      </div>
    );
  }

  const [classList, sectionList, subjectList, teacherRows] = await Promise.all([
    db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(asc(classes.numericLevel), asc(classes.name)),
    db
      .select({ id: sections.id, name: sections.name, classId: sections.classId })
      .from(sections)
      .where(eq(sections.schoolId, schoolId))
      .orderBy(asc(sections.name)),
    db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(eq(subjects.schoolId, schoolId))
      .orderBy(asc(subjects.name)),
    db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.role, "teacher"),
          eq(users.isActive, true),
        ),
      )
      .orderBy(asc(users.firstName)),
  ]);

  const teachers = teacherRows.map((t) => ({
    id: t.id,
    name: [t.firstName, t.lastName].filter(Boolean).join(" ").trim() || `Teacher #${t.id}`,
  }));

  return (
    <TimetableBoard
      classes={classList}
      sections={sectionList}
      subjects={subjectList}
      teachers={teachers}
    />
  );
}
