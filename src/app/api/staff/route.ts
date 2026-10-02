import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, teacherProfiles, staffProfiles } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { generateEmployeeId } from "@/lib/auth-extra";

const MANAGER_ROLES = ["super_admin", "school_admin", "principal", "vice_principal", "hr_manager"];
const BLOCKED_NEW_ROLES = ["super_admin", "parent", "student"];

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const schoolId = session.schoolId;
    if (!schoolId) return NextResponse.json({ error: "No school" }, { status: 400 });

    if (!session.isSuperAdmin && !MANAGER_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "You do not have permission to add staff" }, { status: 403 });
    }

    const body = await req.json();

    if (!body.role || BLOCKED_NEW_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role for staff" }, { status: 400 });
    }
    if (!String(body.firstName || "").trim()) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }

    const passwordHash = await hashPassword(body.password || "changeme123");

    const inserted = await db
      .insert(users)
      .values({
        schoolId,
        email: body.email || null,
        username: body.username || body.email || `user_${Date.now()}`,
        passwordHash,
        role: body.role,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone || null,
        gender: body.gender || null,
        isActive: true,
      })
      .returning({ id: users.id });
    const userId = inserted[0].id;

    const profileData = {
      userId,
      employeeId: body.employeeId || generateEmployeeId(userId),
      designation: body.designation || null,
      joiningDate: body.joiningDate || null,
      salary: body.salary || null,
    };
    if (body.role === "teacher" || body.role === "principal" || body.role === "vice_principal") {
      await db.insert(teacherProfiles).values(profileData);
    } else {
      await db.insert(staffProfiles).values(profileData);
    }

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error("Create staff error:", err);
    const code = err?.code || err?.cause?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "This email or username is already used by another user" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create staff. Please check the details and try again." }, { status: 500 });
  }
}
