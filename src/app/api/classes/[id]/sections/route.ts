import { NextResponse } from "next/server";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ sections: [] });
  const { id } = await params;
  const classId = parseInt(id);
  const secs = await db
    .select({ id: sections.id, name: sections.name, roomNo: sections.roomNo })
    .from(sections)
    .where(eq(sections.classId, classId))
    .orderBy(sections.name);
  return NextResponse.json({ sections: secs });
}
