import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices, feeInvoiceItems, students, schools, classes } from "@/db/schema";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    const invRows = await db.select().from(feeInvoices).where(eq(feeInvoices.id, invoiceId)).limit(1);
    if (invRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const inv = invRows[0] as any;

    const [schoolRows, items, allStudents, allClasses] = await Promise.all([
      db.select().from(schools).limit(1),
      db.select().from(feeInvoiceItems).where(eq(feeInvoiceItems.invoiceId, invoiceId)),
      db.select().from(students),
      db.select().from(classes),
    ]);
    const school = schoolRows[0];
    const student = allStudents.find((s: any) => s.id === inv.studentId) as any;
    const cls = allClasses.find((c: any) => c.id === inv.classId) as any;

    const studentName = student ? [student.firstName, student.lastName].filter(Boolean).join(" ") : "—";

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

    const brandColor = String(school?.primaryColor || "#2563eb");

    // Header
    doc.fillColor(brandColor).fontSize(20).text((school?.name || "SCHOOL").toUpperCase(), { align: "center" });
    doc.fontSize(9).fillColor("#555")
      .text([school?.address, school?.phone, school?.email].filter(Boolean).join("  ·  "), { align: "center" })
      .moveDown(0.5);

    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1.5).strokeColor(brandColor).stroke();
    doc.moveDown(0.8);

    doc.fillColor("#000").fontSize(15).text("FEE INVOICE", { align: "center" });
    doc.moveDown(0.5);

    const col1X = 40;
    const col2X = 320;
    let y = doc.y;

    doc.fontSize(9).fillColor("#666");
    doc.text("Invoice #", col1X, y);
    doc.text("Issue Date", col1X, y + 14);
    doc.text("Due Date", col1X, y + 28);
    doc.text("Status", col1X, y + 42);

    doc.fillColor("#000").font("Helvetica-Bold");
    doc.text(inv.invoice_no || "—", col1X + 70, y);
    doc.font("Helvetica").text(inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : "—", col1X + 70, y + 14);
    doc.text(inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—", col1X + 70, y + 28);
    const statusColor = inv.status === "paid" ? "green" : inv.status === "overdue" ? "red" : "#d97706";
    doc.fillColor(statusColor).text((inv.status || "").toUpperCase(), col1X + 70, y + 42);

    doc.fillColor("#666").font("Helvetica");
    doc.text("Student", col2X, y);
    doc.text("Father", col2X, y + 14);
    doc.text("Class", col2X, y + 28);
    doc.text("Adm #", col2X, y + 42);
    doc.text("Month", col2X, y + 56);

    doc.fillColor("#000").font("Helvetica-Bold");
    doc.text(studentName, col2X + 60, y);
    doc.font("Helvetica").text(student?.fatherName || "—", col2X + 60, y + 14);
    doc.text(cls?.name || "—", col2X + 60, y + 28);
    doc.text(student?.admissionNo || "—", col2X + 60, y + 42);
    doc.text(inv.month || "—", col2X + 60, y + 56);

    doc.y = y + 90;
    doc.moveDown(1);

    const tableTop = doc.y;
    doc.font("Helvetica-Bold").fillColor("#fff");
    doc.rect(40, tableTop, 515, 20).fill(brandColor);
    doc.fillColor("#fff").text("#", 50, tableTop + 6);
    doc.text("Description", 80, tableTop + 6);
    doc.text("Amount", 470, tableTop + 6, { width: 80, align: "right" });

    let rowY = tableTop + 25;
    doc.fillColor("#000").font("Helvetica");
    items.forEach((it: any, i: number) => {
      if (i % 2 === 0) {
        doc.rect(40, rowY, 515, 18).fill("#f8fafc");
      }
      doc.fillColor("#000").text(String(i + 1), 50, rowY + 4);
      doc.text(it.title || "", 80, rowY + 4);
      doc.text(`PKR ${Number(it.amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`, 470, rowY + 4, { width: 80, align: "right" });
      rowY += 18;
    });

    doc.y = rowY + 10;
    const totalX = 350;
    const addTotal = (label: string, value: string, bold = false, color?: string) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(color || (bold ? "#000" : "#444"));
      doc.text(label, totalX, doc.y);
      doc.text(value, totalX + 120, doc.y - 12, { width: 85, align: "right" });
      doc.moveDown(0.7);
    };
    addTotal("Subtotal", `PKR ${Number(inv.subtotal || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`);
    if (Number(inv.discount_amount || 0) > 0)
      addTotal("Discount", `- PKR ${Number(inv.discount_amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`, false, "#dc2626");
    if (Number(inv.fine_amount || 0) > 0)
      addTotal("Late Fine", `+ PKR ${Number(inv.fine_amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`, false, "#d97706");
    addTotal("TOTAL", `PKR ${Number(inv.total_amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`, true);
    addTotal("Paid", `PKR ${Number(inv.paid_amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`);
    addTotal("Balance Due", `PKR ${Number(inv.balance_amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`, true, Number(inv.balance_amount) > 0 ? "#dc2626" : "#059669");

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#666").text(inv.notes || "Thank you for your payment. Please keep this receipt for your records.", 40, doc.y, { width: 515 });

    doc.moveDown(3);
    doc.fontSize(8).fillColor("#888").text("Signature of Accountant", 50, doc.y);
    doc.text("Principal / Authorized Signatory", 400, doc.y);

    doc.end();
    const buffer = await done;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${inv.invoice_no || "invoice"}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
