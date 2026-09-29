import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { parents, studentParents, students, classes, sections } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import PageHeader from "@/components/PageHeader";
import { Users, Wallet, Calendar, GraduationCap, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const session = await requireAuth();
  const userId = session.id;

  const parentRows = await db
    .select()
    .from(parents)
    .where(eq(parents.userId, userId))
    .limit(1);

  let children: any[] = [];
  if (parentRows.length > 0) {
    const parent = parentRows[0];
    const mappings = await db
      .select()
      .from(studentParents)
      .where(eq(studentParents.parentId, parent.id));
    const studentIds = mappings.map((m) => m.studentId).filter((id): id is number => id != null);
    if (studentIds.length > 0) {
      const allStuds = await db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          rollNo: students.rollNo,
          classId: students.classId,
          sectionId: students.sectionId,
        })
        .from(students)
        .where(inArray(students.id, studentIds));
      const classRows = await db.select().from(classes);
      const sectionRows = await db.select().from(sections);
      children = allStuds.map((s) => ({
        ...s,
        name: [s.firstName, s.lastName].filter(Boolean).join(" "),
        className: classRows.find((c) => c.id === s.classId)?.name || "—",
        sectionName: sectionRows.find((sec) => sec.id === s.sectionId)?.name || "",
      }));
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Parent Portal" description="View your children's progress, attendance, fees and results." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Users} label="My Children" value={children.length} color="bg-blue-50 text-blue-600" href="/parent/children" />
        <Stat icon={Wallet} label="Fees" value="View" color="bg-emerald-50 text-emerald-600" href="/parent/fees" />
        <Stat icon={Calendar} label="Attendance" value="View" color="bg-amber-50 text-amber-600" href="/parent/attendance" />
        <Stat icon={GraduationCap} label="Results" value="View" color="bg-violet-50 text-violet-600" href="/parent/results" />
      </div>

      <div className="card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> My Children</h3>
        {children.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p>No children linked to your account yet. Please contact school administration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((c) => (
              <Link key={c.id} href={`/parent/children/${c.id}`} className="card p-5 block hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold flex items-center justify-center uppercase">
                    {c.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-sm text-slate-500">{c.className} {c.sectionName} · Roll {c.rollNo || "—"}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, href }: any) {
  return (
    <Link href={href} className="card-hover p-5 block">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Link>
  );
}
