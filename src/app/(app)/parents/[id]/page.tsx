import { notFound } from "next/navigation";
import { db } from "@/db";
import { parents, students, studentParents } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ParentForm from "@/components/ParentForm";
import ParentStudentLinks from "@/components/ParentStudentLinks";
import { studentFullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const { id } = await params;
  const parentId = parseInt(id);
  if (isNaN(parentId)) return notFound();

  const rows = await db
    .select()
    .from(parents)
    .where(and(eq(parents.id, parentId), eq(parents.schoolId, schoolId)))
    .limit(1);
  if (rows.length === 0) return notFound();
  const p = rows[0];

  const [linkedRows, allStudents] = await Promise.all([
    db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNo: students.admissionNo,
      })
      .from(studentParents)
      .innerJoin(students, eq(studentParents.studentId, students.id))
      .where(and(eq(studentParents.parentId, parentId), eq(students.schoolId, schoolId))),
    db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNo: students.admissionNo,
      })
      .from(students)
      .where(eq(students.schoolId, schoolId))
      .orderBy(desc(students.id))
      .limit(500),
  ]);

  const linkedIds = new Set(linkedRows.map((s) => s.id));
  const linked = linkedRows.map((s) => ({
    id: s.id,
    name: studentFullName({ firstName: s.firstName, lastName: s.lastName } as any),
    admissionNo: s.admissionNo || "",
  }));
  const available = allStudents
    .filter((s) => !linkedIds.has(s.id))
    .map((s) => ({
      id: s.id,
      label: `${studentFullName({ firstName: s.firstName, lastName: s.lastName } as any)}${s.admissionNo ? " · " + s.admissionNo : ""}`,
    }));

  const title = p.fatherName || p.guardianName || p.motherName || "Parent";

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title={title} description="Edit parent details and link students." backHref="/parents" />
      <ParentForm
        parentId={p.id}
        initial={{
          fatherName: p.fatherName || "",
          motherName: p.motherName || "",
          guardianName: p.guardianName || "",
          relation: p.relation || "father",
          fatherPhone: p.fatherPhone || "",
          motherPhone: p.motherPhone || "",
          fatherWhatsapp: p.fatherWhatsapp || "",
          motherWhatsapp: p.motherWhatsapp || "",
          fatherEmail: p.fatherEmail || "",
          motherEmail: p.motherEmail || "",
          fatherCnic: p.fatherCnic || "",
          motherCnic: p.motherCnic || "",
          fatherOccupation: p.fatherOccupation || "",
          motherOccupation: p.motherOccupation || "",
          address: p.address || "",
        }}
      />
      <ParentStudentLinks parentId={p.id} linked={linked} available={available} />
    </div>
  );
}
