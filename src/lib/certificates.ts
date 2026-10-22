// Roles allowed to issue certificates
const CERTIFICATE_MANAGE_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
];

export function canManageCertificates(session: any): boolean {
  if (!session) return false;
  if (session.isSuperAdmin) return true;
  return CERTIFICATE_MANAGE_ROLES.includes(session.role);
}

export const CERTIFICATE_TYPES: { value: string; label: string }[] = [
  { value: "bonafide", label: "Bonafide Certificate" },
  { value: "character", label: "Character Certificate" },
  { value: "leaving", label: "School Leaving Certificate" },
  { value: "transfer", label: "Transfer Certificate" },
  { value: "provisional", label: "Provisional Certificate" },
  { value: "other", label: "Other" },
];

const TYPE_VALUES = CERTIFICATE_TYPES.map((t) => t.value);

function posInt(v: any): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseDate(v: any): Date | null | "invalid" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? "invalid" : d;
}

export type CleanCertificateData = {
  studentId: number;
  type: string;
  title: string | null;
  certificateNo: string | null;
  issueDate: Date | null;
};

type CleanResult = { error: string } | { data: CleanCertificateData };

export function cleanCertificate(body: any): CleanResult {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };

  const studentId = posInt(body.studentId);
  if (!studentId) return { error: "Please select a student" };

  const type = String(body.type ?? "").trim();
  if (!TYPE_VALUES.includes(type)) return { error: "Please select a valid certificate type" };

  const titleRaw = String(body.title ?? "").trim().slice(0, 255);
  const title = titleRaw.length ? titleRaw : null;

  const certRaw = String(body.certificateNo ?? "").trim().slice(0, 50);
  const certificateNo = certRaw.length ? certRaw : null;

  const issueDate = parseDate(body.issueDate);
  if (issueDate === "invalid") return { error: "Issue date is not valid" };

  return {
    data: { studentId, type, title, certificateNo, issueDate },
  };
}

export function certificateTypeLabel(value: string): string {
  return CERTIFICATE_TYPES.find((t) => t.value === value)?.label || value;
}
