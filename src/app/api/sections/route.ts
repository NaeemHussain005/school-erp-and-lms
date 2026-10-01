import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, sections } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const classId = parseInt(body.classId);
    const name = String(body.name || "").trim();
    if (isNaN(classId) || !name) return NextResponse.json({ error: "Class and name are required" }, { status: 400 });

    const cls = await db.select({ id: classes.id }).from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, session.schoolId))).limit(1);
    if (cls.length === 0) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const [created] = await db.insert(sections)
      .values({ schoolId: session.schoolId, classId, name })
      .returning({ id: sections.id });
    return NextResponse.json({ success: true, sectionId: created.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not add section" }, { status: 500 });
  }
}
