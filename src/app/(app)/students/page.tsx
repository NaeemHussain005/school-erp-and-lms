import Link from "next/link";
import { db } from "@/db";
import { students, classes, sections } from "@/db/schema";
import { eq, ilike, or, asc, desc, and, count, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatDate, studentFullName } from "@/lib/utils";
import { Search, Filter, Download, Upload, UserPlus, MoreHorizontal, Mail, Phone, Eye, Trash2 } from "lucide-react";
import StudentBulkActions from "@/components/StudentBulkActions";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  class?: string;
  page?: string;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const sp = await searchParams;
  const q = sp.q || "";
  const classFilter = sp.class ? parseInt(sp.class) : null;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const perPage = 50;
  const offset = (page - 1) * perPage;

  const classList = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.schoolId, schoolId))
    .orderBy(classes.name);

  const whereClause = and(
    eq(students.schoolId, schoolId),
    classFilter ? eq(students.classId, classFilter) : undefined!,
    q
      ? or(
          ilike(students.firstName, `%${q}%`),
          ilike(students.lastName, `%${q}%`),
          ilike(students.admissionNo, `%${q}%`),
          ilike(students.rollNo, `%${q}%`),
          ilike(students.phone, `%${q}%`)
        )
      : undefined!
  );

  const [studentList, totalRes] = await Promise.all([
    db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNo: students.admissionNo,
        rollNo: students.rollNo,
        gender: students.gender,
        phone: students.phone,
        admissionDate: students.admissionDate,
        isActive: students.isActive,
        classId: students.classId,
        sectionId: students.sectionId,
        photoUrl: students.photoUrl,
        fatherName: students.fatherName,
      })
      .from(students)
      .where(whereClause)
      .orderBy(desc(students.createdAt))
      .limit(perPage)
      .offset(offset),
    db.select({ c: count() }).from(students).where(whereClause),
  ]);
  const total = Number(totalRes[0]?.c || 0);
  const totalPages = Math.ceil(total / perPage);

  // Enrich with class names
  const classMap = new Map(classList.map((c) => [c.id, c.name]));
  const sectionRows = await db
    .select({ id: sections.id, name: sections.name, classId: sections.classId })
    .from(sections)
    .where(eq(sections.schoolId, schoolId));
  const secMap = new Map(sectionRows.map((s) => [s.id, s.name]));

  const studentsEnriched = studentList.map((s) => ({
    ...s,
    fullName: studentFullName(s),
    className: s.classId ? classMap.get(s.classId) : null,
    sectionName: s.sectionId ? secMap.get(s.sectionId) : null,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Students"
        description="Manage all students, their profiles, attendance, fees and academic records."
        action="Add Student"
        actionHref="/students/new"
        actionIcon={<UserPlus className="w-4 h-4" />}
      >
        <Link href="/students/import" className="btn-secondary">
          <Upload className="w-4 h-4" /> Import
        </Link>
        <Link href="/api/export/students" className="btn-secondary">
          <Download className="w-4 h-4" /> Export
        </Link>
      </PageHeader>

      <div className="card p-4 mb-4">
        <form className="flex flex-col md:flex-row gap-3" action="/students" method="get">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, admission #, roll #, phone…"
              className="input pl-9"
            />
          </div>
          <select name="class" defaultValue={classFilter || ""} className="input md:w-56">
            <option value="">All Classes</option>
            {classList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-5">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {studentsEnriched.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-blue-600 mb-4">
              <UserPlus className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {q || classFilter ? "No students match your search" : "No students yet"}
            </h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              {q || classFilter
                ? "Try adjusting your filters or search terms."
                : "Add your first student manually, or import hundreds from Excel in a few clicks."}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Link href="/students/new" className="btn-primary">
                <UserPlus className="w-4 h-4" /> Add Student
              </Link>
              <Link href="/students/import" className="btn-secondary">
                <Upload className="w-4 h-4" /> Import Excel
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </th>
                    <th>Student</th>
                    <th>Adm # / Roll</th>
                    <th>Class</th>
                    <th>Father</th>
                    <th>Contact</th>
                    <th>Admission</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsEnriched.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input type="checkbox" className="rounded border-slate-300 row-check" value={s.id} />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center font-semibold text-sm uppercase flex-shrink-0">
                            {s.fullName.slice(0, 2)}
                          </div>
                          <div>
                            <Link href={`/students/${s.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                              {s.fullName}
                            </Link>
                            <div className="text-xs text-slate-500 capitalize">{s.gender || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-mono text-sm">{s.admissionNo || "—"}</div>
                        <div className="text-xs text-slate-500">Roll {s.rollNo || "—"}</div>
                      </td>
                      <td>
                        <div className="text-sm font-medium">{s.className || "—"}</div>
                        <div className="text-xs text-slate-500">{s.sectionName || ""}</div>
                      </td>
                      <td className="text-sm">{s.fatherName || "—"}</td>
                      <td>
                        {s.phone ? (
                          <a href={`tel:${s.phone}`} className="text-sm inline-flex items-center gap-1 text-slate-600 hover:text-blue-600">
                            <Phone className="w-3 h-3" /> {s.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="text-sm text-slate-600">{formatDate(s.admissionDate)}</td>
                      <td>
                        {s.isActive ? (
                          <span className="badge badge-green">Active</span>
                        ) : (
                          <span className="badge badge-slate">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/students/${s.id}`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/students/${s.id}/edit`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Edit">
                            <MoreHorizontal className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-slate-100 text-sm">
              <div className="text-slate-600">
                Showing <span className="font-semibold">{studentsEnriched.length}</span> of <span className="font-semibold">{total}</span> students
              </div>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/students?${new URLSearchParams({ q, class: classFilter ? String(classFilter) : "", page: String(page - 1) })}`}
                    className="btn-secondary py-1.5 px-3 text-sm"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-slate-600">
                  Page {page} of {totalPages || 1}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/students?${new URLSearchParams({ q, class: classFilter ? String(classFilter) : "", page: String(page + 1) })}`}
                    className="btn-secondary py-1.5 px-3 text-sm"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <StudentBulkActions />
    </div>
  );
}

function sql_count() {
  return `count(*)`;
}
