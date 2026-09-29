import Link from "next/link";
import { db } from "@/db";
import { classes, sections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { GraduationCap, Plus } from "lucide-react";
import AddClassForm from "@/components/AddClassForm";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const classList = await db.select().from(classes).where(eq(classes.schoolId, schoolId));
  const sectionsList = await db.select().from(sections).where(eq(sections.schoolId, schoolId));
  return (
    <div className="animate-fade-in">
      <PageHeader title="Classes & Sections" description="Manage classes, sections and their teachers." action="Add Class" actionHref="#" actionIcon={<Plus className="w-4 h-4" />} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-3">Add New Class</h3>
          <AddClassForm />
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">Existing Classes</h3>
          {classList.length === 0 ? <p className="text-sm text-slate-500">No classes yet. Use the setup wizard or add one.</p> : (
            <div className="space-y-2">
              {classList.map((c: any) => {
                const secs = sectionsList.filter((s: any) => s.classId === c.id);
                return (
                  <div key={c.id} className="p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{c.name}</div>
                      <span className="text-xs text-slate-500">{secs.length} section(s)</span>
                    </div>
                    {secs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {secs.map((s: any) => (
                          <span key={s.id} className="badge badge-slate">{s.name}{s.roomNo ? ` · ${s.roomNo}` : ""}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
