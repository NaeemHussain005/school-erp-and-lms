import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, sections } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const [created] = await db
      .insert(classes)
      .values({
        schoolId: session.schoolId,
        name: body.name,
        numericLevel: body.numericLevel || null,
      })
      .returning({ id: classes.id });

    const secs: string[] = Array.isArray(body.sections) ? body.sections : [];
    if (secs.length > 0) {
      await db.insert(sections).values(
        secs.map((name) => ({
          schoolId: session.schoolId,
          classId: created.id,
          name,
        }))
      );
    }

    return NextResponse.json({ success: true, classId: created.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
