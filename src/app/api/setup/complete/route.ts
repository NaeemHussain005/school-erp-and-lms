import { NextResponse } from "next/server";
import { db } from "@/db";
import { setupProgress } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const update: any = { updatedAt: new Date() };
    if (body.step) update[body.step] = true;
    if (body.done) update.completed = true;
    await db.update(setupProgress).set(update).where(eq(setupProgress.schoolId, session.schoolId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
