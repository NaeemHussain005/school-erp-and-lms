import { db } from "@/db";
import { students } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { studentFullName } from "@/lib/utils";
import CertificatesBoard from "@/components/CertificatesBoard";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const studentRows = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      admissionNo: students.admissionNo,
    })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.isActive, true)))
    .orderBy(asc(students.firstName))
    .limit(1000);

  const studentOptions = studentRows.map((s) => ({
    id: s.id,
    label: `${studentFullName({ firstName: s.firstName, lastName: s.lastName } as any)}${s.admissionNo ? " · " + s.admissionNo : ""}`,
  }));

  return <CertificatesBoard students={studentOptions} />;
}
