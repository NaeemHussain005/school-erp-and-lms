// Roles allowed to post announcements (same set as timetable/assignments)
const ANNOUNCEMENT_MANAGE_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "teacher",
];

export function canManageAnnouncements(session: any): boolean {
  if (!session) return false;
  if (session.isSuperAdmin) return true;
  return ANNOUNCEMENT_MANAGE_ROLES.includes(session.role);
}

export const AUDIENCES: { value: string; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "teachers", label: "Teachers" },
  { value: "parents", label: "Parents" },
  { value: "students", label: "Students" },
];

export const PRIORITIES: { value: string; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const AUDIENCE_VALUES = AUDIENCES.map((a) => a.value);
const PRIORITY_VALUES = PRIORITIES.map((p) => p.value);

function posIntOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Parse an optional YYYY-MM-DD (or empty) into a Date or null.
// Invalid string -> returns the string "invalid" so the caller can reject it.
function parseDate(v: any): Date | null | "invalid" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? "invalid" : d;
}

export type CleanAnnouncementData = {
  title: string;
  message: string;
  audience: string;
  classId: number | null;
  sectionId: number | null;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
};

type CleanResult = { error: string } | { data: CleanAnnouncementData };

export function cleanAnnouncement(body: any): CleanResult {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };

  const title = String(body.title ?? "").trim().slice(0, 255);
  if (!title) return { error: "Please enter a title" };

  const message = String(body.message ?? "").trim();
  if (!message) return { error: "Please enter a message" };

  const audience = String(body.audience ?? "all").trim();
  if (!AUDIENCE_VALUES.includes(audience)) return { error: "Please select a valid audience" };

  const priority = String(body.priority ?? "normal").trim();
  if (!PRIORITY_VALUES.includes(priority)) return { error: "Please select a valid priority" };

  const classId = posIntOrNull(body.classId);
  const sectionId = posIntOrNull(body.sectionId);

  const startDate = parseDate(body.startDate);
  if (startDate === "invalid") return { error: "Start date is not valid" };
  const endDate = parseDate(body.endDate);
  if (endDate === "invalid") return { error: "End date is not valid" };

  if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
    return { error: "End date cannot be before the start date" };
  }

  return {
    data: { title, message, audience, classId, sectionId, priority, startDate, endDate },
  };
}
