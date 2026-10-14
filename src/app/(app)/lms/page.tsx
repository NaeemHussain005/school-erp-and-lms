import Link from "next/link";
import { db } from "@/db";
import { courses, classes, lessons } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { BookOpen, Plus, Video } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { canManageLms } from "@/lib/lms";

export const dynamic = "force-dynamic";

export default async function LMSPage() {
  const session: any = await requireAuth();
  const schoolId = session.schoolId!;
  const manage = canManageLms(session);

  const [items, classList, counts] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(and(eq(courses.schoolId, schoolId), manage ? undefined : eq(courses.isPublished, true)))
      .orderBy(desc(courses.createdAt))
      .limit(100),
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)),
    db
      .select({ courseId: lessons.courseId, n: sql<number>`count(*)` })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(eq(courses.schoolId, schoolId))
      .groupBy(lessons.courseId),
  ]);
  const classMap = new Map(classList.map((c) => [c.id, c.name]));
  const countMap = new Map(counts.map((c) => [c.courseId, Number(c.n)]));

  const links = (
    <>
      <Link href="/lms/live" className="btn-secondary">
        <Video className="w-4 h-4" /> Live Classes
      </Link>
      <Link href="/lms/library" className="btn-secondary">
        <BookOpen className="w-4 h-4" /> Materials Library
      </Link>
    </>
  );

  return (
    <div className="animate-fade-in">
      {manage ? (
        <PageHeader
          title="LMS — Courses"
          description="Manage online courses, lessons and learning materials."
          action="New Course"
          actionHref="/lms/new"
          actionIcon={<Plus className="w-4 h-4" />}
        >
          {links}
        </PageHeader>
      ) : (
        <PageHeader title="LMS — Courses" description="Your online courses, lessons and learning materials.">
          {links}
        </PageHeader>
      )}

      {items.length === 0 ? (
        <div className="card py-16 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900">No courses yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            {manage ? "Build your first course with modules and lessons." : "No courses have been published yet."}
          </p>
          {manage && (
            <Link href="/lms/new" className="btn-primary mt-4">
              <Plus className="w-4 h-4" /> New Course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <Link key={c.id} href={`/lms/${c.id}`} className="card p-5 block hover:shadow-md transition-shadow">
              <div className="h-24 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 mb-3 flex items-center justify-center text-white">
                <BookOpen className="w-10 h-10 opacity-60" />
              </div>
              <div className="font-bold text-slate-900 line-clamp-1">{c.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {c.classId ? classMap.get(c.classId) : "All classes"} · {countMap.get(c.id) ?? 0} lessons
              </div>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.description}</p>
              <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                <span>
                  {c.startDate ? formatDate(c.startDate) : "—"} - {c.endDate ? formatDate(c.endDate) : "—"}
                </span>
                {c.isPublished ? <span className="badge badge-green">Published</span> : <span className="badge badge-slate">Draft</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
