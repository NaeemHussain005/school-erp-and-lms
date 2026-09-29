import Link from "next/link";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { BookOpen, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LMSPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const items = await db.select().from(courses).where(eq(courses.schoolId, schoolId)).orderBy(desc(courses.createdAt)).limit(50);

  return (
    <div className="animate-fade-in">
      <PageHeader title="LMS — Courses" description="Manage online courses, lessons and learning materials." action="New Course" actionHref="#" actionIcon={<Plus className="w-4 h-4" />}>
        <Link href="/lms/library" className="btn-secondary">
          <BookOpen className="w-4 h-4" /> Materials Library
        </Link>
      </PageHeader>

      {items.length === 0 ? (
        <div className="card py-16 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900">No courses yet</h3>
          <p className="text-sm text-slate-500 mt-1">Build your first LMS course with lessons, videos, and assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="h-24 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 mb-3 flex items-center justify-center text-white">
                <BookOpen className="w-10 h-10 opacity-60" />
              </div>
              <div className="font-bold text-slate-900 line-clamp-1">{c.title}</div>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.description}</p>
              <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                <span>{formatDate(c.startDate)} - {formatDate(c.endDate)}</span>
                {c.isPublished ? <span className="badge badge-green">Published</span> : <span className="badge badge-slate">Draft</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
