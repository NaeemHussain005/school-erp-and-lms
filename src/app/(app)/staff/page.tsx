import Link from "next/link";
import { db } from "@/db";
import { users, teacherProfiles, staffProfiles } from "@/db/schema";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatDate } from "@/lib/utils";
import { Search, UserPlus, Mail, Phone, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const sp = await searchParams;
  const q = sp.q || "";
  const roleFilter = sp.role || "";

  const where = and(
    eq(users.schoolId, schoolId),
    roleFilter ? eq(users.role, roleFilter as any) : or(eq(users.role, "teacher"), eq(users.role, "accountant"), eq(users.role, "librarian"), eq(users.role, "receptionist"), eq(users.role, "exam_controller"), eq(users.role, "hr_manager"), eq(users.role, "principal"), eq(users.role, "vice_principal")),
    q ? or(ilike(users.firstName, `%${q}%`), ilike(users.lastName, `%${q}%`), ilike(users.email, `%${q}%`), ilike(users.phone, `%${q}%`)) : undefined!
  );

  const staffList = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      photoUrl: users.photoUrl,
      joiningDate: teacherProfiles.joiningDate,
      employeeId: teacherProfiles.employeeId,
    })
    .from(users)
    .leftJoin(teacherProfiles, eq(teacherProfiles.userId, users.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(100);

  const roleChips: { key: string; label: string }[] = [
    { key: "", label: "All" },
    { key: "teacher", label: "Teachers" },
    { key: "accountant", label: "Accountants" },
    { key: "librarian", label: "Librarians" },
    { key: "receptionist", label: "Reception" },
    { key: "principal", label: "Principal" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teachers & Staff"
        description="Manage teachers, administrative staff and employee records."
        action="Add Staff"
        actionHref="/staff/new"
        actionIcon={<UserPlus className="w-4 h-4" />}
      />

      <div className="card p-4 mb-4">
        <form className="flex flex-col md:flex-row gap-3" action="/staff" method="get">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="Search by name, email, phone…" className="input pl-9" />
          </div>
          <select name="role" defaultValue={roleFilter} className="input md:w-48">
            {roleChips.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <button className="btn-primary px-5">Filter</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.length === 0 && (
          <div className="col-span-full card py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-blue-600 mb-3">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900">No staff yet</h3>
            <p className="text-sm text-slate-500 mt-1">Add your first teacher or staff member.</p>
            <Link href="/staff/new" className="btn-primary mt-4">
              <UserPlus className="w-4 h-4" /> Add Staff
            </Link>
          </div>
        )}
        {staffList.map((s) => {
          const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
          return (
            <div key={s.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center font-bold uppercase flex-shrink-0">
                  {name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{name}</div>
                  <div className="text-xs capitalize text-slate-500">{(s.role || "").replace("_", " ")}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {s.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-slate">Inactive</span>
                    )}
                    {s.employeeId && <span className="badge badge-slate">ID: {s.employeeId}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                {s.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3 h-3" /> <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3 h-3" /> {s.phone}
                  </div>
                )}
                {s.joiningDate && (
                  <div className="text-xs text-slate-500 mt-2">Joined: {formatDate(s.joiningDate)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
