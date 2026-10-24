import { NextResponse } from "next/server";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, ne } from "drizzle-orm";
import { canManageBranches, cleanBranch } from "@/lib/branches";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return bad("Unauthorized", 401);
    if (!canManageBranches(session)) return bad("You do not have permission to manage branches", 403);
    const schoolId = session.schoolId;

    const body = await req.json();
    const action = String(body?.action || "");

    const existing = await db
      .select({ id: branches.id, name: branches.name, isMain: branches.isMain })
      .from(branches)
      .where(eq(branches.schoolId, schoolId));

    if (action === "create") {
      const r = cleanBranch(body);
      if ("error" in r) return bad(r.error);
      if (existing.some((b) => b.name.trim().toLowerCase() === r.data.name.toLowerCase())) {
        return bad("A branch with this name already exists");
      }

      // the very first branch is always the main branch
      const makeMain = r.data.isMain || existing.length === 0;
      const inserted = await db
        .insert(branches)
        .values({ schoolId, ...r.data, isMain: makeMain } as any)
        .returning({ id: branches.id });

      if (makeMain && existing.length > 0) {
        await db
          .update(branches)
          .set({ isMain: false })
          .where(and(eq(branches.schoolId, schoolId), ne(branches.id, inserted[0].id)));
      }
      return NextResponse.json({ success: true, id: inserted[0].id });
    }

    const id = parseInt(body?.id);
    if (isNaN(id)) return bad("Invalid id");
    const row = existing.find((b) => b.id === id);
    if (!row) return bad("Branch not found", 404);

    if (action === "delete") {
      if (row.isMain) return bad("This is the main branch. Make another branch the main branch first, then delete this one.");
      try {
        await db.delete(branches).where(and(eq(branches.id, id), eq(branches.schoolId, schoolId)));
      } catch (e: any) {
        const linked = e?.code === "23503" || e?.cause?.code === "23503" || /foreign key/i.test(e?.message || "");
        if (linked) {
          return bad("This branch still has students, staff or other records linked to it, so it cannot be deleted.");
        }
        throw e;
      }
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const r = cleanBranch(body);
      if ("error" in r) return bad(r.error);
      if (existing.some((b) => b.id !== id && b.name.trim().toLowerCase() === r.data.name.toLowerCase())) {
        return bad("Another branch already has this name");
      }

      // the main branch stays main; to change it, make another branch main
      const makeMain = row.isMain || r.data.isMain;
      await db
        .update(branches)
        .set({ ...r.data, isMain: makeMain })
        .where(and(eq(branches.id, id), eq(branches.schoolId, schoolId)));

      if (makeMain && !row.isMain) {
        await db
          .update(branches)
          .set({ isMain: false })
          .where(and(eq(branches.schoolId, schoolId), ne(branches.id, id)));
      }
      return NextResponse.json({ success: true });
    }

    return bad("Unknown action");
  } catch (err: any) {
    console.error("Branch error:", err);
    return bad("Could not save branch", 500);
  }
}
