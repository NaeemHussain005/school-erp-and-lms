import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, teacherProfiles, staffProfiles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import StaffForm from "@/components/StaffForm";

export const dynamic = "force-dynamic";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return notFound();

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
    .limit(1);
  if (rows.length === 0) return notFound();
  const u = rows[0];

  const [tp, sp] = await Promise.all([
    db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1),
    db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1),
  ]);
  const profile: any = tp[0] || sp[0] || {};
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title={name || "Staff Member"}
        description={`${(u.role || "").replace("_", " ")} · ${u.isActive ? "Active" : "Inactive"}`}
        backHref="/staff"
      />
      <StaffForm
        initial={{
          id: u.id,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          phone: u.phone || "",
          gender: u.gender || "",
          isActive: !!u.isActive,
          employeeId: profile.employeeId || "",
          designation: profile.designation || "",
          joiningDate: profile.joiningDate || "",
          salary: profile.salary ? String(profile.salary) : "",
        }}
      />
    </div>
  );
}
