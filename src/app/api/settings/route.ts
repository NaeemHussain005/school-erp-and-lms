import { NextResponse } from "next/server";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ school: {} });
    const [school] = await db.select().from(schools).where(eq(schools.id, session.schoolId)).limit(1);
    return NextResponse.json({ school: school || {} });
  } catch (err) {
    return NextResponse.json({ school: {} });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const allowed = new Set([
      "name", "logoUrl", "faviconUrl", "address", "phone", "email", "website",
      "principal", "registrationNo", "morningStart", "morningEnd", "currency",
      "timezone", "footerText", "primaryColor", "secondaryColor", "themePreset",
    ]);
    const update: any = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    await db.update(schools).set(update).where(eq(schools.id, session.schoolId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
