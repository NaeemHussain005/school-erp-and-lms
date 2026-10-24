import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import BranchForm from "@/components/BranchForm";
import { canManageBranches } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function NewBranchPage() {
  const session: any = await requireAuth();
  if (!canManageBranches(session)) return notFound();

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title="Add Branch" description="Add a new campus or branch." backHref="/branches" />
      <BranchForm />
    </div>
  );
}
