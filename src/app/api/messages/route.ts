import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements, classes } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, desc } from "drizzle-orm";
import { canManageAnnouncements, cleanAnnouncement } from "@/lib/announcements";

// GET /api/messages  -> list announcements for this school (newest first)
export async function GET() {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        message: announcements.message,
        audience: announcements.audience,
        classId: announcements.classId,
        sectionId: announcements.sectionId,
        priority: announcements.priority,
        startDate: announcements.startDate,
        endDate: announcements.endDate,
        createdAt: announcements.createdAt,
        className: classes.name,
      })
      .from(announcements)
      .leftJoin(classes, eq(announcements.classId, classes.id))
      .where(eq(announcements.schoolId, schoolId))
      .orderBy(desc(announcements.id));

    return NextResponse.json({ announcements: rows });
  } catch (err: any) {
    console.error("List announcements error:", err);
    return NextResponse.json({ error: "Could not load messages" }, { status: 500 });
  }
}

// POST /api/messages  -> create one announcement
export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageAnnouncements(session)) {
      return NextResponse.json({ error: "You do not have permission to post messages" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = cleanAnnouncement(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;

    const inserted = await db
      .insert(announcements)
      .values({
        schoolId,
        ...data,
        createdById: session.id ?? null,
      } as any)
      .returning({ id: announcements.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create announcement error:", err);
    return NextResponse.json({ error: "Could not save message" }, { status: 500 });
  }
}
