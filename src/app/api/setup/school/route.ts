import { NextResponse } from "next/server";
import { db } from "@/db";
import { schools, setupProgress, branches } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    await db
      .update(schools)
      .set({
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        principal: body.principal || null,
        currency: body.currency || "PKR",
        morningStart: body.morningStart || null,
        morningEnd: body.morningEnd || null,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, session.schoolId));

    await db
      .update(setupProgress)
      .set({ schoolInfo: true, updatedAt: new Date() })
      .where(eq(setupProgress.schoolId, session.schoolId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
