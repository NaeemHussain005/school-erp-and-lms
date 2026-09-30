import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, classes, schools } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { formatDate, studentFullName } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function StudentCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const { type = "bonafide" } = await searchParams;
  const studentId = parseInt(id);
  if (isNaN(studentId)) return notFound();
  const schoolId = session.schoolId!;

  const [sRows, cRows, schoolRows] = await Promise.all([
    db.select().from(students).where(and(eq(students.id, studentId), eq(students.schoolId, schoolId))).limit(1),
    db.select().from(classes).where(eq(classes.schoolId, schoolId)),
    db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
  ]);
  if (sRows.length === 0) return notFound();

  const s = sRows[0];
  const school: any = schoolRows[0] || {};
  const schoolName = school.name || "My School";
  const className = cRows.find((c) => c.id === s.classId)?.name || "";
  const name = studentFullName(s);
  const today = formatDate(new Date());

  const titles: Record<string, string> = {
    bonafide: "Bonafide Certificate",
    character: "Character Certificate",
    transfer: "School Leaving Certificate",
  };
  const title = titles[type] || titles.bonafide;

  let body = `This is to certify that ${name}, son/daughter of ${s.fatherName || "—"}, is a bonafide student of this school, studying in class ${className}, Admission No. ${s.admissionNo}.`;
  if (type === "character") {
    body = `This is to certify that ${name}, son/daughter of ${s.fatherName || "—"}, Admission No. ${s.admissionNo}, has been a student of this school in class ${className}. During this period, the conduct and character of the student has been good.`;
  } else if (type === "transfer") {
    body = `This is to certify that ${name}, son/daughter of ${s.fatherName || "—"}, Admission No. ${s.admissionNo}, was admitted on ${formatDate(s.admissionDate)} and last studied in class ${className}. The student is leaving the school and all dues have been cleared.`;
  }

  return (
    <div className="space-y-4">
      <div className="print:hidden flex flex-wrap items-center gap-2">
        <Link href={`/students/${studentId}`} className="btn-secondary">Back</Link>
        {Object.entries(titles).map(([key, label]) => (
          <Link
            key={key}
            href={`/certificates/student/${studentId}?type=${key}`}
            className={type === key ? "btn-primary" : "btn-secondary"}
          >
            {label}
          </Link>
        ))}
        <PrintButton />
      </div>

      <div className="bg-white border-4 border-double border-slate-700 p-12 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-slate-900">{schoolName}</h1>
        {school.address && <p className="text-sm text-slate-500 mt-1">{school.address}</p>}
        <h2 className="text-2xl font-semibold text-blue-700 mt-8 underline">{title}</h2>
        <p className="text-lg text-slate-800 leading-8 mt-8 text-left">{body}</p>
        <div className="flex justify-between mt-20 text-sm text-slate-700">
          <div>Date: {today}</div>
          <div className="border-t border-slate-700 pt-1 px-6">Principal</div>
        </div>
      </div>
    </div>
  );
}
