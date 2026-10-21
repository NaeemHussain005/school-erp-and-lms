import { db } from "@/db";
import { liveClasses, classes, sections, subjects, users } from "@/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import LiveClassManager from "@/components/LiveClassManager";
import { canManageLms, LMS_MANAGER_ROLES } from "@/lib/lms";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const session: any = await requireAuth();
  const schoolId = session.schoolId!;
  const manage = canManageLms(session);

  const [liveRows, classRows, sectionRows, subjectRows, teacherRows] = await Promise.all([
    db
      .select()
      .from(liveClasses)
      .where(eq(liveClasses.schoolId, schoolId))
      .orderBy(desc(liveClasses.scheduledAt), desc(liveClasses.id))
      .limit(300),
    db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(asc(classes.name)),
    db
      .select({ id: sections.id, classId: sections.classId, name: sections.name })
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
      .where(and(eq(users.schoolId, schoolId), inArray(users.role, LMS_MANAGER_ROLES as any)))
      .orderBy(asc(users.firstName)),
  ]);

  const classMap = new Map(classRows.map((c) => [c.id, c.name]));
  const sectionMap = new Map(sectionRows.map((s) => [s.id, s.name]));
  const subjectMap = new Map(subjectRows.map((s) => [s.id, s.name]));
  const teacherMap = new Map(
    teacherRows.map((t) => [t.id, [t.firstName, t.lastName].filter(Boolean).join(" ") || "Staff"])
  );

  const teachers = teacherRows.map((t) => ({
    id: t.id,
    name: [t.firstName, t.lastName].filter(Boolean).join(" ") || "Staff",
  }));

  const now = Date.now();

  const items = liveRows.map((lc) => {
    const scheduled = lc.scheduledAt ? new Date(lc.scheduledAt) : null;
    const endMs = scheduled
      ? scheduled.getTime() + (lc.durationMinutes || 45) * 60 * 1000
      : null;
    return {
      id: lc.id,
      title: lc.title,
      classId: lc.classId,
      sectionId: lc.sectionId,
      subjectId: lc.subjectId,
      teacherId: lc.teacherId,
      className: lc.classId ? classMap.get(lc.classId) || "" : "",
      sectionName: lc.sectionId ? sectionMap.get(lc.sectionId) || "" : "",
      subjectName: lc.subjectId ? subjectMap.get(lc.subjectId) || "" : "",
      teacherName: lc.teacherId ? teacherMap.get(lc.teacherId) || "" : "",
      meetingUrl: lc.meetingUrl || "",
      provider: lc.provider || "external",
      scheduledAt: scheduled ? scheduled.toISOString() : null,
      durationMinutes: lc.durationMinutes || 45,
      description: lc.description || "",
      isCancelled: !!lc.isCancelled,
      isPast: endMs ? endMs < now : false,
    };
  });

  return (
    <div className="animate-fade-in">
      <LiveClassManager
        items={items}
        classes={classRows}
        sections={sectionRows}
        subjects={subjectRows}
        teachers={teachers}
        canManage={manage}
      />
    </div>
  );
}
