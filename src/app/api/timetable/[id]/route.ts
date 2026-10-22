import { NextResponse } from "next/server";
import { db } from "@/db";
import { timetableSlots } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageTimetable, cleanSlot, findSlotConflict } from "@/lib/timetable";

// Shared: auth + permission + valid id + slot belongs to this school.
// Returns { error, status } on failure, or { schoolId, id } on success.
async function guard(idParam: string) {
  const session: any = await getSession();
  if (!session?.schoolId) return { error: "Unauthorized", status: 401 as const };
  if (!canManageTimetable(session)) {
    return { error: "You do not have permission to manage the timetable", status: 403 as const };
  }
  const schoolId = session.schoolId;

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid slot id", status: 400 as const };

  const existing = await db
    .select({ id: timetableSlots.id })
    .from(timetableSlots)
    .where(and(eq(timetableSlots.id, id), eq(timetableSlots.schoolId, schoolId)))
    .limit(1);
  if (!existing.length) return { error: "Slot not found", status: 404 as const };

  return { schoolId, id };
}

// PATCH /api/timetable/:id  -> edit one slot
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    const result = cleanSlot(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;

    const conflict = await findSlotConflict({
      schoolId: g.schoolId,
      classId: data.classId,
      sectionId: data.sectionId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      periodNo: data.periodNo,
      excludeId: g.id,
    });
    if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });

    await db
      .update(timetableSlots)
      .set(data as any)
      .where(and(eq(timetableSlots.id, g.id), eq(timetableSlots.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update timetable slot error:", err);
    return NextResponse.json({ error: "Could not update slot" }, { status: 500 });
  }
}

// DELETE /api/timetable/:id  -> remove one slot
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    await db
      .delete(timetableSlots)
      .where(and(eq(timetableSlots.id, g.id), eq(timetableSlots.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete timetable slot error:", err);
    return NextResponse.json({ error: "Could not delete slot" }, { status: 500 });
  }
}
