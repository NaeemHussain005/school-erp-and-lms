import { NextResponse } from "next/server";
import { db } from "@/db";
import { exams, students, results } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import { canEnterMarks, gradeFor } from "@/lib/exams";

type Entry = {
  studentId: number;
  obtained: number | null;
  present: boolean;
  percentage: number | null;
  grade: string | null;
  position: number | null;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canEnterMarks(session)) {
      return NextResponse.json({ error: "You do not have permission to enter marks" }, { status: 403 });
    }
    const schoolId = session.schoolId;

    const { id } = await params;
    const examId = parseInt(id);
    if (isNaN(examId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const examRows = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.schoolId, schoolId)))
      .limit(1);
    if (examRows.length === 0) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    const exam = examRows[0];
    if (!exam.classId) return NextResponse.json({ error: "This exam has no class" }, { status: 400 });

    const body = await req.json();
    if (!Array.isArray(body.marks)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if (body.marks.length > 300) return NextResponse.json({ error: "Too many students" }, { status: 400 });

    const stuRows = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.schoolId, schoolId),
          eq(students.classId, exam.classId),
          exam.sectionId ? eq(students.sectionId, exam.sectionId) : undefined
        )
      );
    const valid = new Set(stuRows.map((s) => s.id));

    const total = exam.totalMarks ?? 100;
    const pass = exam.passMarks ?? 33;

    const entries: Entry[] = [];
    const clearIds: number[] = [];
    const seen = new Set<number>();

    for (const m of body.marks) {
      const sid = parseInt(m?.studentId);
      if (isNaN(sid) || !valid.has(sid)) {
        return NextResponse.json({ error: "A student in the list does not belong to this class" }, { status: 400 });
      }
      if (seen.has(sid)) continue;
      seen.add(sid);

      if (m.absent === true) {
        entries.push({ studentId: sid, obtained: null, present: false, percentage: null, grade: "AB", position: null });
        continue;
      }
      const raw = m.obtained;
      if (raw === "" || raw === null || raw === undefined) {
        clearIds.push(sid);
        continue;
      }
      const n = Number(raw);
      if (isNaN(n) || n < 0 || n > total) {
        return NextResponse.json({ error: `Marks must be between 0 and ${total}` }, { status: 400 });
      }
      const g = gradeFor(n, total, pass);
      entries.push({ studentId: sid, obtained: n, present: true, percentage: g.percentage, grade: g.grade, position: null });
    }

    // positions (equal marks share the same position)
    const ranked = entries.filter((e) => e.present && e.obtained !== null).sort((a, b) => b.obtained! - a.obtained!);
    ranked.forEach((e, i) => {
      e.position = i > 0 && ranked[i - 1].obtained === e.obtained ? ranked[i - 1].position : i + 1;
    });

    const existingRows = await db
      .select({ id: results.id, studentId: results.studentId })
      .from(results)
      .where(and(eq(results.examId, examId), eq(results.schoolId, schoolId)));
    const existingMap = new Map(existingRows.map((r) => [r.studentId, r.id]));

    const toInsert: any[] = [];
    const updates: Promise<any>[] = [];

    for (const e of entries) {
      const common = {
        classId: exam.classId,
        subjectId: exam.subjectId,
        totalMarks: total,
        obtainedMarks: e.obtained !== null ? e.obtained.toFixed(2) : null,
        percentage: e.percentage !== null ? e.percentage.toFixed(2) : null,
        grade: e.grade,
        isPresent: e.present,
        position: e.position,
      };
      const existingId = existingMap.get(e.studentId);
      if (existingId) {
        updates.push(db.update(results).set(common as any).where(eq(results.id, existingId)));
      } else {
        toInsert.push({
          ...common,
          schoolId,
          studentId: e.studentId,
          examId,
          academicSessionId: exam.academicSessionId,
          isPublished: !!exam.isPublished,
          createdById: session.userId ?? session.id ?? null,
        });
      }
    }

    await Promise.all(updates);
    if (toInsert.length > 0) await db.insert(results).values(toInsert as any);

    const deleteIds = clearIds.map((sid) => existingMap.get(sid)).filter((x): x is number => !!x);
    if (deleteIds.length > 0) await db.delete(results).where(inArray(results.id, deleteIds));

    return NextResponse.json({ success: true, saved: entries.length });
  } catch (err: any) {
    console.error("Save marks error:", err);
    return NextResponse.json({ error: "Could not save marks" }, { status: 500 });
  }
}
