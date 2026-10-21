import { db } from "@/db";
import { learningMaterials, classes, subjects } from "@/db/schema";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import LibraryManager from "@/components/LibraryManager";
import { canManageLms } from "@/lib/lms";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  type?: string;
  class?: string;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session: any = await requireAuth();
  const schoolId = session.schoolId!;
  const manage = canManageLms(session);
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const typeFilter = sp.type || "";
  const classFilter = sp.class ? parseInt(sp.class) : null;

  const whereClause = and(
    eq(learningMaterials.schoolId, schoolId),
    manage ? undefined : eq(learningMaterials.isPublic, true),
    typeFilter ? eq(learningMaterials.type, typeFilter) : undefined,
    classFilter ? eq(learningMaterials.classId, classFilter) : undefined,
    q
      ? or(
          ilike(learningMaterials.title, `%${q}%`),
          ilike(learningMaterials.description, `%${q}%`)
        )
      : undefined
  );

  const [materialRows, classRows, subjectRows] = await Promise.all([
    db
      .select()
      .from(learningMaterials)
      .where(whereClause)
      .orderBy(desc(learningMaterials.createdAt))
      .limit(500),
    db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(asc(classes.name)),
    db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(eq(subjects.schoolId, schoolId))
      .orderBy(asc(subjects.name)),
  ]);

  const classMap = new Map(classRows.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjectRows.map((s) => [s.id, s.name]));

  const items = materialRows.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description || "",
    type: m.type,
    classId: m.classId,
    subjectId: m.subjectId,
    className: m.classId ? classMap.get(m.classId) || "" : "",
    subjectName: m.subjectId ? subjectMap.get(m.subjectId) || "" : "",
    fileUrl: m.fileUrl || "",
    externalUrl: m.externalUrl || "",
    isPublic: !!m.isPublic,
  }));

  return (
    <div className="animate-fade-in">
      <LibraryManager
        items={items}
        classes={classRows}
        subjects={subjectRows}
        canManage={manage}
        filters={{ q, type: typeFilter, classId: classFilter ? String(classFilter) : "" }}
      />
    </div>
  );
}
