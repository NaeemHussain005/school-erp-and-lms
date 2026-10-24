import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { canManageBranches } from "@/lib/branches";
import { Building2, Mail, MapPin, Phone, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const session: any = await requireAuth();
  if (!canManageBranches(session)) return notFound();
  const schoolId = session.schoolId!;

  const rows = await db
    .select()
    .from(branches)
    .where(eq(branches.schoolId, schoolId))
    .orderBy(desc(branches.isMain), asc(branches.id));

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Branches"
        description="Manage multiple campuses/branches from one place."
        action="Add Branch"
        actionHref="/branches/new"
        actionIcon={<Plus className="w-4 h-4" />}
      />

      {rows.length === 0 ? (
        <div className="card py-16 text-center">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900">No branches yet</h3>
          <p className="text-sm text-slate-500 mt-1">Add your first branch. It will become the main branch.</p>
          <Link href="/branches/new" className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Add Branch
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((b) => (
            <Link key={b.id} href={`/branches/${b.id}`} className="card p-5 block hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-900 truncate">{b.name}</div>
                </div>
                {b.isMain && <span className="badge badge-green flex-shrink-0">Main</span>}
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                {b.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> <span>{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {b.phone}
                  </div>
                )}
                {b.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> <span className="truncate">{b.email}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
