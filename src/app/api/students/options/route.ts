import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, classes } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { studentFullName } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return NextResponse.json({ students: [] });
    const rows = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNo: students.admissionNo,
        fatherName: students.fatherName,
        classId: students.classId,
        phone: students.phone,
      })
      .from(students)
      .where(eq(students.schoolId, session.schoolId))
      .orderBy(students.firstName)
      .limit(500);

    const classRows = await db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, session.schoolId));
    const classMap = new Map(classRows.map((c: any) => [c.id, c.name]));

    return NextResponse.json({
      students: rows.map((r) => ({
        id: r.id,
        label: `${studentFullName(r)}${r.admissionNo ? " (#" + r.admissionNo + ")" : ""}`,
        fatherName: r.fatherName,
        className: r.classId ? classMap.get(r.classId) : "",
        whatsapp: r.phone,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ students: [] });
  }
}
