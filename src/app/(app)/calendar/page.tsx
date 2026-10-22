import { db } from "@/db";
import { classes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import CalendarBoard from "@/components/CalendarBoard";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const classList = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.schoolId, schoolId))
    .orderBy(asc(classes.numericLevel), asc(classes.name));

  return <CalendarBoard classes={classList} />;
}
