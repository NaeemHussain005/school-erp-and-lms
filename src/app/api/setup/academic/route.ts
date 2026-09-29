import { NextResponse } from "next/server";
import { db } from "@/db";
import { academicSessions, classes, sections, setupProgress } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const schoolId = session.schoolId;

    // Create academic session
    const [sess] = await db
      .insert(academicSessions)
      .values({
        schoolId,
        name: body.sessionName,
        startDate: new Date().toISOString().slice(0, 10),
        isActive: true,
        isCurrent: true,
      })
      .onConflictDoNothing()
      .returning({ id: academicSessions.id });

    const sessionId = sess?.id;

    // Mark all other sessions as not current
    if (sessionId) {
      await db
        .update(academicSessions)
        .set({ isCurrent: false })
        .where(eq(academicSessions.schoolId, schoolId));
      await db
        .update(academicSessions)
        .set({ isCurrent: true, isActive: true })
        .where(eq(academicSessions.id, sessionId));
    }

    // Create classes
    const classNames: string[] = (body.classes || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const sectionNames: string[] = (body.sectionsPerClass || "A")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Check which classes already exist
    const existingClasses = await db
      .select({ name: classes.name })
      .from(classes)
      .where(eq(classes.schoolId, schoolId));
    const existingNames = new Set(existingClasses.map((c) => c.name.toLowerCase()));

    for (const cName of classNames) {
      if (existingNames.has(cName.toLowerCase())) continue;
      const numericMatch = cName.match(/(\d+)/);
      const numericLevel = numericMatch ? parseInt(numericMatch[1]) : null;
      const [created] = await db
        .insert(classes)
        .values({
          schoolId,
          name: cName,
          numericLevel,
        })
        .returning({ id: classes.id });
      if (created && sectionNames.length > 0) {
        await db.insert(sections).values(
          sectionNames.map((sName) => ({
            schoolId,
            classId: created.id,
            name: sName,
          }))
        );
      }
    }

    await db
      .update(setupProgress)
      .set({ academicStructure: true, updatedAt: new Date() })
      .where(eq(setupProgress.schoolId, schoolId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
