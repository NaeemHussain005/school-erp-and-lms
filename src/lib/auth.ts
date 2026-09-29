import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, schools, setupProgress, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "school-erp-lms-super-secret-key-change-in-production-2026"
);
const COOKIE_NAME = "school_session";

export interface SessionUser {
  id: number;
  schoolId: number | null;
  branchId: number | null;
  email: string | null;
  username: string | null;
  role: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isSuperAdmin: boolean;
  photoUrl: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.isSuperAdmin) return session;
  if (!roles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function getCurrentSchool() {
  const session = await getSession();
  if (!session?.schoolId) return null;
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, session.schoolId))
    .limit(1);
  return school || null;
}

export async function ensureBootstrap() {
  const existingSchools = await db.select().from(schools).limit(1);
  if (existingSchools.length > 0) return existingSchools[0];

  try {
    // Create a default school
    const [school] = await db
      .insert(schools)
      .values({
        name: "My School",
        currency: "PKR",
        timezone: "Asia/Karachi",
        primaryColor: "#2563eb",
      })
      .returning();

    // Create a main branch
    await db.insert(branches).values({
      schoolId: school.id,
      name: "Main Campus",
      isMain: true,
    });

    // Create admin user
    const passwordHash = await hashPassword("admin123");
    await db.insert(users).values({
      schoolId: school.id,
      email: "admin@school.com",
      username: "admin",
      passwordHash,
      role: "school_admin",
      firstName: "School",
      lastName: "Administrator",
      isActive: true,
    });

    // Setup progress row
    await db.insert(setupProgress).values({ schoolId: school.id, currentStep: 1 });

    return school;
  } catch (err) {
    // Another concurrent request already created the school/admin — just return it
    const [school] = await db.select().from(schools).limit(1);
    if (school) return school;
    throw err;
  }
}