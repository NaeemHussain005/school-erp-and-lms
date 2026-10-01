import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const rows = await db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, invoiceId), eq(feeInvoices.schoolId, session.schoolId)))
      .limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    if (Number(rows[0].paidAmount || 0) > 0) {
      return NextResponse.json({ error: "Cannot delete an invoice that has payments" }, { status: 400 });
    }

    // invoice items are removed automatically (onDelete cascade)
    await db.delete(feeInvoices).where(eq(feeInvoices.id, invoiceId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete invoice error:", err);
    return NextResponse.json({ error: err.message || "Could not delete invoice" }, { status: 500 });
  }
}
