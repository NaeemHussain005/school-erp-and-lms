// Roles allowed to manage calendar events (same set as other modules)
const EVENT_MANAGE_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "teacher",
];

export function canManageEvents(session: any): boolean {
  if (!session) return false;
  if (session.isSuperAdmin) return true;
  return EVENT_MANAGE_ROLES.includes(session.role);
}

export const EVENT_AUDIENCES: { value: string; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "teachers", label: "Teachers" },
  { value: "parents", label: "Parents" },
  { value: "students", label: "Students" },
];

const AUDIENCE_VALUES = EVENT_AUDIENCES.map((a) => a.value);

function posIntOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Parse a datetime-local / date string into a Date, or null if empty.
// Invalid -> "invalid" so the caller can reject it.
function parseDateTime(v: any): Date | null | "invalid" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? "invalid" : d;
}

export type CleanEventData = {
  title: string;
  description: string | null;
  location: string | null;
  audience: string;
  classId: number | null;
  startDate: Date | null;
  endDate: Date | null;
};

type CleanResult = { error: string } | { data: CleanEventData };

export function cleanEvent(body: any): CleanResult {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };

  const title = String(body.title ?? "").trim().slice(0, 255);
  if (!title) return { error: "Please enter a title" };

  const descRaw = String(body.description ?? "").trim();
  const description = descRaw.length ? descRaw : null;

  const locRaw = String(body.location ?? "").trim().slice(0, 255);
  const location = locRaw.length ? locRaw : null;

  const audience = String(body.audience ?? "all").trim();
  if (!AUDIENCE_VALUES.includes(audience)) return { error: "Please select a valid audience" };

  const classId = posIntOrNull(body.classId);

  const startDate = parseDateTime(body.startDate);
  if (startDate === "invalid") return { error: "Start date is not valid" };
  if (!startDate) return { error: "Please choose a start date" };

  const endDate = parseDateTime(body.endDate);
  if (endDate === "invalid") return { error: "End date is not valid" };

  if (endDate && endDate.getTime() < startDate.getTime()) {
    return { error: "End date cannot be before the start date" };
  }

  return {
    data: { title, description, location, audience, classId, startDate, endDate },
  };
}
