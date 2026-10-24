import { notFound } from "next/navigation";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import BranchForm from "@/components/BranchForm";
import { canManageBranches } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const session: any = await requireAuth();
  if (!canManageBranches(session)) return notFound();
  const schoolId = session.schoolId!;
  const { id } = await params;
  const branchId = parseInt(id);
  if (isNaN(branchId)) return notFound();

  const rows = await db
    .select()
    .from(branches)
    .where(and(eq(branches.id, branchId), eq(branches.schoolId, schoolId)))
    .limit(1);
  if (rows.length === 0) return notFound();
  const b = rows[0];

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title={b.name} description={b.isMain ? "Main branch" : "Edit this branch"} backHref="/branches" />
      <BranchForm
        branchId={b.id}
        initial={{
          name: b.name || "",
          address: b.address || "",
          phone: b.phone || "",
          email: b.email || "",
          isMain: !!b.isMain,
        }}
      />
    </div>
  );
}
