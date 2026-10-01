import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices, feeInvoiceItems, students, schools, classes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const money = (n: any) =>
  `PKR ${Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d: any) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

async function loadImage(src?: string | null): Promise<Buffer | null> {
  if (!src) return null;
  try {
    if (src.startsWith("data:image")) return Buffer.from(src.split(",")[1], "base64");
    if (src.startsWith("http")) {
      const r = await fetch(src);
      if (!r.ok) return null;
      return Buffer.from(await r.arrayBuffer());
    }
  } catch {}
  return null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const invRows = await db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.id, invoiceId), eq(feeInvoices.schoolId, schoolId)))
      .limit(1);
    if (invRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const inv = invRows[0];

    const [schoolRows, items, studentRows, classRows] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db.select().from(feeInvoiceItems).where(eq(feeInvoiceItems.invoiceId, invoiceId)),
      inv.studentId ? db.select().from(students).where(eq(students.id, inv.studentId)).limit(1) : Promise.resolve([]),
      db.select().from(classes).where(eq(classes.schoolId, schoolId)),
    ]);
    const school: any = schoolRows[0] || {};
    const student: any = (studentRows as any[])[0];
    const cls = classRows.find((c: any) => c.id === (inv.classId ?? student?.classId));
    const studentName = student ? [student.firstName, student.lastName].filter(Boolean).join(" ") : "—";
    const brand = String(school.primaryColor || "#2563eb");
    const logoBuf = await loadImage(school.logoUrl);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

    // Header
    let textX = 40;
    let textW = 515;
    if (logoBuf) {
      try {
        doc.image(logoBuf, 40, 36, { fit: [60, 60] });
        textX = 110;
        textW = 445;
      } catch {}
    }
    doc.fillColor(brand).font("Helvetica-Bold").fontSize(20)
      .text((school.name || "SCHOOL").toUpperCase(), textX, 42, { width: textW, align: "center" });
    const contact = [school.address, school.phone, school.email].filter(Boolean).join("  ·  ");
    if (contact) doc.fillColor("#555").font("Helvetica").fontSize(9).text(contact, textX, 68, { width: textW, align: "center" });
    doc.moveTo(40, 104).lineTo(555, 104).lineWidth(1.5).strokeColor(brand).stroke();

    doc.fillColor("#000").font("Helvetica-Bold").fontSize(15).text("FEE INVOICE", 40, 114, { width: 515, align: "center" });

    // Details
    const y = 148;
    const col1X = 40;
    const col2X = 320;
    const statusColor = inv.status === "paid" ? "#059669" : inv.status === "overdue" ? "#dc2626" : "#d97706";

    doc.font("Helvetica").fontSize(9).fillColor("#666");
    ["Invoice #", "Issue Date", "Due Date", "Status"].forEach((l, i) => doc.text(l, col1X, y + i * 15));
    doc.fillColor("#000").font("Helvetica-Bold").text(inv.invoiceNo || "—", col1X + 70, y);
    doc.font("Helvetica").text(fmt(inv.issueDate), col1X + 70, y + 15);
    doc.text(fmt(inv.dueDate), col1X + 70, y + 30);
    doc.fillColor(statusColor).font("Helvetica-Bold").text((inv.status || "").toUpperCase(), col1X + 70, y + 45);

    doc.font("Helvetica").fillColor("#666");
    ["Student", "Father", "Class", "Adm #", "Month"].forEach((l, i) => doc.text(l, col2X, y + i * 15));
    doc.fillColor("#000").font("Helvetica-Bold").text(studentName, col2X + 60, y);
    doc.font("Helvetica").text(student?.fatherName || "—", col2X + 60, y + 15);
    doc.text(cls?.name || "—", col2X + 60, y + 30);
    doc.text(student?.admissionNo || "—", col2X + 60, y + 45);
    doc.text(inv.month || "—", col2X + 60, y + 60);

    // Table
    const tableTop = y + 95;
    doc.rect(40, tableTop, 515, 20).fill(brand);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(9);
    doc.text("#", 50, tableTop + 6);
    doc.text("Description", 80, tableTop + 6);
    doc.text("Amount", 470, tableTop + 6, { width: 80, align: "right" });

    let rowY = tableTop + 22;
    items.forEach((it: any, i: number) => {
      if (i % 2 === 0) doc.rect(40, rowY, 515, 18).fill("#f8fafc");
      doc.fillColor("#000").font("Helvetica").fontSize(9);
      doc.text(String(i + 1), 50, rowY + 5);
      doc.text(it.title || "", 80, rowY + 5, { width: 380 });
      doc.text(money(it.amount), 450, rowY + 5, { width: 100, align: "right" });
      rowY += 18;
    });

    // Totals
    let ty = rowY + 14;
    const line = (label: string, value: string, bold = false, color = "#444") => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9.5).fillColor(color);
      doc.text(label, 350, ty, { width: 100 });
      doc.text(value, 450, ty, { width: 100, align: "right" });
      ty += bold ? 20 : 16;
    };
    line("Subtotal", money(inv.subtotal));
    if (Number(inv.discountAmount || 0) > 0) line("Discount", "- " + money(inv.discountAmount), false, "#dc2626");
    if (Number(inv.fineAmount || 0) > 0) line("Late Fine", "+ " + money(inv.fineAmount), false, "#d97706");
    line("TOTAL", money(inv.totalAmount), true, "#000");
    line("Paid", money(inv.paidAmount));
    line("Balance Due", money(inv.balanceAmount), true, Number(inv.balanceAmount) > 0 ? "#dc2626" : "#059669");

    // Note
    const defaultNote =
      inv.status === "paid"
        ? "Thank you for your payment. Please keep this receipt for your records."
        : "Please pay before the due date to avoid late fine.";
    doc.font("Helvetica").fontSize(8.5).fillColor("#666").text(inv.notes || defaultNote, 40, ty + 20, { width: 515 });

    // Signatures
    const sy = ty + 110;
    doc.moveTo(50, sy).lineTo(210, sy).lineWidth(0.8).strokeColor("#888").stroke();
    doc.moveTo(385, sy).lineTo(545, sy).lineWidth(0.8).strokeColor("#888").stroke();
    doc.fontSize(8.5).fillColor("#555").font("Helvetica");
    doc.text("Accountant", 50, sy + 4, { width: 160, align: "center" });
    doc.text(school.principal ? `${school.principal}\nPrincipal` : "Principal", 385, sy + 4, { width: 160, align: "center" });

    if (school.footerText) doc.fontSize(8).fillColor("#888").text(school.footerText, 40, 790, { width: 515, align: "center", height: 20 });

    doc.end();
    const buffer = await done;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${inv.invoiceNo || "invoice"}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Invoice PDF error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
