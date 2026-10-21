import { NextResponse } from "next/server";
import { db } from "@/db";
import { learningMaterials } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canManageLms, cleanMaterial } from "@/lib/lms";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to add materials" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = await cleanMaterial(await req.json(), schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const inserted = await db
      .insert(learningMaterials)
      .values({
        schoolId,
        ...result.data,
        uploadedById: session.id ?? null,
      } as any)
      .returning({ id: learningMaterials.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Create material error:", err);
    return NextResponse.json({ error: "Could not add material" }, { status: 500 });
  }
}
