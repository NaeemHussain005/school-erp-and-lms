import { NextResponse } from "next/server";
import { db } from "@/db";
import { parents } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canManageParents, cleanParentBody, hasAnyParentName } from "@/lib/parents";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageParents(session)) {
      return NextResponse.json({ error: "You do not have permission to add parents" }, { status: 403 });
    }

    const body = await req.json();
    const clean = cleanParentBody(body);
    if (!hasAnyParentName(clean)) {
      return NextResponse.json({ error: "Enter at least one name (father, mother or guardian)" }, { status: 400 });
    }

    const inserted = await db
      .insert(parents)
      .values({ schoolId: session.schoolId, ...clean } as any)
      .returning({ id: parents.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create parent error:", err);
    return NextResponse.json({ error: "Could not save parent" }, { status: 500 });
  }
}
