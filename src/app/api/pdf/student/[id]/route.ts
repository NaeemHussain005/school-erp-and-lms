import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, schools, classes, sections } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const className = classRows.find((c: any) => c.id === s.classId)?.name || "—";
    const sectionName = sectionRows.find((x: any) => x.id === s.sectionId)?.name || "";
    const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ");
    const brand = String(school.primaryColor || "#2563eb");

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

    // Header
    doc.fillColor(brand).font("Helvetica-Bold").fontSize(20).text((school.name || "SCHOOL").toUpperCase(), { align: "center" });
    doc.font("Helvetica").fontSize(9).fillColor("#555")
      .text([school.address, school.phone, school.email].filter(Boolean).join("  ·  "), { align: "center" })
      .moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1.5).strokeColor(brand).stroke();
    doc.moveDown(0.8);
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(15).text("STUDENT PROFILE", { align: "center" });
    doc.moveDown(0.8);

    // Name banner
    const bannerY = doc.y;
    doc.rect(40, bannerY, 515, 50).fill(brand);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(16).text(fullName, 55, bannerY + 10, { width: 485 });
    doc.font("Helvetica").fontSize(10).text(
      `Class ${className} ${sectionName}   |   Adm #${s.admissionNo || "—"}   |   Roll #${s.rollNo || "—"}`,
      55, bannerY + 31, { width: 485 }
    );
    doc.y = bannerY + 65;

    const section = (title: string, rows: [string, any][]) => {
      if (doc.y > 700) doc.addPage();
      doc.font("Helvetica-Bold").fontSize(11).fillColor(brand).text(title, 40, doc.y);
      doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
      doc.y += 8;
      rows.forEach(([label, value]) => {
        const text = value ? String(value) : "—";
        doc.font("Helvetica").fontSize(9.5);
        const h = Math.max(doc.heightOfString(text, { width: 380 }), 12);
        if (doc.y + h > 780) doc.addPage();
        const y = doc.y;
        doc.fillColor("#64748b").text(label, 40, y, { width: 130 });
        doc.fillColor("#000").text(text, 175, y, { width: 380 });
        doc.y = y + h + 6;
      });
      doc.moveDown(0.6);
    };

    section("Personal Information", [
      ["Full Name", fullName],
      ["Gender", s.gender],
      ["Date of Birth", fmt(s.dateOfBirth)],
      ["CNIC / B-Form", s.cnic],
      ["Blood Group", s.bloodGroup],
    ]);
    section("Parent / Guardian", [
      ["Father Name", s.fatherName],
      ["Mother Name", s.motherName],
      ["Emergency Contact", [s.emergencyName, s.emergencyContact].filter(Boolean).join(" - ")],
    ]);
    section("Contact", [
      ["Phone", s.phone],
      ["Email", s.email],
      ["Address", s.address],
    ]);
    section("Academic Details", [
      ["Admission No.", s.admissionNo],
      ["Admission Date", fmt(s.admissionDate)],
      ["Class / Section", `${className} ${sectionName}`.trim()],
      ["Roll Number", s.rollNo],
      ["House", s.house],
      ["Previous School", s.previousSchool],
    ]);
    section("Medical & Notes", [
      ["Medical Info", s.medicalInfo],
      ["Notes", s.notes],
    ]);

    doc.fontSize(8).fillColor("#888").text(`Generated on ${fmt(new Date())}`, 40, 800, { width: 515, align: "center" });

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
