import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, schools, classes, sections } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NAVY = "#1e3a8a";
const GOLD = "#b8902f";
const fmt = (d: any) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const sRows = await db
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
      .limit(1);
    if (sRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const s = sRows[0] as any;

    const [schoolRows, classRows, sectionRows] = await Promise.all([
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db.select().from(classes).where(eq(classes.schoolId, schoolId)),
      db.select().from(sections).where(eq(sections.schoolId, schoolId)),
    ]);
    const school: any = schoolRows[0] || {};
    const className = classRows.find((c: any) => c.id === s.classId)?.name || "";
    const sectionName = sectionRows.find((x: any) => x.id === s.sectionId)?.name || "";
    const classText = `${className} ${sectionName}`.trim() || "—";
    const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ");
    const year = new Date().getFullYear();
    const profileNo = `STU-${year}-${String(s.id).padStart(4, "0")}`;

    const W = 842;
    const H = 595;
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

    // background + borders
    doc.rect(0, 0, W, H).fill("#fffdf8");
    doc.rect(14, 14, W - 28, H - 28).lineWidth(6).stroke(NAVY);
    doc.rect(26, 26, W - 52, H - 52).lineWidth(1.5).stroke(GOLD);
    doc.rect(34, 34, W - 68, H - 68).lineWidth(0.75).stroke(NAVY);

    // corner diamonds
    [[52, 52], [W - 52, 52], [52, H - 52], [W - 52, H - 52]].forEach(([cx, cy]) => {
      doc.polygon([cx, cy - 12], [cx + 12, cy], [cx, cy + 12], [cx - 12, cy]).lineWidth(1.5).stroke(GOLD);
    });

    // optional logo (only works if stored as a data: URL)
    let headerY = 52;
    const logo: string | undefined = school.logo || school.logoUrl;
    if (logo && logo.startsWith("data:image")) {
      try {
        const buf = Buffer.from(logo.split(",")[1], "base64");
        doc.image(buf, W / 2 - 22, 44, { fit: [44, 44], align: "center" });
        headerY = 92;
      } catch {}
    }

    // header
    doc.fillColor(NAVY).font("Times-Bold").fontSize(26)
      .text((school.name || "SCHOOL").toUpperCase(), 0, headerY, { width: W, align: "center", characterSpacing: 2 });
    const addr = [school.address, school.phone, school.email].filter(Boolean).join("   |   ");
    if (addr) doc.fillColor("#64748b").font("Times-Roman").fontSize(9).text(addr, 0, headerY + 34, { width: W, align: "center" });
    doc.moveTo(220, headerY + 52).lineTo(W - 220, headerY + 52).lineWidth(1.5).stroke(GOLD);

    // title
    const ty = headerY + 62;
    doc.fillColor(GOLD).font("Times-Roman").fontSize(10)
      .text("CERTIFICATE OF", 0, ty, { width: W, align: "center", characterSpacing: 5 });
    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(30)
      .text("Student Profile", 0, ty + 14, { width: W, align: "center" });

    // cert no + date
    const my = ty + 58;
    doc.font("Times-Roman").fontSize(10).fillColor("#475569")
      .text("Profile No: ", 70, my, { continued: true }).font("Times-Bold").fillColor(NAVY).text(profileNo);
        doc.font("Times-Roman").fontSize(10).fillColor("#475569")
      .text(`Date of Issue: ${fmt(new Date())}`, 70, my, { width: W - 140, align: "right" });

    // body
    const by = my + 22;
    doc.font("Times-Roman").fontSize(12).fillColor("#1e293b")
      .text("This is to certify that ", 70, by, { width: W - 140, continued: true })
      .font("Times-Bold").text(fullName, { continued: true })
      .font("Times-Roman").text(", son/daughter of ", { continued: true })
      .font("Times-Bold").text(s.fatherName || "—", { continued: true })
      .font("Times-Roman").text(", is a registered student of this school, admitted on ", { continued: true })
      .font("Times-Bold").text(fmt(s.admissionDate), { continued: true })
      .font("Times-Roman").text(". The student's record is given below.", { continued: false });

    // details table
    const items: [string, string][] = [
      ["Student Name", fullName],
      ["Father Name", s.fatherName || "—"],
      ["Mother Name", s.motherName || "—"],
      ["Admission No.", s.admissionNo || "—"],
      ["Class / Section", classText],
      ["Roll No.", s.rollNo || "—"],
      ["Date of Birth", fmt(s.dateOfBirth)],
      ["Gender", s.gender ? String(s.gender).charAt(0).toUpperCase() + String(s.gender).slice(1) : "—"],
      ["Blood Group", s.bloodGroup || "—"],
      ["CNIC / B-Form", s.cnic || "—"],
      ["Phone", s.phone || "—"],
      ["Admission Date", fmt(s.admissionDate)],
    ];
    const tx = 70;
    const tw = W - 140;
    const cols = 4;
    const cw = tw / cols;
    const ch = 38;
    const tableY = by + 50;
    const rows = Math.ceil(items.length / cols);

    items.forEach(([label, value], i) => {
      const cx = tx + (i % cols) * cw;
      const cy = tableY + Math.floor(i / cols) * ch;
      doc.fillColor("#64748b").font("Helvetica").fontSize(6.5)
        .text(label.toUpperCase(), cx + 10, cy + 7, { width: cw - 20, characterSpacing: 1 });
      doc.fillColor(NAVY).font("Times-Bold").fontSize(11.5)
        .text(value, cx + 10, cy + 19, { width: cw - 20, height: 14, ellipsis: true });
    });
    // full width address row
    const addrY = tableY + rows * ch;
    doc.fillColor("#64748b").font("Helvetica").fontSize(6.5)
      .text("ADDRESS", tx + 10, addrY + 7, { characterSpacing: 1 });
    doc.fillColor(NAVY).font("Times-Bold").fontSize(11.5)
      .text(s.address || "—", tx + 10, addrY + 19, { width: tw - 20, height: 14, ellipsis: true });

    // table lines
    const totalH = rows * ch + ch;
    doc.rect(tx, tableY, tw, totalH).lineWidth(0.8).stroke(GOLD);
    for (let r = 1; r <= rows; r++) doc.moveTo(tx, tableY + r * ch).lineTo(tx + tw, tableY + r * ch).lineWidth(0.4).stroke("#d8c48a");
    for (let c = 1; c < cols; c++) doc.moveTo(tx + c * cw, tableY).lineTo(tx + c * cw, tableY + rows * ch).lineWidth(0.4).stroke("#d8c48a");

    // seal
    const sealY = tableY + totalH + 52;
    doc.circle(W / 2, sealY, 34).fill(GOLD);
    doc.circle(W / 2, sealY, 29).lineWidth(1).stroke("#ffffff");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8)
      .text("OFFICIAL", W / 2 - 34, sealY - 10, { width: 68, align: "center", characterSpacing: 1 })
      .text("SEAL", W / 2 - 34, sealY + 1, { width: 68, align: "center", characterSpacing: 1 });

    // signatures
    const sigY = sealY + 22;
    doc.moveTo(80, sigY).lineTo(260, sigY).lineWidth(1.2).stroke(NAVY);
    doc.moveTo(W - 260, sigY).lineTo(W - 80, sigY).lineWidth(1.2).stroke(NAVY);
    doc.fillColor(NAVY).font("Times-Bold").fontSize(11)
      .text("Class Teacher", 80, sigY + 4, { width: 180, align: "center" })
      .text("Principal", W - 260, sigY + 4, { width: 180, align: "center" });

    doc.fillColor("#94a3b8").font("Times-Roman").fontSize(8)
      .text(`This is a computer-generated document issued by ${school.name || "the school"}.`, 0, H - 50, { width: W, align: "center" });

    doc.end();
    const buffer = await done;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="student-${s.admissionNo || studentId}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Student PDF error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
