import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ParentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Parents" description="Manage parent contacts, portal access, and link them to students." action="Add Parent" actionHref="#" actionIcon={<Users className="w-4 h-4" />} />
      <div className="card p-10 text-center">
        <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <h3 className="font-bold text-slate-900">Parents module</h3>
        <p className="text-sm text-slate-500 mt-1">Add parents, link to children, and grant portal access. Parents can be created when adding students.</p>
        <Link href="/students" className="btn-primary mt-4">Go to Students</Link>
      </div>
    </div>
  );
}
