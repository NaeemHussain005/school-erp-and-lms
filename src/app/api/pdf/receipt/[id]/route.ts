import { NextResponse } from "next/server";
import { db } from "@/db";
import { feeInvoices, feePayments, students, schools, classes } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NAVY = "#1e3a8a";
const GOLD = "#b8902f";
const money = (n: any) =>
  `PKR ${Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d: any) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const METHODS: Record<string, string> = {
  cash: "Cash", bank: "Bank Transfer", card: "Card", online: "Online (JazzCash / Easypaisa)", cheque: "Cheque", other: "Other",
};

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const { id } = await params;
    const paymentId = parseInt(id);
    if (isNaN(paymentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const payRows = await db
      .select()
      .from(feePayments)
      .where(and(eq(feePayments.id, paymentId), eq(feePayments.schoolId, schoolId)))
      .limit(1);
    if (payRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const pay = payRows[0];

    const invRows = pay.invoiceId
      ? await db.select().from(feeInvoices).where(eq(feeInvoices.id, pay.invoiceId)).limit(1)
      : [];
    const inv = invRows[0];

    const [schoolRows, studentRows, classRows, upToNow] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      pay.studentId ? db.select().from(students).where(eq(students.id, pay.studentId)).limit(1) : Promise.resolve([]),
      db.select().from(classes).where(eq(classes.schoolId, schoolId)),
      pay.invoiceId
        ? db.select().from(feePayments).where(and(eq(feePayments.invoiceId, pay.invoiceId), lte(feePayments.id, pay.id)))
        : Promise.resolve([]),
    ]);
    const school: any = schoolRows[0] || {};
    const student: any = (studentRows as any[])[0];
    const cls = classRows.find((c: any) => c.id === (inv?.classId ?? student?.classId));
    const studentName = student ? [student.firstName, student.lastName].filter(Boolean).join(" ") : "—";
    const logoBuf = await loadImage(school.logoUrl);

    const invoiceTotal = Number(inv?.totalAmount || 0);
    const paidTillNow = (upToNow as any[]).reduce((s, p) => s + Number(p.amount || 0), 0);
    const balance = Math.max(0, invoiceTotal - paidTillNow);

    const W = 595;
    const H = 420;
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

    // background + borders
    doc.rect(0, 0, W, H).fill("#fffdf8");
    doc.rect(10, 10, W - 20, H - 20).lineWidth(4).stroke(NAVY);
    doc.rect(17, 17, W - 34, H - 34).lineWidth(1).stroke(GOLD);

    // header
    if (logoBuf) {
      try { doc.image(logoBuf, 38, 30, { fit: [54, 54] }); } catch {}
    }
    doc.fillColor(NAVY).font("Times-Bold").fontSize(19)
      .text((school.name || "SCHOOL").toUpperCase(), 100, 36, { width: W - 200, align: "center", lineBreak: false });
    const contact = [school.address, school.phone, school.email].filter(Boolean).join("   |   ");
    if (contact) doc.fillColor("#64748b").font("Times-Roman").fontSize(8.5)
      .text(contact, 100, 62, { width: W - 200, align: "center", lineBreak: false });
    doc.moveTo(110, 92).lineTo(W - 110, 92).lineWidth(1.2).stroke(GOLD);

    // title
    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(20)
      .text("Payment Receipt", 0, 100, { width: W, align: "center" });
    doc.font("Times-Roman").fontSize(9.5).fillColor("#475569")
      .text(`Receipt No: ${pay.paymentNo || "—"}`, 40, 108, { width: 250, lineBreak: false });
    doc.text(`Date: ${fmt(pay.paymentDate)}`, W - 290, 108, { width: 250, align: "right", lineBreak: false });

    // details card
    const cx = 40, cy = 138, cw = W - 80, ch = 84;
    doc.rect(cx, cy, cw, ch).lineWidth(0.8).stroke(GOLD);
    doc.moveTo(cx + cw / 2, cy).lineTo(cx + cw / 2, cy + ch).lineWidth(0.4).stroke("#d8c48a");
    const field = (label: string, value: string, x: number, y: number, bold = false) => {
      doc.fillColor("#64748b").font("Helvetica").fontSize(6.5).text(label.toUpperCase(), x, y, { characterSpacing: 1, lineBreak: false });
      doc.fillColor(NAVY).font(bold ? "Times-Bold" : "Times-Roman").fontSize(11)
        .text(value, x, y + 9, { width: cw / 2 - 28, height: 14, ellipsis: true, lineBreak: false });
    };
    field("Received From", studentName, cx + 12, cy + 8, true);
    field("Father Name", student?.fatherName || "—", cx + 12, cy + 33);
    field("Class  |  Adm No.", `${cls?.name || "—"}  |  ${student?.admissionNo || "—"}`, cx + 12, cy + 58);
    field("Invoice No.", inv?.invoiceNo || "—", cx + cw / 2 + 12, cy + 8, true);
    field("For Month", inv?.month || "—", cx + cw / 2 + 12, cy + 33);
    field("Payment Method", METHODS[String(pay.method)] || String(pay.method || "—"), cx + cw / 2 + 12, cy + 58);

    // amount box
    const ay = 240;
    doc.roundedRect(40, ay, 240, 62, 6).fill(NAVY);
    doc.fillColor("#f5d77a").font("Helvetica-Bold").fontSize(7.5)
      .text("AMOUNT RECEIVED", 40, ay + 12, { width: 240, align: "center", characterSpacing: 1.5, lineBreak: false });
    doc.fillColor("#ffffff").font("Times-Bold").fontSize(22)
      .text(money(pay.amount), 40, ay + 28, { width: 240, align: "center", lineBreak: false });

    // summary
    let y = ay + 2;
    const line = (label: string, value: string, bold = false, color = "#475569") => {
      doc.font(bold ? "Times-Bold" : "Times-Roman").fontSize(11).fillColor(color);
      doc.text(label, 320, y, { width: 120, lineBreak: false });
      doc.text(value, 430, y, { width: 125, align: "right", lineBreak: false });
      y += 20;
    };
    line("Invoice Total", money(invoiceTotal));
    line("Total Paid (till now)", money(paidTillNow));
    doc.moveTo(320, y - 2).lineTo(555, y - 2).lineWidth(0.5).stroke("#d8c48a");
    line("Balance Due", money(balance), true, balance > 0 ? "#dc2626" : "#059669");

    if (pay.note) {
      doc.font("Times-Italic").fontSize(9).fillColor("#64748b")
        .text(`Note: ${pay.note}`, 40, 314, { width: W - 80, height: 24, ellipsis: true });
    }

    // status stamp
    if (balance <= 0.001) {
      doc.roundedRect(W - 135, 270 + 28, 80, 0.1, 0).fill("#fffdf8"); // spacer (no-op)
    }

    // signatures
    const sy = 362;
    doc.moveTo(50, sy).lineTo(200, sy).lineWidth(1).stroke(NAVY);
    doc.moveTo(W - 200, sy).lineTo(W - 50, sy).lineWidth(1).stroke(NAVY);
    doc.fillColor(NAVY).font("Times-Bold").fontSize(10)
      .text("Received By", 50, sy + 4, { width: 150, align: "center", lineBreak: false })
      .text(school.principal || "Principal", W - 200, sy + 4, { width: 150, align: "center", lineBreak: false });

    doc.fillColor("#94a3b8").font("Times-Roman").fontSize(7.5)
      .text(`Computer-generated receipt issued by ${school.name || "the school"}.`, 0, H - 32, { width: W, align: "center", lineBreak: false });

    doc.end();
    const buffer = await done;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pay.paymentNo || "receipt"}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Receipt PDF error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
