import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageAnnouncements, cleanAnnouncement } from "@/lib/announcements";

// auth + permission + valid id + announcement belongs to this school
async function guard(idParam: string) {
  const session: any = await getSession();
  if (!session?.schoolId) return { error: "Unauthorized", status: 401 as const };
  if (!canManageAnnouncements(session)) {
    return { error: "You do not have permission to manage messages", status: 403 as const };
  }
  const schoolId = session.schoolId;

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid message id", status: 400 as const };

  const existing = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(and(eq(announcements.id, id), eq(announcements.schoolId, schoolId)))
    .limit(1);
  if (!existing.length) return { error: "Message not found", status: 404 as const };

  return { schoolId, id };
}

// PATCH /api/messages/:id  -> edit one announcement
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    const result = cleanAnnouncement(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await db
      .update(announcements)
      .set(result.data as any)
      .where(and(eq(announcements.id, g.id), eq(announcements.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update announcement error:", err);
    return NextResponse.json({ error: "Could not update message" }, { status: 500 });
  }
}

// DELETE /api/messages/:id  -> remove one announcement
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    await db
      .delete(announcements)
      .where(and(eq(announcements.id, g.id), eq(announcements.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete announcement error:", err);
    return NextResponse.json({ error: "Could not delete message" }, { status: 500 });
  }
}
