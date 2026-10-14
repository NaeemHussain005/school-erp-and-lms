import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, classes, sections, schools, results, exams, subjects } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { canEnterMarks, gradeFor, EXAM_TYPES } from "@/lib/exams";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NAVY = "#1e3a8a";
const GOLD = "#b8902f";
const fmt = (d: any) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

const TYPE_LABELS: Record<string, string> = {
  mid_term: "Mid Term",
  final_term: "Final Term",
  monthly: "Monthly",
  weekly: "Weekly",
  quiz: "Quiz",
  assignment: "Assignment",
  annual: "Annual",
  unit_test: "Unit Test",
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

export async function GET(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canEnterMarks(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const schoolId = session.schoolId;

    const { studentId } = await params;
    const sid = parseInt(studentId);
    if (isNaN(sid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const typeParam = new URL(req.url).searchParams.get("type") || "";
    const type = EXAM_TYPES.includes(typeParam) ? typeParam : "";

    const stuRows = await db
      .select()
      .from(students)
      .where(and(eq(students.id, sid), eq(students.schoolId, schoolId)))
      .limit(1);
    if (stuRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const s: any = stuRows[0];

    const [clsRows, secRows, schoolRows, resRows] = await Promise.all([
      s.classId
        ? db.select({ name: classes.name }).from(classes).where(and(eq(classes.id, s.classId), eq(classes.schoolId, schoolId))).limit(1)
        : Promise.resolve([]),
      s.sectionId
        ? db.select({ name: sections.name }).from(sections).where(and(eq(sections.id, s.sectionId), eq(sections.schoolId, schoolId))).limit(1)
        : Promise.resolve([]),
      db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
      db
        .select({
          id: results.id,
          obtained: results.obtainedMarks,
          total: results.totalMarks,
          percentage: results.percentage,
          grade: results.grade,
          position: results.position,
          isPresent: results.isPresent,
          examTitle: exams.title,
          startDate: exams.startDate,
          subjectName: subjects.name,
        })
        .from(results)
        .innerJoin(exams, eq(results.examId, exams.id))
        .leftJoin(subjects, eq(exams.subjectId, subjects.id))
        .where(
          and(
            eq(results.studentId, sid),
            eq(results.schoolId, schoolId),
            eq(exams.isPublished, true),
            type ? eq(exams.type, type as any) : undefined
          )
        )
        .orderBy(asc(exams.startDate), asc(results.id)),
    ]);

    const school: any = schoolRows[0] || {};
    const className = (clsRows as any[])[0]?.name || "";
    const sectionName = (secRows as any[])[0]?.name || "";
    const studentName = [s.firstName, s.lastName].filter(Boolean).join(" ") || "—";
    const logoBuf = await loadImage(school.logoUrl);

    const sitting = resRows.filter((r) => r.isPresent !== false && r.obtained != null);
    const sumObtained = sitting.reduce((t, r) => t + Number(r.obtained), 0);
    const sumTotal = sitting.reduce((t, r) => t + Number(r.total || 0), 0);
    const overall = sumTotal > 0 ? gradeFor(sumObtained, sumTotal, 0) : null;
    const failed = sitting.filter((r) => r.grade === "F").length;

    const W = 595;
    const H = 842;
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: Uint8Array) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

    const frame = () => {
      doc.rect(0, 0, W, H).fill("#fffdf8");
      doc.rect(10, 10, W - 20, H - 20).lineWidth(4).stroke(NAVY);
      doc.rect(17, 17, W - 34, H - 34).lineWidth(1).stroke(GOLD);
    };
    frame();

    // header
    if (logoBuf) {
      try { doc.image(logoBuf, 38, 32, { fit: [54, 54] }); } catch {}
    }
    doc.fillColor(NAVY).font("Times-Bold").fontSize(20)
      .text((school.name || "SCHOOL").toUpperCase(), 100, 38, { width: W - 200, align: "center", lineBreak: false });
    const contact = [school.address, school.phone, school.email].filter(Boolean).join("   |   ");
    if (contact) {
      doc.fillColor("#64748b").font("Times-Roman").fontSize(8.5)
        .text(contact, 100, 64, { width: W - 200, align: "center", lineBreak: false });
    }
    doc.moveTo(110, 94).lineTo(W - 110, 94).lineWidth(1.2).stroke(GOLD);

    doc.fillColor(NAVY).font("Times-BoldItalic").fontSize(22)
      .text("Report Card", 0, 104, { width: W, align: "center" });
    doc.font("Times-Roman").fontSize(9.5).fillColor("#475569")
      .text(type ? TYPE_LABELS[type] || type : "All published exams", 0, 130, { width: W, align: "center", lineBreak: false });

    // student card
    const cx = 40, cy = 152, cw = W - 80, ch = 84;
    doc.rect(cx, cy, cw, ch).lineWidth(0.8).stroke(GOLD);
    doc.moveTo(cx + cw / 2, cy).lineTo(cx + cw / 2, cy + ch).lineWidth(0.4).stroke("#d8c48a");
    const field = (label: string, value: string, x: number, y: number, bold = false) => {
      doc.fillColor("#64748b").font("Helvetica").fontSize(6.5).text(label.toUpperCase(), x, y, { characterSpacing: 1, lineBreak: false });
      doc.fillColor(NAVY).font(bold ? "Times-Bold" : "Times-Roman").fontSize(11)
        .text(value, x, y + 9, { width: cw / 2 - 28, height: 14, ellipsis: true, lineBreak: false });
    };
    field("Student", studentName, cx + 12, cy + 8, true);
    field("Father Name", s.fatherName || "—", cx + 12, cy + 33);
    field("Class", `${className} ${sectionName}`.trim() || "—", cx + 12, cy + 58);
    field("Admission No.", s.admissionNo || "—", cx + cw / 2 + 12, cy + 8, true);
    field("Roll No.", s.rollNo || "—", cx + cw / 2 + 12, cy + 33);
    field("Issued On", fmt(new Date()), cx + cw / 2 + 12, cy + 58);

    // table
    const COLS = [
      { label: "EXAM", x: 44, w: 136, align: "left" },
      { label: "SUBJECT", x: 185, w: 90, align: "left" },
      { label: "DATE", x: 280, w: 62, align: "left" },
      { label: "TOTAL", x: 345, w: 38, align: "right" },
      { label: "OBTAINED", x: 388, w: 55, align: "right" },
      { label: "%", x: 448, w: 45, align: "right" },
      { label: "GRADE", x: 498, w: 28, align: "center" },
      { label: "POS", x: 528, w: 27, align: "center" },
    ] as const;

    let y = cy + ch + 20;

    const tableHeader = () => {
      doc.rect(40, y, W - 80, 20).fill(NAVY);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7.5);
      for (const c of COLS) {
        doc.text(c.label, c.x, y + 6, { width: c.w, align: c.align as any, lineBreak: false });
      }
      y += 26;
    };

    if (resRows.length === 0) {
      doc.fillColor("#64748b").font("Times-Italic").fontSize(12)
        .text("No published results yet.", 0, y + 20, { width: W, align: "center", lineBreak: false });
      y += 60;
    } else {
      tableHeader();
      const ROW_LIMIT = H - 210;
      for (const r of resRows) {
        if (y > ROW_LIMIT) {
          doc.addPage();
          frame();
          y = 40;
          tableHeader();
        }
        const absent = r.isPresent === false;
        const vals = [
          r.examTitle || "—",
          r.subjectName || "—",
          r.startDate ? fmt(r.startDate) : "—",
          String(r.total ?? ""),
          absent ? "Absent" : String(Number(r.obtained)),
          absent || r.percentage == null ? "—" : Number(r.percentage).toFixed(1) + "%",
          r.grade || "—",
          r.position ? "#" + r.position : "—",
        ];
        COLS.forEach((c, i) => {
          const isGrade = i === 6;
          doc
            .fillColor(isGrade && r.grade === "F" ? "#dc2626" : NAVY)
            .font(i === 4 || isGrade ? "Times-Bold" : "Times-Roman")
            .fontSize(10)
            .text(vals[i], c.x, y, { width: c.w, height: 12, align: c.align as any, ellipsis: true, lineBreak: false });
        });
        y += 20;
        doc.moveTo(40, y - 4).lineTo(W - 40, y - 4).lineWidth(0.4).stroke("#e5dcc0");
      }
      y += 10;
    }

    // summary
    if (overall) {
      if (y > H - 200) {
        doc.addPage();
        frame();
        y = 40;
      }
      const gap = 10;
      const bw = (W - 80 - gap * 3) / 4;
      const boxes = [
        { label: "Total Marks", value: `${sumObtained}/${sumTotal}`, color: NAVY },
        { label: "Percentage", value: `${overall.percentage.toFixed(1)}%`, color: NAVY },
        { label: "Overall Grade", value: overall.grade, color: NAVY },
        { label: "Result", value: failed === 0 ? "Pass" : `Failed in ${failed}`, color: failed === 0 ? "#059669" : "#dc2626" },
      ];
      boxes.forEach((b, i) => {
        const bx = 40 + i * (bw + gap);
        doc.roundedRect(bx, y, bw, 46, 5).fill("#f1f5f9");
        doc.fillColor("#64748b").font("Helvetica").fontSize(6.5)
          .text(b.label.toUpperCase(), bx, y + 9, { width: bw, align: "center", characterSpacing: 1, lineBreak: false });
        doc.fillColor(b.color).font("Times-Bold").fontSize(15)
          .text(b.value, bx, y + 22, { width: bw, align: "center", lineBreak: false });
      });
      y += 56;
    }

    // signatures + footer (on the last page)
    const sy = H - 90;
    doc.moveTo(50, sy).lineTo(200, sy).lineWidth(1).stroke(NAVY);
    doc.moveTo(W - 200, sy).lineTo(W - 50, sy).lineWidth(1).stroke(NAVY);
    doc.fillColor(NAVY).font("Times-Bold").fontSize(10)
      .text("Class Teacher", 50, sy + 4, { width: 150, align: "center", lineBreak: false })
      .text(school.principal || "Principal", W - 200, sy + 4, { width: 150, align: "center", lineBreak: false });
    doc.fillColor("#94a3b8").font("Times-Roman").fontSize(7.5)
      .text(`Computer-generated report card issued by ${school.name || "the school"}.`, 0, H - 40, { width: W, align: "center", lineBreak: false });

    doc.end();
    const buffer = await done;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-card-${s.admissionNo || sid}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Report card PDF error", err);
    return NextResponse.json({ error: "Could not generate report card" }, { status: 500 });
  }
}
