import { NextResponse } from "next/server";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, desc } from "drizzle-orm";
import { canManageBranches, cleanBranch } from "@/lib/branches";

// GET /api/branches  -> list branches for this school
export async function GET() {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const rows = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        phone: branches.phone,
        email: branches.email,
        isMain: branches.isMain,
        createdAt: branches.createdAt,
      })
      .from(branches)
      .where(eq(branches.schoolId, schoolId))
      .orderBy(desc(branches.isMain), desc(branches.id));

    return NextResponse.json({ branches: rows });
  } catch (err: any) {
    console.error("List branches error:", err);
    return NextResponse.json({ error: "Could not load branches" }, { status: 500 });
  }
}

// POST /api/branches  -> create one branch
export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageBranches(session)) {
      return NextResponse.json({ error: "You do not have permission to manage branches" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = cleanBranch(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;

    // If this one is marked main, clear main on all other branches of this school first
    if (data.isMain) {
      await db
        .update(branches)
        .set({ isMain: false })
        .where(eq(branches.schoolId, schoolId));
    }

    const inserted = await db
      .insert(branches)
      .values({ schoolId, ...data } as any)
      .returning({ id: branches.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create branch error:", err);
    return NextResponse.json({ error: "Could not save branch" }, { status: 500 });
  }
}
