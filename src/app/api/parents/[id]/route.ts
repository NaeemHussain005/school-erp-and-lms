import { NextResponse } from "next/server";
import { db } from "@/db";
import { parents } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageParents, cleanParentBody, hasAnyParentName } from "@/lib/parents";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageParents(session)) {
      return NextResponse.json({ error: "You do not have permission to edit parents" }, { status: 403 });
    }

    const { id } = await params;
    const parentId = parseInt(id);
    if (isNaN(parentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const rows = await db
      .select({ id: parents.id })
      .from(parents)
      .where(and(eq(parents.id, parentId), eq(parents.schoolId, session.schoolId)))
      .limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const clean = cleanParentBody(await req.json());
    if (!hasAnyParentName(clean)) {
      return NextResponse.json({ error: "Enter at least one name (father, mother or guardian)" }, { status: 400 });
    }

    await db
      .update(parents)
      .set(clean as any)
      .where(and(eq(parents.id, parentId), eq(parents.schoolId, session.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update parent error:", err);
    return NextResponse.json({ error: "Could not update parent" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageParents(session)) {
      return NextResponse.json({ error: "You do not have permission to delete parents" }, { status: 403 });
    }

    const { id } = await params;
    const parentId = parseInt(id);
    if (isNaN(parentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const rows = await db
      .select({ id: parents.id })
      .from(parents)
      .where(and(eq(parents.id, parentId), eq(parents.schoolId, session.schoolId)))
      .limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    // links to students are removed automatically (onDelete cascade)
    await db.delete(parents).where(and(eq(parents.id, parentId), eq(parents.schoolId, session.schoolId)));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete parent error:", err);
    return NextResponse.json({ error: "Could not delete parent" }, { status: 500 });
  }
}
