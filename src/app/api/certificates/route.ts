import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, desc } from "drizzle-orm";
import { canManageCertificates, cleanCertificate } from "@/lib/certificates";

// GET /api/certificates  -> list issued certificates for this school
export async function GET() {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;

    const rows = await db
      .select({
        id: certificates.id,
        studentId: certificates.studentId,
        type: certificates.type,
        title: certificates.title,
        certificateNo: certificates.certificateNo,
        issueDate: certificates.issueDate,
        createdAt: certificates.createdAt,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNo: students.admissionNo,
      })
      .from(certificates)
      .leftJoin(students, eq(certificates.studentId, students.id))
      .where(eq(certificates.schoolId, schoolId))
      .orderBy(desc(certificates.id));

    const list = rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      type: r.type,
      title: r.title,
      certificateNo: r.certificateNo,
      issueDate: r.issueDate,
      createdAt: r.createdAt,
      studentName: [r.studentFirstName, r.studentLastName].filter(Boolean).join(" ").trim() || "—",
      admissionNo: r.admissionNo || "",
    }));

    return NextResponse.json({ certificates: list });
  } catch (err: any) {
    console.error("List certificates error:", err);
    return NextResponse.json({ error: "Could not load certificates" }, { status: 500 });
  }
}

// POST /api/certificates  -> issue one certificate
export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageCertificates(session)) {
      return NextResponse.json({ error: "You do not have permission to issue certificates" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const result = cleanCertificate(await req.json());
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const data = result.data;

    // Make sure the student belongs to this school
    const stu = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, data.studentId), eq(students.schoolId, schoolId)))
      .limit(1);
    if (!stu.length) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const inserted = await db
      .insert(certificates)
      .values({
        schoolId,
        ...data,
        issuedById: session.id ?? null,
      } as any)
      .returning({ id: certificates.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (err: any) {
    console.error("Issue certificate error:", err);
    return NextResponse.json({ error: "Could not issue certificate" }, { status: 500 });
  }
}
