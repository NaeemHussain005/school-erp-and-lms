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
    const profileNo = `STU-${new Date().getFullYear()}-${String(s.id).padStart(4, "0")}`;

    const [logoBuf, photoBuf] = await Promise.all([loadImage(school.logoUrl), loadImage(s.photoUrl)]);

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

    // header: logo (left) | school name (center) | photo (right)
    const headerY = 60;
    if (logoBuf) {
      try {
        doc.image(logoBuf, 80, headerY - 4, { fit: [80, 80] });
      } catch {}
    }
    if (photoBuf) {
      try {
        doc.rect(W - 168, headerY - 6, 88, 108).fill("#ffffff");
        doc.image(photoBuf, W - 164, headerY - 2, { fit: [80, 100] });
        doc.rect(W - 168, headerY - 6, 88, 108).lineWidth(1.8).stroke(GOLD);
      } catch {}
    }

    doc.fillColor(NAVY).font("Times-Bold").fontSize(24)
      .text((school.name || "SCHOOL").toUpperCase(), 180, headerY + 8, { width: W - 360, align: "center", characterSpacing: 1.5 });
    const addr = [school.address, school.phone, school.email].filter(Boolean).join("  |  ");
    if (addr) doc.fillColor("#64748b").font("Times-Roman").fontSize(9).text(addr, 180, headerY + 42, { width: W - 360, align: "center" });
    doc.moveTo(200, headerY + 66).lineTo(W - 200, headerY + 66).lineWidth(1.5).stroke(GOLD);

    // title
    const ty = headerY + 74;
    doc.fillColor(GOLD).font("Times-Roman").fontSize(10)
      .text("CERTIFICATE OF", 0, ty, { width: W, align: "center", characterSpacing: 5 });
    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(30)
      .text("Student Profile", 0, ty + 14, { width: W, align: "center" });

    // profile no + date
    const my = ty + 58;
    doc.font("Times-Roman").fontSize(10).fillColor("#475569")
      .text("Profile No: ", 70, my, { width: 300, continued: true }).font("Times-Bold").fillColor(NAVY).text(profileNo);
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
    const addrY = tableY + rows * ch;
    doc.fillColor("#64748b").font("Helvetica").fontSize(6.5)
      .text("ADDRESS", tx + 10, addrY + 7, { characterSpacing: 1 });
    doc.fillColor(NAVY).font("Times-Bold").fontSize(11.5)
      .text(s.address || "—", tx + 10, addrY + 19, { width: tw - 20, height: 14, ellipsis: true });

    const totalH = rows * ch + ch;
    doc.rect(tx, tableY, tw, totalH).lineWidth(0.8).stroke(GOLD);
    for (let r = 1; r <= rows; r++) doc.moveTo(tx, tableY + r * ch).lineTo(tx + tw, tableY + r * ch).lineWidth(0.4).stroke("#d8c48a");
    for (let c = 1; c < cols; c++) doc.moveTo(tx + c * cw, tableY).lineTo(tx + c * cw, tableY + rows * ch).lineWidth(0.4).stroke("#d8c48a");

    // seal
    const sealY = tableY + totalH + 48;
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
      .text(school.principal ? `${school.principal}\nPrincipal` : "Principal", W - 260, sigY + 4, { width: 180, align: "center" });

    doc.fillColor("#94a3b8").font("Times-Roman").fontSize(8)
      .text(`This is a computer-generated document issued by ${school.name || "the school"}.`, 0, H - 52, { width: W, align: "center" });

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
