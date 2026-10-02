import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ParentForm from "@/components/ParentForm";

export const dynamic = "force-dynamic";

export default async function NewParentPage() {
  await requireAuth();
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader title="Add Parent" description="Save the parent first, then link students on the next screen." backHref="/parents" />
      <ParentForm />
    </div>
  );
}
