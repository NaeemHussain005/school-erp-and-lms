import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, classes, sections, academicSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq, inArray, like } from "drizzle-orm";
import { canImportStudents, cleanGender, fixPhone, parseDateStr } from "@/lib/student-import";
import { logAudit } from "@/lib/audit";

export const maxDuration = 30;

const bad = (msg: string, status = 400) => NextResponse.json({ ok: false, error: msg }, { status });

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return bad("Unauthorized", 401);
    if (!canImportStudents(session)) return bad("You do not have permission to import students", 403);
    const schoolId = session.schoolId;

    const body = await req.json();
    const rows: any[] = Array.isArray(body?.rows) ? body.rows : [];
    const dryRun = body?.dryRun !== false; // only an explicit false really imports
    if (rows.length === 0) return bad("The file has no student rows");
    if (rows.length > 300) return bad("Maximum 300 students per file. Please split the file.");

    const [classRows, sectionRows, current] = await Promise.all([
      db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)),
      db.select({ id: sections.id, classId: sections.classId, name: sections.name }).from(sections).where(eq(sections.schoolId, schoolId)),
      db
        .select({ id: academicSessions.id })
        .from(academicSessions)
        .where(and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.isCurrent, true)))
        .limit(1),
    ]);
    const classMap = new Map(classRows.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const sectionMap = new Map(sectionRows.map((s) => [`${s.classId}:${s.name.trim().toLowerCase()}`, s.id]));

    const str = (r: any, k: string, max: number) => String(r?.[k] ?? "").trim().slice(0, max);

    // admission numbers typed in the file: must be unique in the file and in the database
    const typedAdm = rows.map((r) => str(r, "admission_no", 50)).filter(Boolean);
    const takenInDb = new Set<string>();
    if (typedAdm.length > 0) {
      const found = await db
        .select({ n: students.admissionNo })
        .from(students)
        .where(inArray(students.admissionNo, typedAdm));
      found.forEach((f) => f.n && takenInDb.add(f.n));
    }

    const today = new Date().toISOString().slice(0, 10);
    const errors: { row: number; message: string }[] = [];
    const seenAdm = new Set<string>();
    const prepared: any[] = [];

    rows.forEach((r, i) => {
      const errs: string[] = [];

      const firstName = str(r, "first_name", 100);
      const lastName = str(r, "last_name", 100);
      if (!firstName) errs.push("first_name is required");
      if (!lastName) errs.push("last_name is required");

      const gender = cleanGender(r?.gender);
      if (gender === "invalid") errs.push("gender must be male, female or other");

      const dob = parseDateStr(r?.date_of_birth);
      if (dob === "invalid") errs.push("date_of_birth is not a valid date (use 2018-05-14 or 14/05/2018)");
      else if (dob && dob > today) errs.push("date_of_birth is in the future");

      const admDate = parseDateStr(r?.admission_date);
      if (admDate === "invalid") errs.push("admission_date is not a valid date");

      const email = str(r, "email", 255);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push("email is not valid");

      let classId: number | null = null;
      let sectionId: number | null = null;
      const className = str(r, "class", 100);
      const sectionName = str(r, "section", 50);
      if (className) {
        const cid = classMap.get(className.toLowerCase());
        if (!cid) errs.push(`class '${className}' not found`);
        else {
          classId = cid;
          if (sectionName) {
            const sid = sectionMap.get(`${cid}:${sectionName.toLowerCase()}`);
            if (!sid) errs.push(`section '${sectionName}' not found in ${className}`);
            else sectionId = sid;
          }
        }
      } else if (sectionName) {
        errs.push("section given without a class");
      }

      const adm = str(r, "admission_no", 50);
      if (adm) {
        if (takenInDb.has(adm)) errs.push(`admission_no '${adm}' already exists`);
        else if (seenAdm.has(adm.toLowerCase())) errs.push(`admission_no '${adm}' is repeated in the file`);
        seenAdm.add(adm.toLowerCase());
      }

      if (errs.length > 0) {
        errors.push({ row: i + 2, message: errs.join("; ") });
        return;
      }

      prepared.push({
        schoolId,
        admissionNo: adm || null,
        rollNo: str(r, "roll_no", 50) || null,
        firstName,
        lastName,
        fatherName: str(r, "father_name", 200) || null,
        motherName: str(r, "mother_name", 200) || null,
        gender: gender || null,
        dateOfBirth: dob,
        cnic: str(r, "cnic", 30) || null,
        bloodGroup: str(r, "blood_group", 10) || null,
        phone: fixPhone(r?.phone),
        email: email || null,
        address: str(r, "address", 2000) || null,
        admissionDate: admDate || today,
        classId,
        sectionId,
        academicSessionId: current[0]?.id ?? null,
        admissionStatus: "admitted",
        isActive: true,
      });
    });

    if (errors.length > 0) {
      return NextResponse.json({
        ok: false,
        total: rows.length,
        errorCount: errors.length,
        errors: errors.slice(0, 200),
      });
    }

    if (dryRun) return NextResponse.json({ ok: true, ready: prepared.length });

    // generate admission numbers like ADM-2026-0002 for the rows that have none
    const year = new Date().getFullYear();
    const prefix = `ADM-${year}-`;
    const existing = await db
      .select({ n: students.admissionNo })
      .from(students)
      .where(like(students.admissionNo, prefix + "%"));
    let max = 0;
    for (const e of existing) {
      const m = /(\d+)$/.exec(e.n || "");
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    for (const p of prepared) {
      if (!p.admissionNo) {
        max += 1;
        p.admissionNo = prefix + String(max).padStart(4, "0");
      }
    }

    try {
      await db.insert(students).values(prepared as any);
    } catch (e: any) {
      const code = e?.code || e?.cause?.code;
      if (code === "23505") {
        return bad("An admission number in the file is already in use. Nothing was imported. Please check the admission_no column.");
      }
      throw e;
    }

    await logAudit(session, "students.import", "student", null, { count: prepared.length }, req);

    return NextResponse.json({ ok: true, created: prepared.length });
  } catch (err: any) {
    console.error("Student import error:", err);
    return bad("Could not import students", 500);
  }
}
