import { db } from "@/db";
import { classes, sections } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import MessagesBoard from "@/components/MessagesBoard";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const [classList, sectionList] = await Promise.all([
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
  ]);

  return <MessagesBoard classes={classList} sections={sectionList} />;
}
