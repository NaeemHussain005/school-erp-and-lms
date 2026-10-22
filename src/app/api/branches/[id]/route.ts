import { NextResponse } from "next/server";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, ne } from "drizzle-orm";
import { canManageBranches, cleanBranch } from "@/lib/branches";

// auth + permission + valid id + branch belongs to this school
async function guard(idParam: string) {
  const session: any = await getSession();
  if (!session?.schoolId) return { error: "Unauthorized", status: 401 as const };
  if (!canManageBranches(session)) {
    return { error: "You do not have permission to manage branches", status: 403 as const };
  }
  const schoolId = session.schoolId;

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid branch id", status: 400 as const };

  const existing = await db
    .select({ id: branches.id })
    .from(branches)
    .where(and(eq(branches.id, id), eq(branches.schoolId, schoolId)))
    .limit(1);
  if (!existing.length) return { error: "Branch not found", status: 404 as const };

  return { schoolId, id };
}

// PATCH /api/branches/:id  -> edit one branch
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    const result = cleanBranch(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;

    // If this one becomes main, clear main on all OTHER branches of this school
    if (data.isMain) {
      await db
        .update(branches)
        .set({ isMain: false })
        .where(and(eq(branches.schoolId, g.schoolId), ne(branches.id, g.id)));
    }

    await db
      .update(branches)
      .set(data as any)
      .where(and(eq(branches.id, g.id), eq(branches.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update branch error:", err);
    return NextResponse.json({ error: "Could not update branch" }, { status: 500 });
  }
}

// DELETE /api/branches/:id  -> remove one branch
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

    await db
      .delete(branches)
      .where(and(eq(branches.id, g.id), eq(branches.schoolId, g.schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete branch error:", err);
    return NextResponse.json({ error: "Could not delete branch" }, { status: 500 });
  }
}
