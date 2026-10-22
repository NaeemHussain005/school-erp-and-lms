import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageEvents, cleanEvent } from "@/lib/events";

// auth + permission + valid id + event belongs to this school
async function guard(idParam: string) {
  const session: any = await getSession();
  if (!session?.schoolId) return { error: "Unauthorized", status: 401 as const };
  if (!canManageEvents(session)) {
    return { error: "You do not have permission to manage events", status: 403 as const };
  }
  const schoolId = session.schoolId;

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid event id", status: 400 as const };

  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.schoolId, schoolId)))
    .limit(1);
  if (!existing.length) return { error: "Event not found", status: 404 as const };

  return { schoolId, id };
}

// PATCH /api/calendar/:id  -> edit one event
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    const result = cleanEvent(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await db
      .update(events)
      .set(result.data as any)
      .where(and(eq(events.id, g.id), eq(events.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update event error:", err);
    return NextResponse.json({ error: "Could not update event" }, { status: 500 });
  }
}

// DELETE /api/calendar/:id  -> remove one event
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    await db
      .delete(events)
      .where(and(eq(events.id, g.id), eq(events.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete event error:", err);
    return NextResponse.json({ error: "Could not delete event" }, { status: 500 });
  }
}
