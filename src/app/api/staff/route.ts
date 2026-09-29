import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, teacherProfiles, staffProfiles } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { generateEmployeeId } from "@/lib/auth-extra";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const schoolId = session.schoolId;
    if (!schoolId) return NextResponse.json({ error: "No school" }, { status: 400 });

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
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to create staff" }, { status: 500 });
  }
}
