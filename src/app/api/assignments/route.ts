import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canManageAssignments, cleanAssignment } from "@/lib/assignments";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageAssignments(session)) {
      return NextResponse.json({ error: "You do not have permission to create assignments" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = await cleanAssignment(await req.json(), schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const inserted = await db
      .insert(assignments)
      .values({
        schoolId,
        ...result.data,
        createdById: session.id ?? null,
      } as any)
      .returning({ id: assignments.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create assignment error:", err);
    return NextResponse.json({ error: "Could not create assignment" }, { status: 500 });
  }
}
