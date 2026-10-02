import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, teacherProfiles, staffProfiles } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

const MANAGER_ROLES = ["super_admin", "school_admin", "principal", "vice_principal", "hr_manager"];
const TEACHER_GROUP = ["teacher", "principal", "vice_principal"];

function canManage(session: any) {
  return !!session?.isSuperAdmin || MANAGER_ROLES.includes(session?.role);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManage(session)) return NextResponse.json({ error: "You do not have permission to edit staff" }, { status: 403 });

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json();

    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.schoolId, session.schoolId)))
      .limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    const target = rows[0];

    const myId = session.userId ?? session.id;
    if (body.isActive === false && target.id === myId) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    const firstName = String(body.firstName || "").trim();
    if (!firstName) return NextResponse.json({ error: "First name is required" }, { status: 400 });

    let salary: string | null = null;
    if (body.salary !== undefined && body.salary !== null && body.salary !== "") {
      const n = Number(body.salary);
      if (isNaN(n) || n < 0) return NextResponse.json({ error: "Invalid salary" }, { status: 400 });
      salary = n.toFixed(2);
    }

    const userUpdate: any = {
      firstName,
      lastName: String(body.lastName || "").trim() || null,
      email: String(body.email || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      gender: body.gender || null,
      updatedAt: new Date(),
    };
    if (typeof body.isActive === "boolean") userUpdate.isActive = body.isActive;
    if (body.password) {
      if (String(body.password).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      userUpdate.passwordHash = await hashPassword(String(body.password));
    }

    await db
      .update(users)
      .set(userUpdate)
      .where(and(eq(users.id, userId), eq(users.schoolId, session.schoolId)));

    const profileValues: any = {
      designation: String(body.designation || "").trim() || null,
      joiningDate: body.joiningDate || null,
      salary,
    };
    if (body.employeeId && String(body.employeeId).trim()) {
      profileValues.employeeId = String(body.employeeId).trim();
    }

    if (TEACHER_GROUP.includes(target.role as string)) {
      const existing = await db.select({ id: teacherProfiles.id }).from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
      if (existing.length > 0) {
        await db.update(teacherProfiles).set(profileValues).where(eq(teacherProfiles.userId, userId));
      } else {
        await db.insert(teacherProfiles).values({ userId, ...profileValues });
      }
    } else {
      const existing = await db.select({ id: staffProfiles.id }).from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
      if (existing.length > 0) {
        await db.update(staffProfiles).set(profileValues).where(eq(staffProfiles.userId, userId));
      } else {
        await db.insert(staffProfiles).values({ userId, ...profileValues });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update staff error:", err);
    const msg = /unique|duplicate/i.test(err?.message || "") ? "This email is already used by another user" : err.message;
    return NextResponse.json({ error: msg || "Could not update staff" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getSession();
    if (!session?.schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManage(session)) return NextResponse.json({ error: "You do not have permission to delete staff" }, { status: 403 });

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const myId = session.userId ?? session.id;
    if (userId === myId) return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });

    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.schoolId, session.schoolId)))
      .limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    try {
      await db.delete(users).where(and(eq(users.id, userId), eq(users.schoolId, session.schoolId)));
    } catch (e: any) {
      const linked = e?.code === "23503" || e?.cause?.code === "23503" || /foreign key/i.test(e?.message || "");
      if (linked) {
        return NextResponse.json(
          { error: "This staff member has linked records (classes, attendance, etc.). Please Deactivate instead of deleting." },
          { status: 400 }
        );
      }
      throw e;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete staff error:", err);
    return NextResponse.json({ error: err.message || "Could not delete staff" }, { status: 500 });
  }
}
