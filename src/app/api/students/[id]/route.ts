import { NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.schoolId) return NextResponse.json({ error: "No school" }, { status: 400 });

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();

    const data: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      fatherName: body.fatherName || null,
      motherName: body.motherName || null,
      gender: body.gender || null,
      dateOfBirth: body.dateOfBirth || null,
      cnic: body.cnic || null,
      bloodGroup: body.bloodGroup || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      emergencyContact: body.emergencyContact || null,
      emergencyName: body.emergencyName || null,
      admissionDate: body.admissionDate || undefined,
      previousSchool: body.previousSchool || null,
      rollNo: body.rollNo || null,
      classId: body.classId ? parseInt(body.classId) : null,
      sectionId: body.sectionId ? parseInt(body.sectionId) : null,
      academicSessionId: body.academicSessionId ? parseInt(body.academicSessionId) : null,
      house: body.house || null,
      medicalInfo: body.medicalInfo || null,
      notes: body.notes || null,
      photoUrl: body.photoUrl === undefined ? undefined : body.photoUrl || null,
    };

    const updated = await db
      .update(students)
      .set(data)
      .where(and(eq(students.id, studentId), eq(students.schoolId, session.schoolId)))
      .returning({ id: students.id });

    if (updated.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, studentId });
  } catch (err: any) {
    console.error("Update student error:", err);
    return NextResponse.json({ error: err.message || "Could not update student" }, { status: 500 });
  }
}
