import { NextResponse } from "next/server";
import { db } from "@/db";
import { learningMaterials } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageLms, cleanMaterial } from "@/lib/lms";

async function findMaterial(id: number, schoolId: number) {
  const rows = await db
    .select({ id: learningMaterials.id })
    .from(learningMaterials)
    .where(and(eq(learningMaterials.id, id), eq(learningMaterials.schoolId, schoolId)))
    .limit(1);
  return rows[0];
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to edit materials" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const materialId = parseInt(id);
    if (isNaN(materialId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findMaterial(materialId, schoolId))) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const result = await cleanMaterial(await req.json(), schoolId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

    await db
      .update(learningMaterials)
      .set(result.data as any)
      .where(and(eq(learningMaterials.id, materialId), eq(learningMaterials.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update material error:", err);
    return NextResponse.json({ error: "Could not update material" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLms(session)) {
      return NextResponse.json({ error: "You do not have permission to delete materials" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const materialId = parseInt(id);
    if (isNaN(materialId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    if (!(await findMaterial(materialId, schoolId))) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await db
      .delete(learningMaterials)
      .where(and(eq(learningMaterials.id, materialId), eq(learningMaterials.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete material error:", err);
    return NextResponse.json({ error: "Could not delete material" }, { status: 500 });
  }
}
