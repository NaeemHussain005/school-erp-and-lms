import { db } from "@/db";
import { timetableSlots } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// Roles allowed to manage the timetable (same set as other modules)
const TIMETABLE_MANAGE_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "teacher",
];

export function canManageTimetable(session: any): boolean {
  if (!session) return false;
  return TIMETABLE_MANAGE_ROLES.includes(session.role);
}

// Working days — Monday..Saturday. Values match schema's dayOfWeek (0=Sunday..6=Saturday).
// Grid and dropdowns both use this so names/numbers never drift apart.
export const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const DAY_VALUES = DAYS.map((d) => d.value);

// 24-hour HH:MM
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function posInt(v: any): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export type CleanSlotData = {
  classId: number;
  sectionId: number;
  subjectId: number;
  teacherId: number;
  dayOfWeek: number;
  periodNo: number;
  startTime: string;
  endTime: string;
  roomNo: string | null;
};

type CleanResult = { error: string } | { data: CleanSlotData };

// Validates one timetable slot coming from the client.
// schoolId / academicSessionId are injected by the route, not here.
export function cleanSlot(body: any): CleanResult {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };

  const classId = posInt(body.classId);
  if (!classId) return { error: "Please select a class" };

  const sectionId = posInt(body.sectionId);
  if (!sectionId) return { error: "Please select a section" };

  const subjectId = posInt(body.subjectId);
  if (!subjectId) return { error: "Please select a subject" };

  const teacherId = posInt(body.teacherId);
  if (!teacherId) return { error: "Please select a teacher" };

  const dayOfWeek = Number(body.dayOfWeek);
  if (!DAY_VALUES.includes(dayOfWeek)) return { error: "Please select a valid day" };

  const periodNo = posInt(body.periodNo);
  if (!periodNo) return { error: "Please provide a valid period number" };

  const startTime = String(body.startTime ?? "").trim();
  const endTime = String(body.endTime ?? "").trim();
  if (!TIME_RE.test(startTime)) return { error: "Start time must be in HH:MM format" };
  if (!TIME_RE.test(endTime)) return { error: "End time must be in HH:MM format" };
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return { error: "End time must be after start time" };
  }

  const roomNoRaw = String(body.roomNo ?? "").trim();
  const roomNo = roomNoRaw.length ? roomNoRaw.slice(0, 20) : null;

  return {
    data: { classId, sectionId, subjectId, teacherId, dayOfWeek, periodNo, startTime, endTime, roomNo },
  };
}

// Returns a human-readable message if this slot clashes with an existing one,
// otherwise null. excludeId lets an edit ignore the row being edited.
export async function findSlotConflict(params: {
  schoolId: number;
  classId: number;
  sectionId: number;
  teacherId: number;
  dayOfWeek: number;
  periodNo: number;
  excludeId?: number;
}): Promise<string | null> {
  const rows = await db
    .select()
    .from(timetableSlots)
    .where(
      and(
        eq(timetableSlots.schoolId, params.schoolId),
        eq(timetableSlots.dayOfWeek, params.dayOfWeek),
        eq(timetableSlots.periodNo, params.periodNo),
      ),
    );

  for (const r of rows) {
    if (params.excludeId && r.id === params.excludeId) continue;
    if (r.teacherId === params.teacherId) {
      return "This teacher is already booked for this day and period.";
    }
    if (r.classId === params.classId && r.sectionId === params.sectionId) {
      return "This class & section already has a slot for this day and period.";
    }
  }
  return null;
}
