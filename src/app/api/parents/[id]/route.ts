import { NextResponse } from "next/server";
import { db } from "@/db";
import { parents } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageParents, cleanParentBody, hasAnyParentName } from "@/lib/parents";

// auth + permission + valid id + parent belongs to this school
async function guard(idParam: string) {
  const session: any = await getSession();
  if (!session?.schoolId) return { error: "Unauthorized", status: 401 as const };
  if (!canManageParents(session)) {
    return { error: "You do not have permission to manage parents", status: 403 as const };
  }
  const schoolId = session.schoolId;

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid parent id", status: 400 as const };

  const existing = await db
    .select({ id: parents.id })
    .from(parents)
    .where(and(eq(parents.id, id), eq(parents.schoolId, schoolId)))
    .limit(1);
  if (!existing.length) return { error: "Parent not found", status: 404 as const };

  return { schoolId, id };
}

// PATCH /api/parents/:id  -> update parent
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    const clean = cleanParentBody(await req.json());
    if (!hasAnyParentName(clean)) {
      return NextResponse.json({ error: "Enter at least one name (father, mother or guardian)" }, { status: 400 });
    }

    await db
      .update(parents)
      .set(clean as any)
      .where(and(eq(parents.id, g.id), eq(parents.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update parent error:", err);
    return NextResponse.json({ error: "Could not update parent" }, { status: 500 });
  }
}

// DELETE /api/parents/:id  -> remove parent (student links cascade automatically)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    await db
      .delete(parents)
      .where(and(eq(parents.id, g.id), eq(parents.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete parent error:", err);
    return NextResponse.json({ error: "Could not delete parent" }, { status: 500 });
  }
}
