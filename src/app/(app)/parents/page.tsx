import Link from "next/link";
import { db } from "@/db";
import { parents, studentParents, students } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { studentFullName } from "@/lib/utils";
import { Users, UserPlus, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const { q = "" } = await searchParams;

  const [parentRows, linkRows] = await Promise.all([
    db.select().from(parents).where(eq(parents.schoolId, schoolId)).orderBy(desc(parents.id)).limit(500),
    db
      .select({
        parentId: studentParents.parentId,
        studentId: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
      })
      .from(studentParents)
      .innerJoin(students, eq(studentParents.studentId, students.id))
      .where(eq(students.schoolId, schoolId)),
  ]);

  const childrenOf = (parentId: number) =>
    linkRows
      .filter((l) => l.parentId === parentId)
      .map((l) => ({ id: l.studentId, name: studentFullName({ firstName: l.firstName, lastName: l.lastName } as any) }));

  const needle = q.trim().toLowerCase();
  const list = parentRows.filter((p) => {
    if (!needle) return true;
    const hay = [
      p.fatherName,
      p.motherName,
      p.guardianName,
      p.fatherPhone,
      p.motherPhone,
      ...childrenOf(p.id).map((c) => c.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Parents"
        description="Manage parent contacts and link them to students."
        action="Add Parent"
        actionHref="/parents/new"
        actionIcon={<UserPlus className="w-4 h-4" />}
      />

      <div className="card p-4">
        <form className="flex gap-2" action="/parents" method="get">
          <input name="q" defaultValue={q} className="input flex-1" placeholder="Search by parent, phone or student name…" />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="p-3">Parent</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Students</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No parents found.
                </td>
              </tr>
            )}
            {list.map((p) => {
              const kids = childrenOf(p.id);
              const name = p.fatherName || p.guardianName || p.motherName || "—";
              const phone = p.fatherPhone || p.motherPhone;
              return (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <Link href={`/parents/${p.id}`} className="font-semibold text-blue-600 hover:underline">
                      {name}
                    </Link>
                    {p.motherName && p.fatherName && <div className="text-xs text-slate-500">/ {p.motherName}</div>}
                  </td>
                  <td className="p-3">
                    {phone ? (
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3" /> {phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    {kids.length === 0 ? (
                      <span className="text-slate-400">None linked</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {kids.map((k) => (
                          <Link key={k.id} href={`/students/${k.id}`} className="badge badge-slate hover:underline">
                            {k.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/parents/${p.id}`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
