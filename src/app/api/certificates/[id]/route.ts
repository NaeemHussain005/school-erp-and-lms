import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { canManageCertificates } from "@/lib/certificates";

// DELETE /api/certificates/:id  -> remove one certificate
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageCertificates(session)) {
      return NextResponse.json({ error: "You do not have permission to delete certificates" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const certId = Number(id);
    if (!Number.isInteger(certId) || certId <= 0) {
      return NextResponse.json({ error: "Invalid certificate id" }, { status: 400 });
    }

    const existing = await db
      .select({ id: certificates.id })
      .from(certificates)
      .where(and(eq(certificates.id, certId), eq(certificates.schoolId, schoolId)))
      .limit(1);
    if (!existing.length) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

    await db
      .delete(certificates)
      .where(and(eq(certificates.id, certId), eq(certificates.schoolId, schoolId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete certificate error:", err);
    return NextResponse.json({ error: "Could not delete certificate" }, { status: 500 });
  }
}
