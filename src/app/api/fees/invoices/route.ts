import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices, feeInvoiceItems, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const schoolId = session.schoolId;

    if (!body.studentId) return NextResponse.json({ error: "Student is required" }, { status: 400 });
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Recalculate totals on the server (never trust the browser)
    const items = body.items.map((it: any) => ({
      title: String(it.title || "").trim(),
      amount: Number(it.amount) || 0,
    }));
    const subtotal = items.reduce((s: number, it: any) => s + it.amount, 0);
    if (subtotal <= 0) {
      return NextResponse.json({ error: "Invoice amount must be greater than 0" }, { status: 400 });
    }
    const discount = Number(body.discountAmount) || 0;
    const scholarshipPercent = body.isScholarship ? Number(body.scholarshipPercent) || 0 : 0;
    const scholarshipAmount = (subtotal * scholarshipPercent) / 100;
    const fine = Number(body.fineAmount) || 0;
    const total = Math.max(0, subtotal - discount - scholarshipAmount + fine);

    const student = await db
      .select({ id: students.id, classId: students.classId, academicSessionId: students.academicSessionId })
      .from(students)
      .where(and(eq(students.id, parseInt(body.studentId)), eq(students.schoolId, schoolId)))
      .limit(1);
    if (student.length === 0) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const values: any = {
      schoolId,
      invoiceNo: "TMP-" + Date.now(),
      studentId: student[0].id,
      classId: student[0].classId,
      academicSessionId: student[0].academicSessionId,
      month: body.month || null,
      dueDate: body.dueDate || null,
      issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
      subtotal: subtotal.toFixed(2),
      discountAmount: (discount + scholarshipAmount).toFixed(2),
      discountReason: body.discountReason || null,
      fineAmount: fine.toFixed(2),
      totalAmount: total.toFixed(2),
      paidAmount: "0",
      balanceAmount: total.toFixed(2),
      status: "unpaid",
      notes: body.notes || null,
      isScholarship: !!body.isScholarship,
      scholarshipPercent: scholarshipPercent.toFixed(2),
      createdById: session.userId ?? session.id ?? null,
    };
    const [inserted] = await db.insert(feeInvoices).values(values).returning({ id: feeInvoices.id });

    const invoiceId = inserted.id;
    const invoiceNo = `INV-${String(invoiceId).padStart(6, "0")}`;
    await db.update(feeInvoices).set({ invoiceNo }).where(eq(feeInvoices.id, invoiceId));

    await db.insert(feeInvoiceItems).values(
      items.map((it: any) => ({
        invoiceId,
        title: it.title,
        amount: it.amount.toFixed(2),
        qty: 1,
      }))
    );

    return NextResponse.json({ success: true, invoiceId, invoiceNo, studentId: student[0].id, total });
  } catch (err: any) {
    console.error("Invoice creation error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
