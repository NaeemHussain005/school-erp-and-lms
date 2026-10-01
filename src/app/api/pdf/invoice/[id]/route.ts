import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices, feeInvoiceItems, students, schools, classes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NAVY = "#1e3a8a";
const GOLD = "#b8902f";
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
    const logoBuf = await loadImage(school.logoUrl);

    const W = 595;
    const H = 842;
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

    // background + borders
    doc.rect(0, 0, W, H).fill("#fffdf8");
    doc.rect(12, 12, W - 24, H - 24).lineWidth(5).stroke(NAVY);
    doc.rect(21, 21, W - 42, H - 42).lineWidth(1.2).stroke(GOLD);
    doc.rect(27, 27, W - 54, H - 54).lineWidth(0.6).stroke(NAVY);

    // header
    if (logoBuf) {
      try {
        doc.image(logoBuf, 50, 46, { fit: [70, 70] });
      } catch {}
    }
    doc.fillColor(NAVY).font("Times-Bold").fontSize(23)
      .text((school.name || "SCHOOL").toUpperCase(), 130, 54, { width: W - 260, align: "center", characterSpacing: 1.5 });
    const contact = [school.address, school.phone, school.email].filter(Boolean).join("   |   ");
    if (contact) doc.fillColor("#64748b").font("Times-Roman").fontSize(9).text(contact, 130, 86, { width: W - 260, align: "center" });
    doc.moveTo(120, 128).lineTo(W - 120, 128).lineWidth(1.3).stroke(GOLD);

    // title + status badge
    doc.fillColor(GOLD).font("Times-Roman").fontSize(9)
      .text("OFFICIAL", 0, 142, { width: W, align: "center", characterSpacing: 5 });
    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(26)
      .text("Fee Invoice", 0, 154, { width: W, align: "center" });

    const status = (inv.status || "unpaid").toUpperCase();
    const badgeColor = inv.status === "paid" ? "#059669" : inv.status === "overdue" ? "#dc2626" : GOLD;
    doc.roundedRect(W - 140, 150, 80, 22, 11).fill(badgeColor);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9)
      .text(status, W - 140, 157, { width: 80, align: "center", characterSpacing: 1 });

    // details card
    const cy = 200;
    const cx = 50;
    const cw = W - 100;
    const ch = 100;
    doc.rect(cx, cy, cw, ch).lineWidth(0.8).stroke(GOLD);
    doc.moveTo(cx + cw / 2, cy).lineTo(cx + cw / 2, cy + ch).lineWidth(0.4).stroke("#d8c48a");

    const field = (label: string, value: string, x: number, y: number, bold = false) => {
      doc.fillColor("#64748b").font("Helvetica").fontSize(6.5).text(label.toUpperCase(), x, y, { characterSpacing: 1 });
      doc.fillColor(NAVY).font(bold ? "Times-Bold" : "Times-Roman").fontSize(11).text(value, x, y + 9, { width: cw / 2 - 30, height: 14, ellipsis: true });
    };
    field("Invoice No.", inv.invoiceNo || "—", cx + 14, cy + 10, true);
    field("Issue Date", fmt(inv.issueDate), cx + 14, cy + 40);
    field("Due Date", fmt(inv.dueDate), cx + 14, cy + 70);
    field("Student", studentName, cx + cw / 2 + 14, cy + 10, true);
    field("Father Name", student?.fatherName || "—", cx + cw / 2 + 14, cy + 40);
    field("Class  |  Adm No.  |  Month", `${cls?.name || "—"}  |  ${student?.admissionNo || "—"}  |  ${inv.month || "—"}`, cx + cw / 2 + 14, cy + 70);

    // items table
    const ty0 = cy + ch + 28;
    doc.rect(50, ty0, W - 100, 22).fill(NAVY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("#", 62, ty0 + 7);
    doc.text("DESCRIPTION", 92, ty0 + 7, { characterSpacing: 1 });
    doc.text("AMOUNT", 400, ty0 + 7, { width: 133, align: "right", characterSpacing: 1 });

    let rowY = ty0 + 22;
    items.forEach((it: any, i: number) => {
      if (i % 2 === 0) doc.rect(50, rowY, W - 100, 22).fill("#f6f1e4");
      doc.fillColor("#1e293b").font("Times-Roman").fontSize(11);
      doc.text(String(i + 1), 62, rowY + 6);
      doc.text(it.title || "", 92, rowY + 6, { width: 300 });
      doc.font("Times-Bold").text(money(it.amount), 400, rowY + 6, { width: 133, align: "right" });
      rowY += 22;
    });
    doc.moveTo(50, rowY).lineTo(W - 50, rowY).lineWidth(0.8).stroke(GOLD);

    // totals
    let y = rowY + 16;
    const line = (label: string, value: string, opts: { bold?: boolean; color?: string; size?: number } = {}) => {
      doc.font(opts.bold ? "Times-Bold" : "Times-Roman").fontSize(opts.size || 11).fillColor(opts.color || "#475569");
      doc.text(label, 330, y, { width: 100 });
      doc.text(value, 430, y, { width: 103, align: "right" });
      y += (opts.size || 11) + 8;
    };
    line("Subtotal", money(inv.subtotal));
    if (Number(inv.discountAmount || 0) > 0) line("Discount", "- " + money(inv.discountAmount), { color: "#dc2626" });
    if (Number(inv.fineAmount || 0) > 0) line("Late Fine", "+ " + money(inv.fineAmount), { color: "#b45309" });
    doc.moveTo(330, y - 2).lineTo(W - 62, y - 2).lineWidth(0.6).stroke("#d8c48a");
    y += 4;
    line("TOTAL", money(inv.totalAmount), { bold: true, color: NAVY, size: 13 });
    line("Paid", money(inv.paidAmount));
    const due = Number(inv.balanceAmount || 0);
    doc.roundedRect(322, y - 4, W - 322 - 54, 26, 4).fill(due > 0 ? "#fef2f2" : "#ecfdf5");
    doc.font("Times-Bold").fontSize(13).fillColor(due > 0 ? "#dc2626" : "#059669");
    doc.text("Balance Due", 330, y + 3, { width: 100 });
    doc.text(money(inv.balanceAmount), 430, y + 3, { width: 103, align: "right" });
    y += 40;

    // note
    const note = inv.notes || (inv.status === "paid"
      ? "Thank you for your payment. Please keep this receipt for your records."
      : "Please pay before the due date to avoid late fine.");
    doc.font("Times-Italic").fontSize(10).fillColor("#64748b").text(note, 50, y, { width: W - 100 });
    y += 60;

    // seal + signatures (right below content)
    const sealY = y + 30;
    doc.circle(W / 2, sealY, 30).fill(GOLD);
    doc.circle(W / 2, sealY, 25).lineWidth(1).stroke("#ffffff");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7)
      .text("OFFICIAL", W / 2 - 30, sealY - 8, { width: 60, align: "center", characterSpacing: 1 })
      .text("SEAL", W / 2 - 30, sealY + 2, { width: 60, align: "center", characterSpacing: 1 });

    const sy = sealY + 18;
    doc.moveTo(60, sy).lineTo(220, sy).lineWidth(1.1).stroke(NAVY);
    doc.moveTo(W - 220, sy).lineTo(W - 60, sy).lineWidth(1.1).stroke(NAVY);
    doc.fillColor(NAVY).font("Times-Bold").fontSize(11)
      .text("Accountant", 60, sy + 4, { width: 160, align: "center" });
    doc.text(school.principal || "Principal", W - 220, sy + 4, { width: 160, align: "center" });
    if (school.principal) {
      doc.font("Times-Roman").fontSize(9).fillColor("#64748b").text("Principal", W - 220, sy + 18, { width: 160, align: "center" });
    }

    doc.fillColor("#94a3b8").font("Times-Roman").fontSize(8)
      .text(school.footerText || `This is a computer-generated invoice issued by ${school.name || "the school"}.`, 50, H - 52, { width: W - 100, align: "center", height: 20 });

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
