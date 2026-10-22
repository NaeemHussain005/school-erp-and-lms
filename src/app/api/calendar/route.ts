import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, classes } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { canManageEvents, cleanEvent } from "@/lib/events";

// GET /api/calendar  -> list events for this school (soonest-created first)
export async function GET() {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        location: events.location,
        audience: events.audience,
        classId: events.classId,
        startDate: events.startDate,
        endDate: events.endDate,
        createdAt: events.createdAt,
        className: classes.name,
      })
      .from(events)
      .leftJoin(classes, eq(events.classId, classes.id))
      .where(eq(events.schoolId, schoolId))
      .orderBy(desc(events.startDate));

    return NextResponse.json({ events: rows });
  } catch (err: any) {
    console.error("List events error:", err);
    return NextResponse.json({ error: "Could not load events" }, { status: 500 });
  }
}

// POST /api/calendar  -> create one event
export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageEvents(session)) {
      return NextResponse.json({ error: "You do not have permission to manage events" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = cleanEvent(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;

    const inserted = await db
      .insert(events)
      .values({
        schoolId,
        ...data,
        createdById: session.id ?? null,
      } as any)
      .returning({ id: events.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: "Could not save event" }, { status: 500 });
  }
}
