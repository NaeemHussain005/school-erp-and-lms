import { NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { generateAdmissionNo } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session.schoolId) return NextResponse.json({ error: "No school" }, { status: 400 });
    const body = await req.json();
    const schoolId = session.schoolId;

    const data: any = {
      schoolId,
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
      admissionDate: body.admissionDate || new Date(),
      previousSchool: body.previousSchool || null,
      rollNo: body.rollNo || null,
      classId: body.classId ? parseInt(body.classId) : null,
      sectionId: body.sectionId ? parseInt(body.sectionId) : null,
      academicSessionId: body.academicSessionId ? parseInt(body.academicSessionId) : null,
      house: body.house || null,
      medicalInfo: body.medicalInfo || null,
      notes: body.notes || null,
      isActive: true,
      admissionStatus: "admitted",
    };

    const inserted = await db.insert(students).values(data).returning({ id: students.id });
    const studentId = inserted[0].id;

    // Generate admission number based on id
    await db
      .update(students)
      .set({ admissionNo: generateAdmissionNo(studentId) })
      .where(eq(students.id, studentId));

    return NextResponse.json({ success: true, studentId });
  } catch (err: any) {
    console.error("Create student error:", err);
    return NextResponse.json({ error: err.message || "Could not create student" }, { status: 500 });
  }
}
