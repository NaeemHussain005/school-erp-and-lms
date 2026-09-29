import { NextResponse } from "next/server";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { students, users, classes, subjects, feeInvoices, assignments, parents } from "@/db/schema";
import { ilike, or, eq, and } from "drizzle-orm";
import { studentFullName } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ results: [] });
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    if (!q || q.length < 2) return NextResponse.json({ results: [] });
    const schoolId = session.schoolId;

    const like = `%${q}%`;
    const results: any[] = [];

    if (!session.isSuperAdmin) {
      // Students
      const sQ = schoolId
        ? and(eq(students.schoolId, schoolId), or(
            ilike(students.firstName, like),
            ilike(students.lastName, like),
            ilike(students.admissionNo, like),
            ilike(students.rollNo, like),
            ilike(students.phone, like),
          ))
        : or(
            ilike(students.firstName, like),
            ilike(students.lastName, like),
          );
      const studentRows = await db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNo: students.admissionNo,
          rollNo: students.rollNo,
          classId: students.classId,
          sectionId: students.sectionId,
        })
        .from(students)
        .where(sQ)
        .limit(8);

      const classIds = [...new Set(studentRows.map((s) => s.classId).filter(Boolean))];
      const sectionIds = [...new Set(studentRows.map((s) => s.sectionId).filter(Boolean))];
      const classRows = classIds.length
        ? await db.select({ id: classes.id, name: classes.name }).from(classes).where(
            schoolId ? and(eq(classes.schoolId, schoolId)) : undefined!
          )
        : [];
      const classMap = new Map(classRows.map((c) => [c.id, c.name]));

      for (const s of studentRows) {
        results.push({
          type: "student",
          id: s.id,
          title: studentFullName(s),
          subtitle: `Adm #${s.admissionNo || "-"} · Roll ${s.rollNo || "-"}`,
          meta: s.classId ? classMap.get(s.classId) : "",
          href: `/students/${s.id}`,
        });
      }

      // Teachers
      const teacherRows = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          phone: users.phone,
          email: users.email,
        })
        .from(users)
        .where(
          and(
            schoolId ? eq(users.schoolId, schoolId) : undefined!,
            eq(users.role, "teacher"),
            or(
              ilike(users.firstName, like),
              ilike(users.lastName, like),
              ilike(users.email, like),
              ilike(users.phone, like),
            )
          )
        )
        .limit(6);
      for (const t of teacherRows) {
        results.push({
          type: "teacher",
          id: t.id,
          title: [t.firstName, t.lastName].filter(Boolean).join(" "),
          subtitle: t.email || t.phone || "Teacher",
          href: `/staff?highlight=${t.id}`,
        });
      }

      // Classes
      const classRes = await db
        .select({ id: classes.id, name: classes.name })
        .from(classes)
        .where(
          and(schoolId ? eq(classes.schoolId, schoolId) : undefined!, ilike(classes.name, like))
        )
        .limit(6);
      for (const c of classRes) {
        results.push({ type: "class", id: c.id, title: c.name, subtitle: "Class", href: "/academics/classes" });
      }

      // Subjects
      const subjRes = await db
        .select({ id: subjects.id, name: subjects.name, code: subjects.code })
        .from(subjects)
        .where(
          and(schoolId ? eq(subjects.schoolId, schoolId) : undefined!, ilike(subjects.name, like))
        )
        .limit(6);
      for (const s of subjRes) {
        results.push({ type: "subject", id: s.id, title: s.name, subtitle: s.code || "Subject", href: "/academics/subjects" });
      }

      // Fee invoices
      const invRes = await db
        .select({ id: feeInvoices.id, invoiceNo: feeInvoices.invoiceNo, status: feeInvoices.status, totalAmount: feeInvoices.totalAmount })
        .from(feeInvoices)
        .where(
          and(schoolId ? eq(feeInvoices.schoolId, schoolId) : undefined!, ilike(feeInvoices.invoiceNo, like))
        )
        .limit(5);
      for (const inv of invRes) {
        results.push({
          type: "invoice",
          id: inv.id,
          title: inv.invoiceNo,
          subtitle: `PKR ${inv.totalAmount}`,
          meta: inv.status,
          href: `/fees/invoices/${inv.id}`,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [] });
  }
}
