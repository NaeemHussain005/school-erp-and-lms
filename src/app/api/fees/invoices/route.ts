import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices, feeInvoiceItems, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const schoolId = session.schoolId;

    if (!body.studentId) return NextResponse.json({ error: "Student is required" }, { status: 400 });
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    const student = await db
      .select({ id: students.id, classId: students.classId, academicSessionId: students.academicSessionId })
      .from(students)
      .where(eq(students.id, parseInt(body.studentId)))
      .limit(1);
    if (student.length === 0) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Insert invoice
    const values: any = {
      schoolId,
      invoiceNo: "TMP-" + Date.now(),
      studentId: student[0].id,
      classId: student[0].classId,
      academicSessionId: student[0].academicSessionId,
      month: body.month || null,
      dueDate: body.dueDate || null,
      issueDate: body.issueDate || new Date(),
      subtotal: String(body.subtotal || 0),
      discountAmount: String(Number(body.discountAmount) || 0),
      discountReason: body.discountReason || null,
      fineAmount: String(Number(body.fineAmount) || 0),
      totalAmount: String(body.total || 0),
      paidAmount: "0",
      balanceAmount: String(body.total || 0),
      status: "unpaid",
      notes: body.notes || null,
      isScholarship: !!body.isScholarship,
      scholarshipPercent: String(Number(body.scholarshipPercent) || 0),
      createdById: session.id,
    };
    const [inserted] = await db
      .insert(feeInvoices)
      .values(values)
      .returning({ id: feeInvoices.id });

    const invoiceId = inserted.id;
    const invoiceNo = `INV-${String(invoiceId).padStart(6, "0")}`;
    await db.update(feeInvoices).set({ invoiceNo }).where(eq(feeInvoices.id, invoiceId));

    // Insert items
    await db.insert(feeInvoiceItems).values(
      body.items.map((it: any) => ({
        invoiceId,
        title: it.title,
        amount: Number(it.amount) || 0,
        qty: 1,
      }))
    );

    return NextResponse.json({ success: true, invoiceId, invoiceNo, studentId: student[0].id });
  } catch (err: any) {
    console.error("Invoice creation error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
