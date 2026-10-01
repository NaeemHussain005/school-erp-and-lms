import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices, feePayments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;
    const body = await req.json();

    const invoiceId = parseInt(body.invoiceId);
    const amount = Number(body.amount);
    if (isNaN(invoiceId)) return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });

    const rows = await db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, invoiceId), eq(feeInvoices.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const inv = rows[0];

    const total = Number(inv.totalAmount || 0);
    const paid = Number(inv.paidAmount || 0);
    const balance = total - paid;
    if (balance <= 0) return NextResponse.json({ error: "Invoice is already fully paid" }, { status: 400 });
    if (amount > balance + 0.001) {
      return NextResponse.json({ error: `Amount exceeds balance due (${balance.toFixed(2)})` }, { status: 400 });
    }

    const method = ["cash", "bank", "card", "online", "cheque", "other"].includes(body.method) ? body.method : "cash";

    const [payment] = await db
      .insert(feePayments)
      .values({
        schoolId,
        paymentNo: "TMP-" + Date.now(),
        invoiceId,
        studentId: inv.studentId,
        amount: amount.toFixed(2),
        method,
        transactionId: body.transactionId || null,
        paymentDate: body.paymentDate || new Date().toISOString().slice(0, 10),
        receivedById: session.userId ?? session.id ?? null,
        note: body.note || null,
      } as any)
      .returning({ id: feePayments.id });

    const paymentNo = `PAY-${String(payment.id).padStart(6, "0")}`;
    await db.update(feePayments).set({ paymentNo }).where(eq(feePayments.id, payment.id));

    const newPaid = paid + amount;
    const newBalance = Math.max(0, total - newPaid);
    const status = newBalance <= 0.001 ? "paid" : "partial";
    await db
      .update(feeInvoices)
      .set({
        paidAmount: newPaid.toFixed(2),
        balanceAmount: newBalance.toFixed(2),
        status,
        updatedAt: new Date(),
      })
      .where(eq(feeInvoices.id, invoiceId));

    return NextResponse.json({ success: true, paymentNo, status, balance: newBalance });
  } catch (err: any) {
    console.error("Payment error:", err);
    return NextResponse.json({ error: err.message || "Could not record payment" }, { status: 500 });
  }
}
