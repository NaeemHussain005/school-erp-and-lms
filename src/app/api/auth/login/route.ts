import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { verifyPassword, createSession, getRoleHome, ensureBootstrap } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureBootstrap();
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, email)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const u = user[0];
    if (!u.isActive) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }
    const ok = await verifyPassword(password, u.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, u.id));

    await createSession({
      id: u.id,
      schoolId: u.schoolId,
      branchId: u.branchId,
      email: u.email,
      username: u.username,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      isSuperAdmin: u.isSuperAdmin || u.role === "super_admin",
      photoUrl: u.photoUrl,
    });

    return NextResponse.json({
      success: true,
      user: { id: u.id, role: u.role, name: u.firstName },
      redirect: getRoleHome(u.role),
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
