import { NextResponse } from "next/server";
import { db } from "@/db";
import { liveClasses } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canManageLms, cleanLiveClass } from "@/lib/lms";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to schedule classes" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = await cleanLiveClass(await req.json(), schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const inserted = await db
      .insert(liveClasses)
      .values({
        schoolId,
        ...result.data,
      } as any)
      .returning({ id: liveClasses.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create live class error:", err);
    return NextResponse.json({ error: "Could not schedule class" }, { status: 500 });
  }
}
